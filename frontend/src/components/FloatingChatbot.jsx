import React, { useState, useEffect } from "react";
import { useStudyContext } from "../context/StudyContext";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { chatAPI } from "../utils/api";

export default function FloatingChatbot({ user, darkMode = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [examMode, setExamMode] = useState(false);
  const [notesOnly, setNotesOnly] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [faqs, setFaqs] = useState([]);
  const { resourceId, workspaceId } = useStudyContext();

  useEffect(() => {
    if (resourceId) {
      fetch(`/api/faqs?resource_id=${resourceId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFaqs(data.faqs || []);
          }
        })
        .catch(err => console.error("Failed to fetch FAQs:", err));
    }
  }, [resourceId]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || loading || !resourceId) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: chatInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLastUserMessage(chatInput);
    setChatInput("");
    setLoading(true);
    setError("");

    const payload = {
      message: userMessage.content,
      resource_id: resourceId,
      context: {
        type: "resource",
        workspace_id: workspaceId || null,
      },
      mode: examMode ? "exam_crash" : "normal",
      notes_only: notesOnly,
    };
    try {
      const response = await chatAPI.sendMessage(payload);
      if (response && response.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            content: response.answer,
            relatedMemories: Array.isArray(response?.chunks)
              ? response.chunks
              : [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            content:
              response?.answer ||
              (typeof response?.error === "string" ? response.error : ""),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          content: "Unable to connect to study assistant. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReExplain = async () => {
    if (!lastUserMessage.trim() || loading || !resourceId) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: lastUserMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError("");

    const payload = {
      message: userMessage.content,
      resource_id: resourceId,
      context: {
        type: "resource",
        workspace_id: workspaceId || null,
      },
      mode: "reexplain",
      notes_only: notesOnly,
    };

    try {
      const response = await chatAPI.sendMessage(payload);
      if (response && response.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            content: response.answer,
            relatedMemories: Array.isArray(response?.chunks)
              ? response.chunks
              : [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            content:
              response?.answer ||
              (typeof response?.error === "string" ? response.error : ""),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          content: "Unable to connect to study assistant. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-60 group'>
        {isOpen ? (
          <X className='w-7 h-7 text-white' />
        ) : (
          <MessageCircle className='w-7 h-7 text-white' />
        )}
        <span className='absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none'>
          {isOpen ? "Close Chat" : "AI Assistant"}
        </span>
      </button>

      {/* Chatbot Popup */}
      {isOpen && (
        <div
          className={`fixed bottom-28 right-8 w-[570px] h-[600px] ${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl shadow-2xl z-60 flex flex-col overflow-hidden border ${darkMode ? "border-gray-700" : "border-purple-200"}`}>
          {/* Chat Header */}
          <div
            className={`px-6 py-4 border-b ${darkMode ? "border-gray-700 bg-gray-800" : "border-purple-100 bg-white"} flex-shrink-0`}>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg flex items-center justify-center'>
                  <Sparkles className='w-5 h-5 text-white' />
                </div>
                <div>
                  <div
                    className={`text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
                    AI Study Assistant
                  </div>
                  <div
                    className={`text-xs ${darkMode ? "text-purple-400" : "text-purple-600"}`}>
                    Always here to help
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-700" : "hover:bg-purple-50"}`}>
                <X
                  className={`w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                />
              </button>
            </div>
          </div>

          {/* FAQ Dropdown */}
          {/* FAQ Cards */}
          {faqs.length > 0 && messages.length === 0 && (
            <div className={`px-4 py-2 border-b ${darkMode ? "border-gray-700 bg-gray-800" : "border-purple-100 bg-white"}`}>
              <div className={`text-sm font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>Frequently Asked Questions:</div>
              <div className="space-y-2">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setMessages([
                        { id: Date.now(), type: "user", content: faq.question },
                        { id: Date.now() + 1, type: "ai", content: faq.answer },
                      ]);
                      setLastUserMessage(faq.question);
                    }}
                    className={`p-3 border-2 border-purple-500 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                      darkMode ? "bg-gray-750 text-white" : "bg-white text-gray-900"
                    }`}
                  >
                    {faq.question}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? "bg-gray-750" : "bg-purple-50"}`}>
            {" "}
            {messages.length === 0 && (
              <div className='flex flex-col items-center justify-center h-full text-center'>
                <Sparkles
                  className={`w-16 h-16 mb-4 ${darkMode ? "text-gray-600" : "text-gray-300"}`}
                />
                <p
                  className={`text-lg mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Start a conversation!
                </p>
                <p
                  className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                  Ask me anything about your studies
                </p>
              </div>
            )}{" "}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-4 py-3 rounded-xl max-w-[85%] ${
                    msg.type === "user"
                      ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white"
                      : darkMode
                        ? "bg-gray-800 border border-gray-700 text-gray-200"
                        : "bg-white border border-purple-200 text-gray-800"
                  }`}>
                  <p className='text-sm leading-relaxed whitespace-pre-line'>
                    {msg.content}
                  </p>
                  {msg.type === "ai" &&
                    msg?.relatedMemories &&
                    msg.relatedMemories.length > 0 && (
                      <div
                        className={`mt-3 pt-3 border-t ${darkMode ? "border-gray-700" : "border-purple-200"}`}>
                        {/* <div
                          className={`text-xs mb-2 ${darkMode ? "text-purple-300" : "text-purple-700"}`}>
                          Related memories
                        </div> */}
                        {/* <ul className='space-y-2'>
                          {msg.relatedMemories.slice(0, 3).map((mem, idx) => (
                            <li
                              key={idx}
                              className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                              {mem?.summary ||
                                mem?.text ||
                                mem?.title ||
                                "Referenced memory"}
                            </li>
                          ))}
                        </ul> */}
                      </div>
                    )}
                  {msg.type === "ai" &&
                    msg?.persistedMemories &&
                    msg.persistedMemories.length > 0 && (
                      <div
                        className={`mt-2 text-[11px] ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Saved {msg.persistedMemories.length} new memory item(s).
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          {messages.length > 0 && messages[messages.length - 1].type === "ai" && !loading && (
            <div className='flex justify-center py-2'>
              <button
                onClick={handleReExplain}
                className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                  darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600" : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                }`}>
                🔁 Re-Explain
              </button>
            </div>
          )}

          {/* Toggles */}
          <div className={`flex-shrink-0 px-4 py-2 border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-purple-100 bg-white"} flex gap-4 items-center justify-center`}>
            <button
              onClick={() => setExamMode(!examMode)}
              className={`px-4 py-2 text-xs rounded-full border-2 transition-colors ${
                examMode
                  ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white border-purple-600"
                  : "border-purple-500 text-purple-600 bg-transparent"
              }`}>
              Exam Mode: {examMode ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => setNotesOnly(!notesOnly)}
              className={`px-4 py-2 text-xs rounded-full border-2 transition-colors ${
                notesOnly
                  ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white border-purple-600"
                  : "border-purple-500 text-purple-600 bg-transparent"
              }`}>
              Notes-Only: {notesOnly ? "ON" : "OFF"}
            </button>
          </div>

          {/* Chat Input */}
          <div
            className={`flex-shrink-0 p-4 border-t ${darkMode ? "border-gray-700 bg-gray-800" : "border-purple-100 bg-white"}`}>
            <div className='flex gap-2'>
              <input
                type='text'
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !loading && handleSendMessage()
                }
                placeholder={
                  resourceId ? "Ask me anything..." : "Open a resource to chat"
                }
                className={`flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm ${darkMode ? "bg-gray-750 border-gray-600 text-white placeholder-gray-400" : "border-purple-200"}`}
                disabled={loading || !resourceId || resourceId === ""}
              />
              {/* Debug: Show resourceId for troubleshooting
              {process.env.NODE_ENV !== "production" && (
                <div style={{ fontSize: 10, color: "#888", marginLeft: 4 }}>
                  resourceId: {String(resourceId)}
                </div>
              )} */}
              <button
                onClick={handleSendMessage}
                disabled={loading || !chatInput.trim() || !resourceId}
                className='px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'>
                {loading ? (
                  <Loader2 className='w-4 h-4 animate-spin' />
                ) : (
                  <Send className='w-4 h-4' />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
