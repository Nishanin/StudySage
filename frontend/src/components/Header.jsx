import React from "react";
import { Bell, User, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function Header({
  userName = "John Doe",
  userYear = "Year 3",
  darkMode = false,
  onProfileClick,
  showSearchAndProfile = false,
  onMenuClick,
  pageTitle: pageTitleProp,
}) {
  const location = useLocation();

  // Helper to map pathname to page title
  function getPageTitle(pathname) {
    if (pathname === "/") return "Dashboard";
    if (pathname.startsWith("/workspaces/") && pathname.split("/").length === 3)
      return "Study Workspace";
    if (pathname === "/workspaces") return "Study Workspaces";
    if (pathname.startsWith("/resources/")) return "Study Resources";
    if (pathname === "/profile") return "Profile";
    if (pathname === "/settings") return "Settings";
    return "Study Companion";
  }

  const pageTitle = pageTitleProp || getPageTitle(location.pathname);

  return (
    <header
      className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-100"} border-b px-4 md:px-8 py-4 sticky top-0 z-10`}>
      <div className='flex items-center justify-between'>
        {/* Hamburger Menu - Mobile Only */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className={`md:hidden p-2 ${darkMode ? "hover:bg-gray-700" : "hover:bg-purple-50"} rounded-xl transition-colors mr-4`}>
            <Menu
              className={`w-6 h-6 ${darkMode ? "text-white" : "text-gray-900"}`}
            />
          </button>
        )}

        {/* Page Title (replaces search bar) */}
        <div className='flex-1 flex items-center'>
          <span
            className={`font-bold text-xl md:text-2xl ${darkMode ? "text-white" : "text-gray-900"} truncate`}>
            {pageTitle}
          </span>
        </div>

        {/* Right Section (Notifications & Profile) */}
        <div className='flex items-center gap-4 ml-4 md:ml-8'>
          {/* Notifications */}
          <button
            className={`relative p-2 ${darkMode ? "hover:bg-gray-700" : "hover:bg-purple-50"} rounded-xl transition-colors`}>
            <Bell
              className={`w-6 h-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
            />
            <span className='absolute top-1 right-1 w-2 h-2 bg-purple-600 rounded-full'></span>
          </button>

          {/* User Profile */}
          <button
            onClick={onProfileClick}
            className={`flex items-center gap-3 pl-4 border-l ${darkMode ? "border-gray-700" : "border-purple-100"} hover:opacity-80 transition-opacity`}>
            <div className='text-right hidden sm:block'>
              <div
                className={`text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
                {userName}
              </div>
              <div
                className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {userYear}
              </div>
            </div>
            <div className='w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center'>
              <User className='w-5 h-5 text-white' />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
