import React, { useState, useRef, useEffect } from "react";
import {
  X,
  FileText,
  Video,
  Mic,
  MicOff,
  Loader2,
} from "lucide-react";
import { LiveAudioVisualizer } from "react-audio-visualize";
import { resourceAPI, filesAPI, contentAPI, liveLectureAPI } from "../utils/api";

// Extract YouTube video ID from URL (reused from VideoLinkPaster pattern)
const extractVideoId = (url) => {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = String(url || "").match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Helper for WebSocket URL (matches LiveLectureMode pattern)
const buildWsUrl = (id) => {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const base = apiBase.replace(/\/?api\/?$/, "");
  const wsBase = base.replace(/^http/i, "ws");
  const token = localStorage.getItem("authToken");
  const url = new URL(`${wsBase}/live-lecture/ws`);
  url.searchParams.set("lectureId", id);
  if (token) url.searchParams.set("token", token);
  return url.toString();
};

const downsampleBuffer = (buffer, inputSampleRate, outputSampleRate) => {
  if (outputSampleRate === inputSampleRate) return buffer;
  const ratio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      sum += buffer[i];
      count++;
    }
    result[offsetResult] = count ? sum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
};

const floatTo16BitPCM = (float32) => {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    let sample = Math.max(-1, Math.min(1, float32[i]));
    sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(i * 2, sample, true);
  }
  return buffer;
};

