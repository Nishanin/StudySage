import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ResourcePageTabs from "./ResourcePageTabs";

// TODO: Replace mock notes with API call when endpoint available
const MOCK_NOTES = `# Mock Notes
## Key Concepts
- Topic explanation
- Bullet points
- Important definitions

## Summary
This will later come from backend.`;

// Simple markdown to HTML (no external lib)
function markdownToHtml(md) {
  if (!md || typeof md !== "string") return "";
  return md
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) return `<h3>${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith("## ")) return `<h2>${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("# ")) return `<h1>${trimmed.slice(2)}</h1>`;
      if (trimmed.startsWith("- ")) return `<li>${trimmed.slice(2)}</li>`;
      if (trimmed.startsWith("* ")) return `<li>${trimmed.slice(2)}</li>`;
      return trimmed ? `<p>${trimmed}</p>` : "";
    })
    .join("\n");
}

export default function ResourceNotesPage({
  user,
  onNavigate,
  onLogout,
  darkMode = false,
}) {
  const { resourceId } = useParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // TODO: Replace mock notes with API call when endpoint available
    setNotes(MOCK_NOTES);
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
            activeTab='notes'
            darkMode={darkMode}
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
            <div
              className={`notes-content [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_li]:list-disc [&_li]:ml-6 [&_ul]:mb-4 ${
                darkMode ? "[&_*]:text-gray-200" : "[&_*]:text-gray-800"
              }`}
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(notes),
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
