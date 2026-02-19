import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useStudyContext } from "../context/StudyContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ResourceViewer from "./ResourceViewer";
import ResourcePageTabs from "./ResourcePageTabs";

export default function ResourceViewerPage({
  user,
  onNavigate,
  onLogout,
  darkMode = false,
}) {
  const { resourceId } = useParams();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { setResourceId, setWorkspaceId, setViewType } = useStudyContext();

  useEffect(() => {
    setResourceId(resourceId || null);
    // Try to get workspaceId from location.state, fallback to null
    const wsId = location.state?.workspaceId || null;
    setWorkspaceId(wsId);
    setViewType("pdf");
    // eslint-disable-next-line
  }, [resourceId]);

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
            activeTab='view'
            darkMode={darkMode}
            showViewTab={
              resourceId &&
              !resourceId.startsWith("live-") &&
              !resourceId.startsWith("yt-")
            }
          />

          <ResourceViewer resourceId={resourceId} darkMode={darkMode} />
        </main>
      </div>
    </div>
  );
}
