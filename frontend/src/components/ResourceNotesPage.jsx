import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useStudyContext } from "../context/StudyContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ResourcePageTabs from "./ResourcePageTabs";
import NotesViewer from "./NotesViewer";
import FlashcardViewer from "./FlashcardViewer";
import QuizViewer from "./QuizViewer";
import MindMapViewer from "./MindMapViewer";

export default function ResourceNotesPage({
  user,
  onNavigate,
  onLogout,
  darkMode = false,
}) {
  const { resourceId } = useParams();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState("notes");
  const { setResourceId, setWorkspaceId, setViewType } = useStudyContext();

  useEffect(() => {
    setResourceId(resourceId || null);
    // Try to get workspaceId from location.state, fallback to null
    const wsId = location.state?.workspaceId || null;
    setWorkspaceId(wsId);
    setViewType(viewMode);
    // eslint-disable-next-line
  }, [resourceId, viewMode]);

  return (
    <div
      className={`flex min-h-screen ${
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-purple-50 via-white to-violet-50"
      }`}>
      <Sidebar
        currentPage='workspace'
        onNavigate={onNavigate}
        onLogout={onLogout}
        darkMode={darkMode}
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className='flex-1 flex flex-col'>
        <Header
          userName={user?.name || "User"}
          userYear={user?.year || ""}
          darkMode={darkMode}
          onProfileClick={() => onNavigate("profile")}
          showSearchAndProfile={true}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          pageTitle='Study Resources'
        />

        <main className='flex-1 p-4 md:p-8 overflow-y-auto'>
          {/* Only show 'View' tab for file resources. Assume resourceId does not start with 'live-' or 'yt-' for files. */}
          <ResourcePageTabs
            resourceId={resourceId}
            activeTab={viewMode}
            darkMode={darkMode}
            onTabChange={setViewMode}
            showViewTab={
              resourceId &&
              !resourceId.startsWith("live-") &&
              !resourceId.startsWith("yt-")
            }
          />

          <div
            className={`rounded-2xl border p-6 md:p-8 ${
              darkMode
                ? "bg-gray-800 border-gray-700 text-gray-200"
                : "bg-white border-purple-100 text-gray-800"
            }`}>
            {viewMode === "notes" ? (
              <NotesViewer noteId={resourceId} />
            ) : viewMode === "flashcards" ? (
              <FlashcardViewer resourceId={resourceId} />
            ) : viewMode === "quiz" ? (
              <QuizViewer resourceId={resourceId} />
            ) : viewMode === "mindmap" ? (
              <MindMapViewer resourceId={resourceId} />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
