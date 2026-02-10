const { EventEmitter } = require("events");

const DEFAULT_SILENCE_MS = 2000;
const DEFAULT_TOKEN_LIMIT = 120;
const SENTENCE_END_RE = /[.!?]\s*$/;

const normalizeWhitespace = (text) => text.replace(/\s+/g, " ").trim();

class ChunkBufferService extends EventEmitter {
  constructor(options = {}) {
    super();

    this.silenceMs = options.silenceMs ?? DEFAULT_SILENCE_MS;
    this.tokenLimit = options.tokenLimit ?? DEFAULT_TOKEN_LIMIT;
    this.reset();
  }

  reset() {
    this.bufferText = "";
    this.startMs = null;
    this.endMs = null;
  }

  addTranscript(transcript) {
    if (!transcript || transcript.status !== "final") return null;

    const text = normalizeWhitespace(transcript.text || "");
    if (!text) return null;

    const startMs = transcript?.timestamp?.startMs;
    const endMs = transcript?.timestamp?.endMs;

    if (this.endMs !== null && startMs !== undefined && startMs !== null) {
      const gapMs = startMs - this.endMs;
      if (this.silenceMs > 0 && gapMs > this.silenceMs) {
        this.flush("silence");
      }
    }

    if (!this.bufferText) {
      this.bufferText = text;
    } else {
      this.bufferText = `${this.bufferText} ${text}`.trim();
    }

    if (this.startMs === null && typeof startMs === "number") {
      this.startMs = startMs;
    }

    if (typeof endMs === "number") {
      this.endMs = endMs;
    } else if (typeof startMs === "number") {
      this.endMs = startMs;
    }

    if (SENTENCE_END_RE.test(this.bufferText)) {
      return this.flush("sentence");
    }

    if (this.tokenLimit > 0 && this.tokenCount() >= this.tokenLimit) {
      return this.flush("token-limit");
    }

    return null;
  }

  tokenCount() {
    if (!this.bufferText) return 0;
    return this.bufferText.split(/\s+/).filter(Boolean).length;
  }

  flush(reason = "manual") {
    if (!this.bufferText) return null;

    const chunk = {
      content: this.bufferText,
      timestamp: {
        startMs: this.startMs ?? 0,
        endMs: this.endMs ?? this.startMs ?? 0,
      },
      reason,
    };

    this.emit("chunk", chunk);
    this.reset();
    return chunk;
  }
}

module.exports = {
  ChunkBufferService,
};
