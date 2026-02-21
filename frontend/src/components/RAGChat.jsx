import React, { useState, useRef, useEffect } from "react";

function RAGChat({ resourceId, examMode, notesOnly }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;
    const userMessage = { role: "user", content: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);
    const payload = {
      message: inputText,
      resource_id: resourceId,
      context: { type: "resource" },
      mode: examMode ? "exam_crash" : "normal",
      notes_only: notesOnly,
    };
    console.log("Sending payload:", payload);
    setInputText("");
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.answer || (typeof data.error === 'string' ? data.error : ""),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to connect to study assistant. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        border: "1px solid #eee",
        borderRadius: 8,
        padding: 16,
        background: "#fafbfc",
        display: "flex",
        flexDirection: "column",
        height: 500,
      }}>
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 8,
            }}>
            <div
              style={{
                background: msg.role === "user" ? "#d1e7dd" : "#e9ecef",
                color: "#222",
                borderRadius: 16,
                padding: "8px 14px",
                maxWidth: "75%",
                fontSize: 15,
                whiteSpace: "pre-wrap",
              }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: 8,
            }}>
            <div
              style={{
                background: "#e9ecef",
                borderRadius: 16,
                padding: "8px 14px",
                fontSize: 15,
              }}>
              Assistant is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={2}
          placeholder='Type your message...'
          style={{
            flex: 1,
            resize: "none",
            borderRadius: 8,
            border: "1px solid #ccc",
            padding: 8,
            fontSize: 15,
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !inputText.trim()}
          style={{
            padding: "0 18px",
            borderRadius: 8,
            border: "none",
            background: loading || !inputText.trim() ? "#ccc" : "#0d6efd",
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
            cursor: loading || !inputText.trim() ? "not-allowed" : "pointer",
          }}>
          Send
        </button>
      </div>
    </div>
  );
}

export default RAGChat;
