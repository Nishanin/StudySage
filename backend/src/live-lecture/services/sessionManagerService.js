const { EventEmitter } = require("events");

const DEFAULT_MAX_DURATION_MS = 60 * 60 * 1000;

class SessionManagerService extends EventEmitter {
  constructor(options = {}) {
    super();

    this.maxDurationMs =
      options.maxDurationMs ||
      Number(process.env.LIVE_LECTURE_MAX_DURATION_MS) ||
      DEFAULT_MAX_DURATION_MS;
    this.sessions = new Map();
  }

  startSession(lectureId, metadata = {}) {
    if (!lectureId) {
      throw new Error("lectureId is required");
    }

    const existing = this.sessions.get(lectureId);
    if (existing && existing.active) {
      return existing;
    }

    const session = {
      lectureId,
      startTime: Date.now(),
      clientConnected: false,
      asrConnected: false,
      active: true,
      metadata,
      timeoutId: null,
    };

    if (this.maxDurationMs > 0) {
      session.timeoutId = setTimeout(() => {
        this.endSession(lectureId, "max-duration");
      }, this.maxDurationMs);
    }

    this.sessions.set(lectureId, session);
    this.emit("session-started", session);
    return session;
  }

  getSession(lectureId) {
    return this.sessions.get(lectureId) || null;
  }

  connectClient(lectureId) {
    const session = this.getOrCreateSession(lectureId);
    session.clientConnected = true;
    this.emit("client-connected", session);
    return session;
  }

  disconnectClient(lectureId) {
    const session = this.getSession(lectureId);
    if (!session) return null;

    session.clientConnected = false;
    this.emit("client-disconnected", session);

    this.endSession(lectureId, "client-disconnect");
    return session;
  }

  markAsrConnected(lectureId) {
    const session = this.getOrCreateSession(lectureId);
    session.asrConnected = true;
    this.emit("asr-connected", session);
    return session;
  }

  markAsrDisconnected(lectureId) {
    const session = this.getSession(lectureId);
    if (!session) return null;

    session.asrConnected = false;
    this.emit("asr-disconnected", session);
    return session;
  }

  endSession(lectureId, reason = "ended") {
    const session = this.getSession(lectureId);
    if (!session || !session.active) return null;

    session.active = false;
    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
      session.timeoutId = null;
    }

    this.sessions.delete(lectureId);
    this.emit("session-ended", { ...session, reason });
    return session;
  }

  getOrCreateSession(lectureId) {
    return this.getSession(lectureId) || this.startSession(lectureId);
  }
}

module.exports = {
  SessionManagerService,
};
