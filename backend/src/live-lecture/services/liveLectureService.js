const { EventEmitter } = require("events");

const ResourceTextChunkModel = require("../../models/resourceTextChunkModel");
const { ChunkBufferService } = require("./chunkBufferService");
const { SessionManagerService } = require("./sessionManagerService");

const tokenCount = (text) => {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
};

class LiveLectureService extends EventEmitter {
  constructor(options = {}) {
    super();

    this.sessionManager =
      options.sessionManager ||
      new SessionManagerService(options.sessionOptions);
    this.chunkModel = options.chunkModel || new ResourceTextChunkModel();
    this.endGraceMs =
      options.endGraceMs ||
      Number(process.env.LIVE_LECTURE_END_GRACE_MS) ||
      5000;
    const resolvedBufferOptions = {
      acceptPartials: false,
      ...(options.bufferOptions || {}),
    };
    this.bufferFactory =
      options.bufferFactory ||
      (() => new ChunkBufferService(resolvedBufferOptions));

    this.lectureStates = new Map();

    this.sessionManager.on("session-ended", (session) => {
      this.requestEndLecture(session.lectureId, session.reason);
    });
  }

  startLecture(lectureId, metadata = {}) {
    if (!lectureId) {
      throw new Error("lectureId is required");
    }

    const existing = this.lectureStates.get(lectureId);
    if (existing) {
      return existing;
    }

    this.sessionManager.startSession(lectureId, metadata);

    const buffer = this.bufferFactory();
    const state = {
      lectureId,
      resourceId: metadata.resourceId || lectureId,
      buffer,
      chunkIndex: 1,
      ending: false,
      endReason: null,
      endTimer: null,
    };

    buffer.on("chunk", (chunk) => {
      this.persistChunk(state, chunk).catch((error) => {
        this.emit("error", error);
      });
    });

    this.lectureStates.set(lectureId, state);
    this.emit("lecture-started", state);
    return state;
  }

  async endLecture(lectureId, reason = "ended") {
    const state = this.lectureStates.get(lectureId);
    if (!state) {
      console.log("🛑 LiveLectureService - No state found for:", lectureId);
      return null;
    }

    console.log("🛑 LiveLectureService - Ending lecture:", {
      lectureId,
      reason,
      bufferHasText: !!state.buffer.combinedText(),
    });

    if (state.endTimer) {
      clearTimeout(state.endTimer);
      state.endTimer = null;
    }

    console.log("🛑 LiveLectureService - Flushing final chunk");
    const flushed = state.buffer.flush("session-end");
    console.log("🛑 LiveLectureService - Flush result:", {
      hasFlushedContent: !!flushed,
      contentLength: flushed?.content?.length || 0,
    });

    // Trigger notes generation ONCE when lecture ends
    try {
      const notesService = require("../../services/notesService");
      await notesService.generateNotes(state.resourceId);
      console.log(
        `[LiveLectureService] Notes generation triggered for resource ${state.resourceId}`,
      );
    } catch (err) {
      console.error(
        `[LiveLectureService] Notes generation failed for resource ${state.resourceId}: ${err.message}`,
      );
    }

    this.lectureStates.delete(lectureId);
    this.emit("lecture-ended", { lectureId, reason });
    console.log("🛑 LiveLectureService - Lecture ended");

    return state;
  }

  requestEndLecture(lectureId, reason = "ended") {
    const state = this.lectureStates.get(lectureId);
    if (!state) return null;
    if (state.ending) return state;

    state.ending = true;
    state.endReason = reason;
    if (this.endGraceMs > 0) {
      state.endTimer = setTimeout(() => {
        this.endLecture(lectureId, reason);
      }, this.endGraceMs);
    }

    return state;
  }

  handleTranscript(lectureId, transcript) {
    if (!transcript) return;

    const { text, isFinal } = transcript;

    if (!isFinal || !text || !text.trim()) {
      console.log("⚠️ LiveLectureService - Ignoring transcript:", {
        lectureId,
        isFinal,
        hasText: !!text,
      });
      return;
    }

    const state = this.getOrCreateState(lectureId);

    console.log("✅ LiveLectureService - Final transcript (will persist):", {
      lectureId,
      textLength: text.length,
      text: text.substring(0, 50),
    });

    state.buffer.addTranscript({
      text: text.trim(),
      status: "final",
      timestamp: { startMs: transcript.startMs, endMs: transcript.endMs },
    });

    if (state.ending) {
      this.endLecture(lectureId, state.endReason || "ended");
    }
  }

  handleClientConnected(lectureId) {
    this.sessionManager.connectClient(lectureId);
  }

  handleClientDisconnected(lectureId) {
    this.sessionManager.disconnectClient(lectureId);
  }

  handleAsrConnected(lectureId) {
    this.sessionManager.markAsrConnected(lectureId);
  }

  handleAsrDisconnected(lectureId) {
    this.sessionManager.markAsrDisconnected(lectureId);
  }

  async persistChunk(state, chunk) {
    if (!chunk || !chunk.content) return null;

    const payload = {
      resource_id: state.resourceId,
      source_type: "live",
      chunk_type: "timestamp",
      chunk_index: state.chunkIndex,
      content: chunk.content,
      token_count: tokenCount(chunk.content),
      start_timestamp: chunk.timestamp?.startMs ?? null,
    };

    console.log("💾 LiveLectureService - Persisting chunk:", {
      lectureId: state.lectureId,
      chunkIndex: state.chunkIndex,
      startMs: payload.start_timestamp,
      tokenCount: payload.token_count,
      reason: chunk.reason,
      contentPreview: chunk.content.substring(0, 50),
    });

    const { error } = await this.chunkModel.insertChunk(payload);
    if (error) {
      console.error("❌ LiveLectureService - Chunk persist failed:", error);
      throw new Error(error.message);
    }

    console.log("✅ LiveLectureService - Chunk persisted successfully");
    state.chunkIndex += 1;
    this.emit("chunk-persisted", { lectureId: state.lectureId, payload });

    return payload;
  }

  async getLectureChunks(lectureId) {
    if (!lectureId) {
      throw new Error("lectureId is required");
    }

    const state = this.lectureStates.get(lectureId);
    const resourceId = state?.resourceId || lectureId;

    const { data, error } =
      await this.chunkModel.getChunksByResourceId(resourceId);
    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  getOrCreateState(lectureId) {
    return this.lectureStates.get(lectureId) || this.startLecture(lectureId);
  }
}

module.exports = {
  LiveLectureService,
};
