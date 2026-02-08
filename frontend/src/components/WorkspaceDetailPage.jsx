import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ResourceList from "./ResourceList";

export default function WorkspaceDetailPage({
  user,
  onNavigate,
  onLogout,
  darkMode = false,
}) {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [workspaceTitle] = useState("Workspace");

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
            <button
              onClick={() => navigate("/study-workspaces")}
              className={`flex items-center gap-2 text-sm mb-4 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              } hover:text-purple-600 transition-colors`}>
              <ChevronLeft className='w-4 h-4' />
              Back to workspaces
            </button>
            <h2
              className={`text-2xl md:text-3xl mb-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>
              {workspaceTitle}
            </h2>
            <p
              className={`text-sm md:text-base ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}>
              Study resources in this workspace.
            </p>
          </div>

          <ResourceList
            workspaceId={workspaceId}
            darkMode={darkMode}
            onSelect={(resource) =>
              navigate(`/study-resources/${resource?.id}`, {
                state: { resource },
              })
            }
          />
        </main>
      </div>
    </div>
  );
}
