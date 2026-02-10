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
    this.bufferFactory =
      options.bufferFactory ||
      (() => new ChunkBufferService(options.bufferOptions));

    this.lectureStates = new Map();

    this.sessionManager.on("session-ended", (session) => {
      this.endLecture(session.lectureId, session.reason);
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

  endLecture(lectureId, reason = "ended") {
    const state = this.lectureStates.get(lectureId);
    if (!state) return null;

    state.buffer.flush("session-end");
    this.lectureStates.delete(lectureId);
    this.emit("lecture-ended", { lectureId, reason });
    return state;
  }

  handleTranscript(lectureId, transcript) {
    const state = this.getOrCreateState(lectureId);
    state.buffer.addTranscript(transcript);
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

    const { error } = await this.chunkModel.insertChunk(payload);
    if (error) {
      throw new Error(error.message);
    }

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
