import React, { useState, useRef, useEffect } from "react";

function RAGChat({ resourceId, examMode, notesOnly }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [faqs, setFaqs] = useState([]);
  const messagesEndRef = useRef(null);

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
      examMode,
      notesOnly,
    };
    console.log("Sending payload:", payload);
    setLastUserMessage(inputText);
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
            content:
              data.answer || (typeof data.error === "string" ? data.error : ""),
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

  const handleReExplain = async () => {
    if (!lastUserMessage.trim() || loading) return;
    const userMessage = { role: "user", content: lastUserMessage };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);
    const payload = {
      message: lastUserMessage,
      resource_id: resourceId,
      context: { type: "resource" },
      mode: "reexplain",
      notes_only: notesOnly,
    };
    console.log("Re-explaining payload:", payload);
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
        maxWidth: 670,
        margin: "0 auto",
        border: "1px solid #eee",
        borderRadius: 8,
        padding: 16,
        background: "#fafbfc",
        display: "flex",
        flexDirection: "column",
        height: 500,
      }}>
      {faqs.length > 0 && messages.length === 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Frequently Asked Questions:</div>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => {
                setMessages([
                  { role: "user", content: faq.question },
                  { role: "assistant", content: faq.answer },
                ]);
                setLastUserMessage(faq.question);
              }}
              style={{
                padding: 12,
                marginBottom: 8,
                border: "2px solid #8b5cf6",
                borderRadius: 8,
                background: "#fefefe",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 4px 8px rgba(139, 92, 246, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}>
              {faq.question}
            </div>
          ))}
        </div>
      )}
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
        {messages.length > 0 && messages[messages.length - 1].role === "assistant" && !loading && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <button
              onClick={handleReExplain}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                background: "#f8f9fa",
                color: "#333",
                fontSize: 14,
                cursor: "pointer",
              }}>
              🔁 Re-Explain
            </button>
          </div>
        )}
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
