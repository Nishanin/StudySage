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
          pageTitle='Study Workspace'
        />

        <main className='flex-1 p-4 md:p-8 overflow-y-auto'>
          <div className='mb-6 md:mb-8'>
            <div className='relative flex items-center justify-center'>
              <button
                onClick={() => navigate("/study-workspaces")}
                className={`absolute left-0 flex items-center gap-2 text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                } hover:text-purple-600 transition-colors`}>
                <ChevronLeft className='w-4 h-4' />
                Back to workspaces
              </button>
              <h2
                className={`text-2xl md:text-3xl font-bold mx-auto ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}>
                {workspaceTitle}
              </h2>
            </div>
          </div>
          <ResourceList
            workspaceId={workspaceId}
            workspaceName={workspaceTitle}
            darkMode={darkMode}
            onSelect={(resource) =>
              navigate(`/study-resources/${resource?.id}/notes`, {
                state: { resource },
              })
            }
            onResourceCreated={(resourceId) =>
              navigate(`/study-resources/${resourceId}/notes`)
            }
          />
        </main>
      </div>
    </div>
  );
}
