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
    this.acceptPartials = options.acceptPartials ?? false;
    this.reset();
  }

  reset() {
    this.stableText = "";
    this.pendingText = "";
    this.startMs = null;
    this.endMs = null;
  }

  combinedText() {
    if (!this.pendingText) return this.stableText;
    if (!this.stableText) return this.pendingText;
    return `${this.stableText} ${this.pendingText}`.trim();
  }

  addTranscript(transcript) {
    console.log("🔵 ChunkBuffer - addTranscript called:", {
      hasTranscript: !!transcript,
      status: transcript?.status,
      hasText: !!transcript?.text,
      textLength: transcript?.text?.length || 0,
      acceptPartials: this.acceptPartials,
    });

    if (!transcript) {
      console.log("🔵 ChunkBuffer - No transcript provided");
      return null;
    }

    if (transcript.status !== "final" && !this.acceptPartials) {
      console.log("🔵 ChunkBuffer - Ignoring non-final transcript:", {
        status: transcript.status,
        acceptPartials: this.acceptPartials,
      });
      return null;
    }

    const text = normalizeWhitespace(transcript.text || "");
    if (!text) {
      console.log("🔵 ChunkBuffer - No text after normalization");
      return null;
    }

    const startMs = transcript?.timestamp?.startMs;
    const endMs = transcript?.timestamp?.endMs;

    console.log("🔵 ChunkBuffer - Processing transcript:", {
      status: transcript.status,
      textLength: text.length,
      currentTokenCount: this.tokenCount(),
      tokenLimit: this.tokenLimit,
      textPreview: text.substring(0, 50),
    });

    if (this.endMs !== null && startMs !== undefined && startMs !== null) {
      const gapMs = startMs - this.endMs;
      if (this.silenceMs > 0 && gapMs > this.silenceMs) {
        console.log("🔵 ChunkBuffer - Silence detected, flushing");
        this.flush("silence");
      }
    }

    if (transcript.status === "final") {
      if (!this.stableText) {
        this.stableText = text;
      } else {
        this.stableText = `${this.stableText} ${text}`.trim();
      }
      this.pendingText = "";
      console.log("🔵 ChunkBuffer - Added final text:", {
        stableTextLength: this.stableText.length,
        stableTextPreview: this.stableText.substring(0, 100),
      });
    } else {
      this.pendingText = text;
    }

    if (this.startMs === null && typeof startMs === "number") {
      this.startMs = startMs;
    }

    if (typeof endMs === "number") {
      this.endMs = endMs;
    } else if (typeof startMs === "number") {
      this.endMs = startMs;
    }

    const combined = this.combinedText();
    console.log("🔵 ChunkBuffer - Current state:", {
      combinedTextLength: combined.length,
      tokenCount: this.tokenCount(),
      endsWithPunctuation: SENTENCE_END_RE.test(combined),
    });

    if (SENTENCE_END_RE.test(combined)) {
      console.log("🔵 ChunkBuffer - Sentence end detected, flushing");
      return this.flush("sentence");
    }

    if (this.tokenLimit > 0 && this.tokenCount() >= this.tokenLimit) {
      console.log("🔵 ChunkBuffer - Token limit reached, flushing");
      return this.flush("token-limit");
    }

    console.log("🔵 ChunkBuffer - Transcript added, waiting for more");
    return null;
  }

  tokenCount() {
    const text = this.combinedText();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }

  flush(reason = "manual") {
    const text = this.combinedText();
    if (!text) {
      console.log("🔵 ChunkBuffer - Flush called but no text to flush");
      return null;
    }

    const chunk = {
      content: text,
      timestamp: {
        startMs: this.startMs ?? 0,
        endMs: this.endMs ?? this.startMs ?? 0,
      },
      reason,
    };

    console.log("🔵 ChunkBuffer - Flushing chunk:", {
      reason,
      contentLength: text.length,
      tokenCount: this.tokenCount(),
      contentPreview: text.substring(0, 50),
    });

    this.emit("chunk", chunk);
    this.reset();
    return chunk;
  }
}

module.exports = {
  ChunkBufferService,
};
