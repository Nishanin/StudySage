const { EventEmitter } = require("events");

const DEFAULT_SAMPLE_RATE = 16000;
const DEFAULT_WS_URL =
  process.env.ASSEMBLY_WS_URL || "wss://streaming.assemblyai.com/v3/ws";

class AssemblyAIRealtimeSocket extends EventEmitter {
  constructor(options = {}) {
    super();

    this.apiKey = options.apiKey || process.env.ASSEMBLY_AI_API_KEY;
    this.sampleRate = options.sampleRate || DEFAULT_SAMPLE_RATE;
    this.url = options.url || DEFAULT_WS_URL;
    this.formatTurns =
      options.formatTurns !== undefined ? options.formatTurns : true;
    this.WebSocketImpl = options.WebSocketImpl || global.WebSocket;
    this.socket = null;
  }

  async connect() {
    if (!this.apiKey) {
      throw new Error("ASSEMBLYAI_API_KEY is required");
    }

    if (!this.WebSocketImpl) {
      throw new Error("WebSocket implementation is required");
    }

    if (this.socket && this.socket.readyState === this.WebSocketImpl.OPEN) {
      return;
    }

    const url = new URL(this.url);
    url.searchParams.set("sample_rate", String(this.sampleRate));
    url.searchParams.set("encoding", "pcm_s16le");
    url.searchParams.set("format_turns", String(this.formatTurns));

    console.log("AssemblyAI WebSocket URL:", url.toString());

    this.socket = new this.WebSocketImpl(url.toString(), {
      headers: {
        Authorization: this.apiKey,
      },
    });

    this.socket.onopen = () => {
      console.log("AssemblyAI WS connected");
      this.emit("open");
    };

    this.socket.onclose = () => {
      console.log("AssemblyAI WS onclose event");
      this.emit("close");
    };

    this.socket.onerror = (error) => {
      this.emit("error", error);
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event?.data);
    };

    await new Promise((resolve, reject) => {
      const handleOpen = () => {
        cleanup();
        resolve();
      };
      const handleError = (error) => {
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        this.off("open", handleOpen);
        this.off("error", handleError);
      };

      this.on("open", handleOpen);
      this.on("error", handleError);
    });
  }

  sendTerminate() {
    if (!this.socket || this.socket.readyState !== this.WebSocketImpl.OPEN) {
      return;
    }

    try {
      console.log("🛑 Sending Terminate to AssemblyAI");
      this.socket.send(JSON.stringify({ type: "Terminate" }));
    } catch (error) {
      console.error("Error sending terminate_session:", error);
    }
  }

  close() {
    if (!this.socket) return;

    const ws = this.socket;
    this.socket = null;

    try {
      if (
        ws.readyState === this.WebSocketImpl.OPEN ||
        ws.readyState === this.WebSocketImpl.CLOSING
      ) {
        ws.close();
      }
    } catch (error) {
      console.error("Error closing socket:", error);
    }

    console.log("🛑 AssemblyAI socket closed");
  }

  sendAudio(chunk) {
    if (!this.socket || this.socket.readyState !== this.WebSocketImpl.OPEN) {
      return;
    }

    if (!chunk) return;

    // Audio is assumed to be 16-bit PCM, mono, signed int16; do not re-encode.
    const payload = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    this.socket.send(payload);
  }

  handleMessage(data) {
    if (!data) return;

    let payload = data;
    if (
      Buffer.isBuffer(data) ||
      data instanceof ArrayBuffer ||
      data instanceof Uint8Array
    ) {
      payload = Buffer.isBuffer(data)
        ? data.toString("utf8")
        : Buffer.from(data).toString("utf8");
    }

    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (error) {
        console.error("Failed to parse AssemblyAI message:", error);
        this.emit("error", error);
        return;
      }
    }

    // v3 API: only emit formatted end-of-turn transcripts
    if (
      payload?.type === "Turn" &&
      payload?.turn_is_formatted === true &&
      payload?.transcript &&
      payload.transcript.trim().length > 0
    ) {
      const words = payload.words;
      const startMs =
        Array.isArray(words) && words.length > 0 ? words[0].start : undefined;
      const endMs =
        Array.isArray(words) && words.length > 0
          ? words[words.length - 1].end
          : undefined;

      console.log("Final Transcript:", payload.transcript);
      this.emit("final-transcript", {
        text: payload.transcript,
        startMs,
        endMs,
      });
    }
  }
}

module.exports = {
  AssemblyAIRealtimeSocket,
};
