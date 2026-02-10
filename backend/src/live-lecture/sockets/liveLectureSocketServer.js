const jwt = require("jsonwebtoken");

const { attachClientSocketHandlers } = require("./clientSocket");

const DEFAULT_PATH = "/live-lecture/ws";

const resolveWebSocketServer = (WebSocketServerImpl) => {
  if (WebSocketServerImpl) return WebSocketServerImpl;

  try {
    const { WebSocketServer } = require("ws");
    return WebSocketServer;
  } catch (error) {
    return null;
  }
};

const getTokenFromRequest = (requestUrl, headers = {}) => {
  const authHeader = headers.authorization || headers.Authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  if (!requestUrl) return null;

  const url = new URL(requestUrl, "http://localhost");
  return url.searchParams.get("token");
};

const getLectureIdFromRequest = (requestUrl, headers = {}) => {
  if (headers["x-lecture-id"]) {
    return headers["x-lecture-id"];
  }

  if (!requestUrl) return null;

  const url = new URL(requestUrl, "http://localhost");
  return (
    url.searchParams.get("lectureId") || url.searchParams.get("lecture_id")
  );
};

const createLiveLectureSocketServer = (httpServer, options = {}) => {
  const WebSocketServer = resolveWebSocketServer(options.WebSocketServerImpl);
  if (!WebSocketServer) {
    throw new Error("WebSocketServer implementation is required");
  }

  const path = options.path || DEFAULT_PATH;
  const asrService = options.asrService;
  const activeLectures = new Map();

  const wss = new WebSocketServer({ server: httpServer, path });

  wss.on("connection", (socket, request) => {
    const token = getTokenFromRequest(request?.url, request?.headers);
    if (!token) {
      socket.close(4001, "Unauthorized");
      return;
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      socket.close(4001, "Unauthorized");
      return;
    }

    const lectureId = getLectureIdFromRequest(request?.url, request?.headers);
    if (!lectureId) {
      socket.close(4002, "lectureId required");
      return;
    }

    if (activeLectures.has(lectureId)) {
      socket.close(4003, "Lecture already connected");
      return;
    }

    activeLectures.set(lectureId, socket);

    attachClientSocketHandlers(socket, asrService, lectureId);

    socket.on("close", () => {
      activeLectures.delete(lectureId);
    });

    socket.on("error", () => {
      activeLectures.delete(lectureId);
    });
  });

  return wss;
};

module.exports = {
  createLiveLectureSocketServer,
};
