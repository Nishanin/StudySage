import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  X,
  FileText,
  Brain,
  Layers,
  MessageSquare,
  Download,
} from "lucide-react";
import { liveLectureAPI, resourceAPI } from "../utils/api";

export default function LiveLectureMode({
  onClose,
  darkMode = false,
  workspaceId,
  workspaceName,
}) {
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(null);
  const [lectureId, setLectureId] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [hasTitle, setHasTitle] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopStreaming(true);
    };
  }, []);

  useEffect(() => {
    setShowTitleInput(true);
    setTitleInput("");
    setHasTitle(false);
    setError("");
  }, [workspaceId]);

  const safeSetStatus = (value) => {
    if (isMountedRef.current) {
      setStatus(value);
    }
  };

  const updateTranscript = (text) => {
    if (!text) return;
    setTranscript((prev) => {
      const next = prev ? `${prev} ${text}` : text;
      const words = next.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
      return next;
    });
  };

  const getToken = () => localStorage.getItem("authToken");

  const buildWsUrl = (id) => {
    const apiBase =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    const base = apiBase.replace(/\/?api\/?$/, "");
    const wsBase = base.replace(/^http/i, "ws");
    const token = getToken();

    const url = new URL(`${wsBase}/live-lecture/ws`);
    url.searchParams.set("lectureId", id);
    if (token) {
      url.searchParams.set("token", token);
    }
    return url.toString();
  };

  const downsampleBuffer = (buffer, inputSampleRate, outputSampleRate) => {
    if (outputSampleRate === inputSampleRate) {
      return buffer;
    }
    const ratio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let sum = 0;
      let count = 0;
      for (
        let i = offsetBuffer;
        i < nextOffsetBuffer && i < buffer.length;
        i += 1
      ) {
        sum += buffer[i];
        count += 1;
      }
      result[offsetResult] = sum / count;
      offsetResult += 1;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  };

  const floatTo16BitPCM = (float32) => {
    const buffer = new ArrayBuffer(float32.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32.length; i += 1) {
      let sample = Math.max(-1, Math.min(1, float32[i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(i * 2, sample, true);
    }
    return buffer;
  };

  const connectWebSocket = (id) => {
    const wsUrl = buildWsUrl(id);
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";

    ws.onmessage = (event) => {
      if (!event?.data || typeof event.data !== "string") return;
      try {
        const payload = JSON.parse(event.data);
        if (payload?.text) {
          updateTranscript(payload.text);
        }
      } catch (err) {
        return;
      }
    };

    ws.onerror = () => {
      setError("WebSocket connection error");
      stopStreaming(false);
    };

    ws.onclose = () => {
      if (status === "recording") {
        safeSetStatus("stopped");
      }
    };

    wsRef.current = ws;
  };

  const startMicrophone = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (event) => {
      const socket = wsRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;

      const input = event.inputBuffer.getChannelData(0);
      const downsampled = downsampleBuffer(
        input,
        audioContext.sampleRate,
        16000,
      );
      const pcm = floatTo16BitPCM(downsampled);
      socket.send(pcm);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  };

  const stopStreaming = (notifyBackend = true) => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (notifyBackend && lectureId) {
      liveLectureAPI.end({ lectureId }).catch(() => {});
    }

    safeSetStatus("stopped");
  };

  const startStreaming = async (title) => {
    if (status === "recording") return;

    setError("");
    setTranscript("");
    setWordCount(0);

    if (!workspaceId) {
      setError("Select a workspace before starting live lecture mode.");
      return;
    }

    const trimmedTitle = title?.trim();
    if (!trimmedTitle) {
      setError("A resource title is required to start recording.");
      return;
    }

    let resourceResponse;
    try {
      resourceResponse = await resourceAPI.createResource({
        workspace_id: workspaceId,
        title: trimmedTitle,
        type: "live",
      });
    } catch (err) {
      setError(err.message || "Failed to create live lecture resource.");
      return;
    }

    const resourceId =
      resourceResponse?.resourceId ||
      resourceResponse?.data?.resourceId ||
      resourceResponse?.data?.id ||
      resourceResponse?.data?.data?.id ||
      null;

    if (!resourceId) {
      setError("Failed to resolve lecture resource id.");
      return;
    }

    setLectureId(resourceId);

    liveLectureAPI.start({ lectureId: resourceId, resourceId }).catch((err) => {
      setError(err.message || "Failed to start live lecture session.");
    });

    try {
      setIsStarting(true);
      setHasTitle(true);
      connectWebSocket(resourceId);
      await startMicrophone();
      safeSetStatus("recording");
      setPermissionGranted(true);
      setShowTitleInput(false);
    } catch (err) {
      setError(err.message || "Failed to access microphone.");
      stopStreaming(false);
      safeSetStatus("idle");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStartClick = () => {
    if (status === "recording" || isStarting) return;
    if (!hasTitle) {
      setShowTitleInput(true);
      setError("");
      return;
    }
    if (!titleInput.trim()) {
      setShowTitleInput(true);
      setError("A resource title is required to start recording.");
      return;
    }
    startStreaming(titleInput);
  };

  const handleConfirmTitle = () => {
    if (!titleInput.trim()) {
      setError("A resource title is required to start recording.");
      return;
    }
    setHasTitle(true);
    setShowTitleInput(false);
    setError("");
  };

  const generateNotes = () => {
    alert("Generating notes from transcript...");
  };

  const generateMindmap = () => {
    alert("Generating mindmap from transcript...");
  };

  const generateFlashcards = () => {
    alert("Generating flashcards from transcript...");
  };

  const annotate = () => {
    alert("Opening annotation mode...");
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lecture-transcript.txt";
    a.click();
  };

  const showControls = status === "recording" || hasTitle;

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div
        className={`w-full max-w-5xl ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-100"} rounded-3xl shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div
          className={`px-8 py-6 border-b ${darkMode ? "border-gray-700 bg-gray-750" : "border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50"} flex items-center justify-between`}>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center'>
              <Mic className='w-6 h-6 text-white' />
            </div>
            <div>
              <h2
                className={`text-2xl ${darkMode ? "text-white" : "text-gray-900"}`}>
                Live Lecture Mode
              </h2>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {status === "recording"
                  ? "Listening..."
                  : status === "stopped"
                    ? "Stopped"
                    : "Ready to start"}
                {wordCount > 0 && ` • ${wordCount} words`}
              </p>
              {(workspaceName || workspaceId) && (
                <div className='mt-2'>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${darkMode ? "bg-gray-700 text-purple-200" : "bg-purple-100 text-purple-700"}`}>
                    Workspace: {workspaceName || workspaceId}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-purple-100 text-gray-600"}`}>
            <X className='w-6 h-6' />
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-hidden flex flex-col p-8'>
          {/* Transcript Area */}
          <div
            className={`flex-1 p-6 rounded-2xl border-2 mb-6 overflow-y-auto ${
              darkMode
                ? "bg-gray-750 border-gray-700"
                : "bg-purple-50 border-purple-200"
            }`}>
            <div className='flex items-center justify-between mb-4'>
              <h3 className={`${darkMode ? "text-white" : "text-gray-900"}`}>
                Transcript
              </h3>
              {transcript && (
                <button
                  onClick={downloadTranscript}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    darkMode
                      ? "bg-gray-700 text-purple-400 hover:bg-gray-600"
                      : "bg-white text-purple-600 hover:bg-purple-50"
                  }`}>
                  <Download className='w-4 h-4' />
                  Download
                </button>
              )}
            </div>
            <div
              className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              {transcript || (
                <span className={darkMode ? "text-gray-500" : "text-gray-400"}>
                  Click "Start Listening" to begin transcribing the lecture...
                </span>
              )}
            </div>
          </div>

          {/* Info Message */}
          {!error && permissionGranted === null && status !== "recording" && (
            <div
              className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 ${
                darkMode
                  ? "bg-blue-900/20 border-blue-700"
                  : "bg-blue-50 border-blue-200"
              }`}>
              <Mic
                className={`w-5 h-5 flex-shrink-0 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
              />
              <div
                className={`text-sm leading-relaxed ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
                <strong>Microphone access required:</strong> When you click
                "Start Listening", your browser will ask for microphone
                permission. Please allow access to use this feature.
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 ${
                darkMode
                  ? "bg-red-900/20 border-red-700"
                  : "bg-red-50 border-red-200"
              }`}>
              <div
                className={`text-sm leading-relaxed ${darkMode ? "text-red-300" : "text-red-700"}`}>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {showTitleInput && status !== "recording" && (
            <div
              className={`mb-6 p-4 rounded-xl border-2 ${
                darkMode
                  ? "bg-gray-750 border-gray-700"
                  : "bg-white border-purple-200"
              }`}>
              <label
                className={`text-xs uppercase tracking-wide ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                Lecture Title
              </label>
              <div className='mt-2 flex flex-col md:flex-row gap-3'>
                <input
                  type='text'
                  value={titleInput}
                  onChange={(event) => setTitleInput(event.target.value)}
                  placeholder='Enter lecture title'
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-gray-100"
                      : "bg-white border-purple-200 text-gray-800"
                  }`}
                />
                <div className='flex gap-2'>
                  <button
                    onClick={handleConfirmTitle}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}>
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          {showControls && (
            <div className='flex items-center justify-between mb-6'>
              <div className='flex gap-3'>
                <button
                  onClick={handleStartClick}
                  disabled={status === "recording" || isStarting}
                  className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
                    status === "recording" || isStarting
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg text-white"
                  }`}>
                  <Mic className='w-5 h-5' />
                  {isStarting ? "Starting..." : "Start Listening"}
                </button>

                <button
                  onClick={() => stopStreaming(true)}
                  disabled={status !== "recording"}
                  className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                    status !== "recording"
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}>
                  <MicOff className='w-5 h-5' />
                  Stop Listening
                </button>
              </div>

              {status === "recording" && (
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
                  <span
                    className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Recording
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {transcript && (
            <div className='grid grid-cols-4 gap-4'>
              <button
                onClick={generateNotes}
                className={`p-4 rounded-xl border-2 transition-all group ${
                  darkMode
                    ? "border-gray-700 hover:border-purple-600 bg-gray-750"
                    : "border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg"
                }`}>
                <FileText
                  className={`w-6 h-6 mx-auto mb-2 ${darkMode ? "text-purple-400 group-hover:text-purple-300" : "text-purple-600"}`}
                />
                <div
                  className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-900"}`}>
                  Generate Notes
                </div>
              </button>

              <button
                onClick={generateMindmap}
                className={`p-4 rounded-xl border-2 transition-all group ${
                  darkMode
                    ? "border-gray-700 hover:border-purple-600 bg-gray-750"
                    : "border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg"
                }`}>
                <Layers
                  className={`w-6 h-6 mx-auto mb-2 ${darkMode ? "text-purple-400 group-hover:text-purple-300" : "text-purple-600"}`}
                />
                <div
                  className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-900"}`}>
                  Mind Map
                </div>
              </button>

              <button
                onClick={generateFlashcards}
                className={`p-4 rounded-xl border-2 transition-all group ${
                  darkMode
                    ? "border-gray-700 hover:border-purple-600 bg-gray-750"
                    : "border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg"
                }`}>
                <Brain
                  className={`w-6 h-6 mx-auto mb-2 ${darkMode ? "text-purple-400 group-hover:text-purple-300" : "text-purple-600"}`}
                />
                <div
                  className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-900"}`}>
                  Flashcards
                </div>
              </button>

              <button
                onClick={annotate}
                className={`p-4 rounded-xl border-2 transition-all group ${
                  darkMode
                    ? "border-gray-700 hover:border-purple-600 bg-gray-750"
                    : "border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg"
                }`}>
                <MessageSquare
                  className={`w-6 h-6 mx-auto mb-2 ${darkMode ? "text-purple-400 group-hover:text-purple-300" : "text-purple-600"}`}
                />
                <div
                  className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-900"}`}>
                  Annotate
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
