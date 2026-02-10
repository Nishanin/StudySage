const { EventEmitter } = require("events");

const { AssemblyAIRealtimeSocket } = require("../sockets/assemblyAISocket");

const DEFAULT_SAMPLE_RATE = 16000;
const DEFAULT_WS_URL = process.env.ASSEMBLY_WS_URL;

const normalizeAssemblyAITranscript = (payload) => {
  const messageType = payload?.message_type || "";
  const status =
    messageType === "FinalTranscript"
      ? "final"
      : messageType === "PartialTranscript"
        ? "partial"
        : undefined;

  if (!status) return null;

  return {
    status,
    text: payload?.text || "",
    timestamp: {
      startMs:
        typeof payload?.audio_start === "number" ? payload.audio_start : 0,
      endMs:
        typeof payload?.audio_end === "number" ? payload.audio_end : undefined,
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
    this.socketFactory =
      options.socketFactory ||
      (() =>
        new AssemblyAIRealtimeSocket({
          apiKey: options.apiKey || process.env.ASSEMBLY_AI_API_KEY,
          sampleRate: options.sampleRate || DEFAULT_SAMPLE_RATE,
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

    this.socket.on("transcript", (payload) => {
      const transcript = normalizeAssemblyAITranscript(payload);
      if (transcript) {
        this.emit("transcript", transcript);
      }
    });

    this.socket.on("message", (payload) => {
      this.emit("raw", payload);
    });

    await this.socket.connect();
  }

  async disconnect() {
    if (!this.socket) return;

    this.socket.close();
    this.socket = null;
    this.clientId = null;
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
