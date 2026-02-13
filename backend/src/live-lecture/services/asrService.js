const { EventEmitter } = require("events");

const { AssemblyAIRealtimeSocket } = require("../sockets/assemblyAISocket");

const DEFAULT_SAMPLE_RATE = 16000;
const DEFAULT_WS_URL =
  process.env.ASSEMBLY_WS_URL || "wss://streaming.assemblyai.com/v3/ws";

const normalizeAssemblyAITranscript = (payload, status) => {
  if (!status) return null;

  return {
    status,
    text: payload?.transcript || payload?.text || "",
    timestamp: {
      startMs:
        typeof payload?.audio_start === "number"
          ? payload.audio_start
          : typeof payload?.start === "number"
            ? payload.start
            : 0,
      endMs:
        typeof payload?.audio_end === "number"
          ? payload.audio_end
          : typeof payload?.end === "number"
            ? payload.end
            : undefined,
    },
    confidence:
      typeof payload?.confidence === "number"
        ? { value: payload.confidence }
        : undefined,
    languageCode: payload?.language_code,
    vendor: "assemblyai",
    raw: payload,
  };
};

class AsrService extends EventEmitter {
  constructor(options = {}) {
    super();

    this.vendor = options.vendor || "assemblyai";
    this.clientId = null;
    this.socket = null;
    this.on("error", (error) => {
      console.error("ASR service error:", error);
    });
    this.socketFactory =
      options.socketFactory ||
      (() =>
        new AssemblyAIRealtimeSocket({
          apiKey: options.apiKey || process.env.ASSEMBLY_AI_API_KEY,
          sampleRate: options.sampleRate || DEFAULT_SAMPLE_RATE,
          formatTurns:
            options.formatTurns !== undefined ? options.formatTurns : true,
          url: options.url || DEFAULT_WS_URL,
          WebSocketImpl: options.WebSocketImpl || global.WebSocket,
        }));
  }

  async connect(clientId) {
    if (clientId) {
      this.clientId = clientId;
    }

    if (this.socket) return;

    this.socket = this.socketFactory();

    this.socket.on("open", () => {
      this.emit("open");
    });

    this.socket.on("close", () => {
      this.emit("close");
    });

    this.socket.on("error", (error) => {
      this.emit("error", error);
    });

    this.socket.on("partial-transcript", (payload) => {
      const partialTranscript = normalizeAssemblyAITranscript(
        payload,
        "partial",
      );
      if (partialTranscript) {
        console.log("📝 ASR Service - Partial transcript:", {
          textLength: partialTranscript.text.length,
        });
        this.emit("partial-transcript", partialTranscript);
      }
    });

    this.socket.on("final-transcript", (data) => {
      const text = data?.text;
      if (!text || !text.trim()) {
        console.log("⚠️ ASR Service - Empty final transcript, ignoring");
        return;
      }

      console.log("✅ ASR Service - Final transcript:", {
        textLength: text.length,
        text: text.substring(0, 50),
      });
      this.emit("transcript", {
        text,
        isFinal: true,
        startMs: data.startMs,
        endMs: data.endMs,
      });
    });

    this.socket.on("message", (payload) => {
      this.emit("raw", payload);
    });

    await this.socket.connect();
  }

  sendTerminate() {
    if (this.socket) {
      this.socket.sendTerminate();
    }
  }

  async disconnect() {
    if (!this.socket) {
      console.log("🛑 ASR Service - Already disconnected");
      return;
    }

    console.log("🛑 ASR Service - Disconnecting");

    try {
      this.socket.close();
    } catch (error) {
      console.error("Error during ASR disconnect:", error);
    }

    this.socket = null;
    this.clientId = null;
    console.log("🛑 ASR Service - Disconnected");
  }

  async sendAudio(clientId, chunk) {
    if (clientId) {
      this.clientId = clientId;
    }

    if (!this.socket) {
      await this.connect(this.clientId);
    }

    if (!chunk) return;
    this.socket.sendAudio(chunk);
  }

  async handleClientConnect(clientId) {
    await this.connect(clientId);
  }

  async handleClientDisconnect() {
    await this.disconnect();
  }

  async handleAudioChunk(clientId, chunk) {
    await this.sendAudio(clientId, chunk);
  }
}

module.exports = {
  AsrService,
  normalizeAssemblyAITranscript,
};
