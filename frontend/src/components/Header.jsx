import React from 'react';
import { Search, Bell, User, Menu } from 'lucide-react';

export default function Header({ userName = 'John Doe', userYear = 'Year 3', darkMode = false, onProfileClick, showSearchAndProfile = false, onMenuClick }) {
  return (
    <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} border-b px-4 md:px-8 py-4 sticky top-0 z-10`}>
      <div className="flex items-center justify-between">
        {/* Hamburger Menu - Mobile Only */}
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className={`md:hidden p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-50'} rounded-xl transition-colors mr-4`}
          >
            <Menu className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
          </button>
        )}
        
        {showSearchAndProfile ? (
          <>
            {/* Search */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search notes, topics, or ask a question..."
                  className={`w-full pl-12 pr-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-purple-50 border-purple-100'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4 ml-8">
              {/* Notifications */}
              <button className={`relative p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-50'} rounded-xl transition-colors`}>
                <Bell className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-purple-600 rounded-full"></span>
              </button>

              {/* User Profile */}
              <button 
                onClick={onProfileClick}
                className={`flex items-center gap-3 pl-4 border-l ${darkMode ? 'border-gray-700' : 'border-purple-100'} hover:opacity-80 transition-opacity`}
              >
                <div className="text-right hidden sm:block">
                  <div className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{userName}</div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userYear}</div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </button>
            </div>
          </>
        ) : (
          <div className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Study Companion</div>
        )}
      </div>
    </header>
  );
}