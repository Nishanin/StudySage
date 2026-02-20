import React from "react";
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
          <RAGChat resourceId={resourceId} />
        </div>
      </div>
    </div>
  );
}
