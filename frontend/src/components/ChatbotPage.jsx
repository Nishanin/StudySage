import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Sparkles from "lucide-react";
import RAGChat from "./RAGChat";
import { useStudyContext } from "../context/StudyContext";

export default function ChatbotPage({
  user,
  onNavigate,
  onLogout,
  darkMode = false,
}) {
  const { resourceId } = useStudyContext();
  const [examMode, setExamMode] = useState(false);
  const [notesOnly, setNotesOnly] = useState(false);
  return (
    <div
      className={`flex min-h-screen ${darkMode ? "bg-gray-900" : "bg-gradient-to-br from-purple-50 via-white to-violet-50"}`}>
      <Sidebar
        currentPage='chatbot'
        onNavigate={onNavigate}
        onLogout={onLogout}
        darkMode={darkMode}
      />
      <div className='flex-1 flex flex-col items-center justify-center'>
        <div style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
          <h2
            className={`text-2xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            AI Study Assistant
          </h2>
          <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Context-aware chatbot with access to all your materials
          </p>
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              gap: 16,
              alignItems: "center",
              justifyContent: "center",
            }}>
            <button
              onClick={() => setExamMode(!examMode)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                background: examMode ? "#dc3545" : "#28a745",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
              }}>
              Exam Mode: {examMode ? "ON" : "OFF"}
            </button>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 14,
                color: darkMode ? "#fff" : "#000",
              }}>
              <input
                type='checkbox'
                checked={notesOnly}
                onChange={(e) => setNotesOnly(e.target.checked)}
              />
              Notes-Only
            </label>
          </div>
          <RAGChat
            resourceId={resourceId}
            examMode={examMode}
            notesOnly={notesOnly}
          />
        </div>
      </div>
    </div>
  );
}
