import React, { useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ResourcePageTabs from "./ResourcePageTabs";
import NotesViewer from "./NotesViewer";
import FlashcardViewer from "./FlashcardViewer";

export default function ResourceNotesPage({
  user,
  onNavigate,
  onLogout,
  darkMode = false,
}) {
  const { resourceId } = useParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState("notes");

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
            ) : (
              <FlashcardViewer resourceId={resourceId} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