export default function AddResourceModal({
  isOpen,
  onClose,
  onSuccess,
  workspaceId,
  workspaceName,
  darkMode = false,
  initialType = null, // 'pdf' | 'ppt' | 'youtube' | 'live' — when set, skip type selection
}) {
  // UI state (modal-local); when initialType provided, start with that type
  const [selectedType, setSelectedType] = useState(initialType);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Live Lecture state (parent-controlled via props; local for panel UX)
  const [liveStep, setLiveStep] = useState("title"); // 'title' | 'panel'
  const [lectureId, setLectureId] = useState(null);
  const [liveTitle, setLiveTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'recording' | 'stopped'
  const [isMuted, setIsMuted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const resetForm = () => {
    setSelectedType(initialType);
    setTitle("");
    setFile(null);
    setVideoUrl("");
    setError("");
    setLiveStep("title");
    setLectureId(null);
    setLiveTitle("");
    setTranscript("");
    setPartialTranscript("");
    setStatus("idle");
    setLiveStep("title");
  };

  const handleClose = () => {
    stopStreaming(true);
    resetForm();
    onClose?.();
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
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
      mediaRecorderRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    // API: liveLectureAPI.end - finalizes live lecture session
    if (notifyBackend && lectureId) {
      liveLectureAPI.end({ lectureId }).catch(() => {});
    }
    setPartialTranscript("");
    setStatus("stopped");
  };

  useEffect(() => {
    return () => stopStreaming(true);
  }, []);

  // Sync initialType when modal opens (e.g. from Dashboard cards)
  useEffect(() => {
    if (isOpen && initialType) {
      setSelectedType(initialType);
    } else if (!isOpen) {
      setSelectedType(initialType);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const inputCls = (add = "") =>
    `w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 ${add} ${
      darkMode
        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
    }`;

  const labelCls = darkMode ? "text-gray-300" : "text-gray-700";
  const btnCancel =
    darkMode
      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
      : "bg-gray-100 hover:bg-gray-200 text-gray-700";
  const btnPrimary =
    "bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg text-white";

  // ---- PDF/PPT submit ----
  const handlePdfSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a resource title");
      return;
    }
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    if (!workspaceId) {
      setError("Workspace ID not found");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      // API: resourceAPI.createResource - creates resource record
      const ext = (file.name || "").toLowerCase();
      const resType =
        ext.endsWith(".ppt") || ext.endsWith(".pptx") ? "ppt" : "pdf";
      const createRes = await resourceAPI.createResource({
        workspace_id: workspaceId,
        title: title.trim(),
        type: resType,
      });
      const resourceId =
        createRes?.resourceId || createRes?.data?.resourceId || createRes?.data?.id;
      if (!resourceId) throw new Error("Resource ID not received from server");

      // API: filesAPI.uploadFile - uploads file for resource
      await filesAPI.uploadFile(resourceId, file);
      handleClose();
      onSuccess?.({ resourceId, resourceType: resType, file });
    } catch (err) {
      setError(err?.message || "Failed to upload resource. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- YouTube submit ----
  const handleYouTubeSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a resource title");
      return;
    }
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setError("Please enter a valid YouTube URL");
      return;
    }
    if (!workspaceId) {
      setError("Workspace ID not found");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      // API: contentAPI.addYouTubeContent - processes YouTube video, fetches transcript
      // TODO: Backend may not accept title; current API sends only videoId, workspaceId
      const response = await contentAPI.addYouTubeContent(videoId, workspaceId);
      handleClose();
      onSuccess?.({
        resourceId: response?.data?.resourceId,
        resourceType: "video",
        videoId,
      });
    } catch (err) {
      setError(err?.message || "Failed to add video. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Live Lecture: Create resource + switch to panel ----
  const handleCreateLecture = async () => {
    if (!liveTitle.trim()) {
      setError("Please enter a lecture title");
      return;
    }
    if (!workspaceId) {
      setError("Workspace ID not found");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      // API: resourceAPI.createResource - creates live lecture resource (type: "live")
      const createRes = await resourceAPI.createResource({
        workspace_id: workspaceId,
        title: liveTitle.trim(),
        type: "live",
      });
      const resourceId =
        createRes?.resourceId || createRes?.data?.resourceId || createRes?.data?.id;
      if (!resourceId) throw new Error("Lecture resource ID not received");

      setLectureId(resourceId);
      setLiveStep("panel");
      setError("");
    } catch (err) {
      setError(err?.message || "Failed to create lecture. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Live Lecture: Start recording ----
  const connectWs = (id) => {
    const ws = new WebSocket(buildWsUrl(id));
    ws.binaryType = "arraybuffer";
    ws.onmessage = (e) => {
      if (!e?.data || typeof e.data !== "string") return;
      try {
        const p = JSON.parse(e.data);
        const text = p?.text || p?.transcript;
        const t = p?.type;
        if (t === "live_transcript_partial" && text) setPartialTranscript(text);
        else if (t === "live_transcript_final" && text) {
          setTranscript((prev) => (prev ? `${prev} ${text}` : text));
          setPartialTranscript("");
        } else if (text) setTranscript((prev) => (prev ? `${prev} ${text}` : text));
      } catch (_) {}
    };
    ws.onerror = () => setError("WebSocket connection error");
    ws.onclose = () => {
      if (status === "recording") setStatus("stopped");
    };
    wsRef.current = ws;
  };

  const startMicrophone = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    // MediaRecorder for audio visualizer (react-audio-visualize)
    if (typeof window.MediaRecorder !== "undefined") {
      try {
        const mr = new window.MediaRecorder(stream);
        mr.start(100);
        mediaRecorderRef.current = mr;
      } catch (_) {
        // TODO: react-audio-visualize LiveAudioVisualizer needs MediaRecorder; fallback to placeholder if unavailable
      }
    }

    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      const socket = wsRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      const input = e.inputBuffer.getChannelData(0);
      const down = downsampleBuffer(input, ctx.sampleRate, 16000);
      const pcm = floatTo16BitPCM(down);
      socket.send(pcm);
    };

    source.connect(processor);
    processor.connect(ctx.destination);
  };

  const handleStartRecording = async () => {
    if (status === "recording" || isStarting || !lectureId) return;
    setIsStarting(true);
    setError("");
    setTranscript("");
    setPartialTranscript("");
    try {
      // API: liveLectureAPI.start - starts live lecture session on backend
      await liveLectureAPI.start({ lectureId, resourceId: lectureId });
      connectWs(lectureId);
      await startMicrophone();
      setStatus("recording");
    } catch (err) {
      setError(err?.message || "Failed to start recording.");
      stopStreaming(false);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndRecording = () => {
    if (status !== "recording") return;
    stopStreaming(true);
    setStatus("stopped");
  };

  const handleEndLecture = () => {
    stopStreaming(true);
    handleClose();
    onSuccess?.({ resourceId: lectureId });
  };

  // ---- Render: Live Lecture Panel ----
  if (liveStep === "panel") {
    const mr = mediaRecorderRef.current;
    const AudioVisualizerBlock =
      mr && status === "recording" ? (
        <div
          className={`rounded-xl p-4 min-h-[80px] flex items-center justify-center ${
            darkMode ? "bg-gray-750" : "bg-purple-50"
          }`}>
          <LiveAudioVisualizer
            mediaRecorder={mr}
            width={320}
            height={60}
            barColor={darkMode ? "#a78bfa" : "#7c3aed"}
            barWidth={3}
            gap={2}
          />
        </div>
      ) : (
        <div
          className={`rounded-xl p-4 min-h-[80px] flex items-center justify-center ${
            darkMode ? "bg-gray-750 text-gray-400" : "bg-purple-50 text-purple-600"
          }`}>
          <span className="text-sm">
            {status === "recording" ? "Visualizing..." : "Click Start to begin recording"}
          </span>
        </div>
      );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div
          className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-xl overflow-hidden ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-100"
          } border`}>
          {/* Header: Workspace Name - Resource Title */}
          <div
            className={`flex items-center justify-between px-6 py-4 border-b ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}>
            <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {workspaceName || "Workspace"} — {liveTitle || "Live Lecture"}
            </h3>
            <button
              onClick={handleEndLecture}
              className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-700"
                }`}>
                {error}
              </div>
            )}

            {/* 1) Audio Visualizer */}
            {AudioVisualizerBlock}

            {/* 2) Transcript Section */}
            <div>
              <h4 className={`text-sm font-medium mb-2 ${labelCls}`}>Transcript</h4>
              <div
                className={`rounded-xl border-2 p-4 max-h-48 overflow-y-auto text-sm ${
                  darkMode ? "bg-gray-750 border-gray-700 text-gray-300" : "bg-purple-50 border-purple-200 text-gray-700"
                }`}>
                {transcript || partialTranscript || (
                  <span className={darkMode ? "text-gray-500" : "text-gray-500"}>
                    Click Start to begin recording...
                  </span>
                )}
                {transcript && partialTranscript && (
                  <span className={darkMode ? "text-gray-500" : "text-gray-400"}>
                    {" "}
                    {partialTranscript}
                  </span>
                )}
              </div>
            </div>

            {/* 3) Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleStartRecording}
                disabled={status === "recording" || isStarting}
                className={`px-4 py-2 rounded-xl flex items-center gap-2 ${btnPrimary} disabled:opacity-50`}>
                <Mic className="w-4 h-4" />
                {isStarting ? "Starting..." : "Start"}
              </button>
              <button
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  if (streamRef.current) {
                    streamRef.current.getAudioTracks().forEach((t) => {
                      t.enabled = !next;
                    });
                  }
                }}
                className={`px-4 py-2 rounded-xl border ${btnCancel}`}
                title="Toggle mute (local only)">
                <MicOff className="w-4 h-4" />
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button
                onClick={handleEndRecording}
                disabled={status !== "recording"}
                className={`px-4 py-2 rounded-xl ${
                  status !== "recording"
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}>
                End
              </button>
              <button
                onClick={handleEndLecture}
                className={`px-4 py-2 rounded-xl ${btnPrimary}`}>
                End Lecture
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Render: Type selection or form ----
  const modalContent = !selectedType ? (
    <>
      <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
        Add Resource
      </h3>
      <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        Choose resource type
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setSelectedType("pdf")}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            darkMode
              ? "border-gray-700 hover:border-purple-500 bg-gray-750"
              : "border-purple-200 hover:border-purple-400 bg-white"
          }`}>
          <FileText className={`w-8 h-8 mb-2 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
          <div className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>PDF / PPT</div>
          <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Upload document
          </div>
        </button>
        <button
          onClick={() => setSelectedType("youtube")}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            darkMode
              ? "border-gray-700 hover:border-purple-500 bg-gray-750"
              : "border-purple-200 hover:border-purple-400 bg-white"
          }`}>
          <Video className={`w-8 h-8 mb-2 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
          <div className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>YouTube Video</div>
          <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Paste video URL
          </div>
        </button>
        <button
          onClick={() => setSelectedType("live")}
          className={`p-6 rounded-xl border-2 text-left transition-all ${
            darkMode
              ? "border-gray-700 hover:border-purple-500 bg-gray-750"
              : "border-purple-200 hover:border-purple-400 bg-white"
          }`}>
          <Mic className={`w-8 h-8 mb-2 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
          <div className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>Live Lecture</div>
          <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Record in real-time
          </div>
        </button>
      </div>
    </>
  ) : selectedType === "live" ? (
    <>
      <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
        Live Lecture
      </h3>
      <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        Enter a title and create the lecture resource.
      </p>
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${labelCls}`}>Lecture Title</label>
          <input
            type="text"
            value={liveTitle}
            onChange={(e) => setLiveTitle(e.target.value)}
            placeholder="Enter lecture title"
            className={inputCls()}
          />
        </div>
        <button
          onClick={handleCreateLecture}
          disabled={isSubmitting || !liveTitle.trim()}
          className={`w-full py-3 rounded-xl font-medium ${btnPrimary} disabled:opacity-50`}>
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Creating...
            </span>
          ) : (
            "Create Lecture"
          )}
        </button>
      </div>
    </>
  ) : selectedType === "pdf" || selectedType === "ppt" ? (
    <>
      <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
        {selectedType === "pdf" ? "PDF" : "PPT"} Document
      </h3>
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${labelCls}`}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter resource title"
            className={inputCls()}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${labelCls}`}>File</label>
          <input
            type="file"
            accept={selectedType === "pdf" ? ".pdf,.ppt,.pptx" : ".ppt,.pptx"}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className={inputCls(
              "file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer"
            )}
          />
          {file && (
            <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Selected: {file.name}
            </p>
          )}
        </div>
      </div>
    </>
  ) : (
    <>
      <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
        YouTube Video
      </h3>
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${labelCls}`}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter resource title"
            className={inputCls()}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${labelCls}`}>Video URL</label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className={inputCls()}
          />
        </div>
      </div>
    </>
  );

  const handleSubmit = () => {
    if (selectedType === "pdf" || selectedType === "ppt") handlePdfSubmit();
    else if (selectedType === "youtube") handleYouTubeSubmit();
  };

  const canSubmit =
    selectedType === "pdf" || selectedType === "ppt"
      ? title.trim() && file
      : selectedType === "youtube"
        ? title.trim() && videoUrl.trim() && extractVideoId(videoUrl)
        : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className={`w-full max-w-md rounded-2xl shadow-xl ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}>
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}>
          <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Add Resource
          </h3>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          {error && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-700"
              }`}>
              {error}
            </div>
          )}
          {modalContent}
        </div>

        {(selectedType === "pdf" || selectedType === "ppt" || selectedType === "youtube") && (
          <div
            className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
              darkMode ? "border-gray-700" : "border-gray-200"
            }`}>
            <button
              onClick={() => {
                setSelectedType(null);
                setTitle("");
                setFile(null);
                setVideoUrl("");
                setError("");
              }}
              className={`px-4 py-2 rounded-lg ${btnCancel}`}>
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
              className={`px-6 py-2 rounded-lg font-medium ${btnPrimary} disabled:opacity-50`}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {selectedType === "youtube" ? "Adding..." : "Uploading..."}
                </span>
              ) : (
                selectedType === "youtube" ? "Add Video" : "Upload"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
