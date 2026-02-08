import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import WorkspaceList from "./WorkspaceList";

export default function StudyWorkspacesPage({
  user,
  onNavigate,
  onLogout,
  darkMode = false,
}) {
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
        />

        <main className='flex-1 p-4 md:p-8 overflow-y-auto'>
          <div className='mb-6 md:mb-8'>
            <h2
              className={`text-2xl md:text-3xl mb-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>
              Study Workspaces
            </h2>
            <p
              className={`text-sm md:text-base ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}>
              Browse all of your workspaces and continue where you left off.
            </p>
          </div>

          <WorkspaceList
            user={user}
            darkMode={darkMode}
            onSelect={(workspace) =>
              navigate(`/study-workspaces/${workspace?.id}`)
            }
          />
        </main>
      </div>
    </div>
  );
}
