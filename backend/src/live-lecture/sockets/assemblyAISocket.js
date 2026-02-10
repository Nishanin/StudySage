const { EventEmitter } = require("events");

const DEFAULT_SAMPLE_RATE = 16000;
const DEFAULT_WS_URL = process.env.ASSEMBLY_WS_URL;

class AssemblyAIRealtimeSocket extends EventEmitter {
  constructor(options = {}) {
    super();

    this.apiKey = options.apiKey || process.env.ASSEMBLY_AI_API_KEY;
    this.sampleRate = options.sampleRate || DEFAULT_SAMPLE_RATE;
    this.url = options.url || DEFAULT_WS_URL;
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

    const url = `${this.url}?sample_rate=${this.sampleRate}`;

    this.socket = new this.WebSocketImpl(url, {
      headers: {
        Authorization: this.apiKey,
      },
    });

    this.socket.onopen = () => {
      this.emit("open");
    };

    this.socket.onclose = () => {
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

  close() {
    if (!this.socket) return;

    this.socket.close();
    this.socket = null;
  }

  sendAudio(chunk) {
    if (!this.socket || this.socket.readyState !== this.WebSocketImpl.OPEN) {
      throw new Error("WebSocket is not open");
    }

    if (!chunk) return;

    const payload = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    this.socket.send(payload);
  }

  handleMessage(data) {
    if (!data) return;

    let payload = data;
    if (typeof data === "string") {
      try {
        payload = JSON.parse(data);
      } catch (error) {
        this.emit("error", error);
        return;
      }
    }

    const messageType = payload?.message_type;
    if (
      messageType === "PartialTranscript" ||
      messageType === "FinalTranscript"
    ) {
      this.emit("transcript", payload);
      return;
    }

    if (messageType === "Error") {
      this.emit("error", payload);
      return;
    }

    this.emit("message", payload);
  }
}

module.exports = {
  AssemblyAIRealtimeSocket,
};
