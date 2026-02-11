const resolveClientId = (socket) => {
  return (
    socket?.id ||
    socket?.clientId ||
    `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  );
};

const forwardAudioChunk = async (asrService, clientId, chunk) => {
  if (!asrService) return;

  if (typeof asrService.handleAudioChunk === "function") {
    await asrService.handleAudioChunk(clientId, chunk);
    return;
  }

  if (typeof asrService.sendAudio === "function") {
    await asrService.sendAudio(clientId, chunk);
    return;
  }

  if (typeof asrService.send === "function") {
    await asrService.send(clientId, chunk);
  }
};

const handleConnect = async (asrService, clientId, socket) => {
  if (!asrService) return;

  if (typeof asrService.handleClientConnect === "function") {
    await asrService.handleClientConnect(clientId, socket);
    return;
  }

  if (typeof asrService.connect === "function") {
    await asrService.connect(clientId, socket);
  }
};

const handleDisconnect = async (asrService, clientId) => {
  if (!asrService) return;

  if (typeof asrService.handleClientDisconnect === "function") {
    await asrService.handleClientDisconnect(clientId);
    return;
  }

  if (typeof asrService.disconnect === "function") {
    await asrService.disconnect(clientId);
  }
};

const handleSocketMessage = async (asrService, clientId, data) => {
  if (!data) return;

  if (
    Buffer.isBuffer(data) ||
    data instanceof ArrayBuffer ||
    data instanceof Uint8Array
  ) {
    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
    await forwardAudioChunk(asrService, clientId, chunk);
    return;
  }

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (parsed?.type === "audio" || parsed?.type === "audio-chunk") {
        if (parsed.data) {
          const chunk = Buffer.isBuffer(parsed.data)
            ? parsed.data
            : Buffer.from(parsed.data, "base64");
          await forwardAudioChunk(asrService, clientId, chunk);
        }
      }
    } catch (error) {
      return;
    }
  }
};

const attachClientSocketHandlers = (socket, asrService, clientId) => {
  const resolvedClientId = clientId || resolveClientId(socket);

  handleConnect(asrService, resolvedClientId, socket).catch(() => {});

  socket.on("audio-chunk", (chunk) => {
    forwardAudioChunk(asrService, resolvedClientId, chunk).catch(() => {});
  });

  socket.on("message", (data) => {
    const length =
      typeof data === "string"
        ? data.length
        : (data?.length ?? data?.byteLength);
    handleSocketMessage(asrService, resolvedClientId, data).catch(() => {});
  });
};

const registerClientSocket = (server, asrService) => {
  if (!server?.on) {
    throw new Error("WebSocket server with .on(event, handler) is required");
  }

  server.on("connection", (socket) => {
    attachClientSocketHandlers(socket, asrService);
  });
};

module.exports = {
  attachClientSocketHandlers,
  registerClientSocket,
};
