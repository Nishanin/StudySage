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
  const createAsrService =
    options.createAsrService || (() => options.asrService || null);
  const liveLectureService = options.liveLectureService || null;
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

    const asrService = createAsrService(lectureId);
    const handleTranscript = (transcript) => {
      console.log("WS transcript event:", {
        lectureId,
        isFinal: transcript?.isFinal,
        textLength: transcript?.text?.length || 0,
      });
      if (liveLectureService?.handleTranscript) {
        liveLectureService.handleTranscript(lectureId, transcript);
      }
      if (!socket || socket.readyState !== 1) return;

      socket.send(
        JSON.stringify({
          ...transcript,
          type: "live_transcript_final",
        }),
      );
    };

    const handlePartialTranscript = (transcript) => {
      if (!socket || socket.readyState !== 1) return;
      socket.send(
        JSON.stringify({
          ...transcript,
          type: "live_transcript_partial",
        }),
      );
    };

    if (asrService?.on) {
      asrService.on("transcript", handleTranscript);
      asrService.on("partial-transcript", handlePartialTranscript);
    }

    activeLectures.set(lectureId, {
      socket,
      asrService,
      handleTranscript,
      handlePartialTranscript,
    });

    if (liveLectureService?.handleClientConnected) {
      liveLectureService.handleClientConnected(lectureId);
    }

    attachClientSocketHandlers(socket, asrService, lectureId);

    socket.on("close", () => {
      cleanupLecture().catch((err) =>
        console.error("Cleanup error on close:", err),
      );
    });

    socket.on("error", () => {
      cleanupLecture().catch((err) =>
        console.error("Cleanup error on error:", err),
      );
    });

    const cleanupLecture = async () => {
      const lectureState = activeLectures.get(lectureId);
      if (!lectureState) return;
      activeLectures.delete(lectureId);

      // 1. Send terminate_session to AssemblyAI
      if (lectureState.asrService?.sendTerminate) {
        lectureState.asrService.sendTerminate();
      }

      // 2. Wait 300ms for any final transcripts to arrive
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 3. Flush chunk buffer and end lecture
      if (liveLectureService?.endLecture) {
        liveLectureService.endLecture(lectureId, "client-disconnected");
      }

      // 4. Remove listeners and close ASR socket (once)
      if (lectureState.asrService?.off) {
        lectureState.asrService.off("transcript", handleTranscript);
        lectureState.asrService.off(
          "partial-transcript",
          handlePartialTranscript,
        );
      }
      if (lectureState.asrService?.disconnect) {
        await lectureState.asrService.disconnect();
      }

      if (liveLectureService?.handleClientDisconnected) {
        liveLectureService.handleClientDisconnected(lectureId);
      }
    };
  });

  return wss;
};

module.exports = {
  createLiveLectureSocketServer,
};
