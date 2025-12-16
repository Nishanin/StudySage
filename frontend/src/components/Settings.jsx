import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Mic, Video, Bell, Download, Zap, Moon, Globe } from 'lucide-react';

export default function Settings({ onNavigate, onLogout, darkMode = false, onDarkModeToggle }) {
  const [liveLectureMode, setLiveLectureMode] = useState(false);
  const [videoLinkMode, setVideoLinkMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoExport, setAutoExport] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-14 h-7 rounded-full transition-colors ${
        enabled ? 'bg-gradient-to-r from-purple-600 to-violet-600' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
      }`}
    >
      <div
        className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-8' : 'translate-x-1'
        }`}
      ></div>
    </button>
  );

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-violet-50'}`}>
      <Sidebar 
        currentPage="settings" 
        onNavigate={onNavigate} 
        onLogout={onLogout} 
        darkMode={darkMode}
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col">
        <Header 
          darkMode={darkMode}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className={`text-3xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Customize your study experience</p>
            </div>

            {/* Study Modes */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl shadow-lg border mb-6 overflow-hidden`}>
              <div className={`px-6 py-4 ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100'} border-b`}>
                <h3 className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Study Modes</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${darkMode ? 'bg-purple-900/40' : 'bg-purple-100'} rounded-xl flex items-center justify-center`}>
                      <Mic className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Live Lecture Mode</h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Enable real-time audio transcription during lectures</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={liveLectureMode} onChange={setLiveLectureMode} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${darkMode ? 'bg-violet-900/40' : 'bg-violet-100'} rounded-xl flex items-center justify-center`}>
                      <Video className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <h4 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Video Link Mode</h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Process and analyze YouTube lecture videos</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={videoLinkMode} onChange={setVideoLinkMode} />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl shadow-lg border mb-6 overflow-hidden`}>
              <div className={`px-6 py-4 ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100'} border-b`}>
                <h3 className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${darkMode ? 'bg-purple-900/40' : 'bg-purple-100'} rounded-xl flex items-center justify-center`}>
                      <Bell className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Push Notifications</h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Get notified about revision reminders and study streaks</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={notificationsEnabled} onChange={setNotificationsEnabled} />
                </div>

                {notificationsEnabled && (
                  <div className={`ml-16 space-y-3 pl-6 border-l-2 ${darkMode ? 'border-purple-700' : 'border-purple-200'}`}>
                    <label className={`flex items-center gap-3 text-sm cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500" />
                      Flashcard revision reminders
                    </label>
                    <label className={`flex items-center gap-3 text-sm cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500" />
                      Pending quiz notifications
                    </label>
                    <label className={`flex items-center gap-3 text-sm cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <input type="checkbox" className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500" />
                      Daily study goal reminders
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Export Options */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl shadow-lg border mb-6 overflow-hidden`}>
              <div className={`px-6 py-4 ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100'} border-b`}>
                <h3 className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Export & Backup</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${darkMode ? 'bg-purple-900/40' : 'bg-purple-100'} rounded-xl flex items-center justify-center`}>
                      <Download className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Auto-export Notes</h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Automatically save notes as PDF after each session</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={autoExport} onChange={setAutoExport} />
                </div>

                <div className="ml-16 flex gap-3">
                  <button className={`px-6 py-3 rounded-xl transition-colors ${darkMode ? 'bg-gray-700 text-purple-400 hover:bg-gray-600' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>
                    Export All Notes
                  </button>
                  <button className={`px-6 py-3 rounded-xl transition-colors ${darkMode ? 'bg-gray-700 text-purple-400 hover:bg-gray-600' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>
                    Export Flashcards
                  </button>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl shadow-lg border mb-6 overflow-hidden`}>
              <div className={`px-6 py-4 ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100'} border-b`}>
                <h3 className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Appearance</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${darkMode ? 'bg-purple-900/40' : 'bg-purple-100'} rounded-xl flex items-center justify-center`}>
                      <Moon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dark Mode</h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Switch to dark theme for reduced eye strain</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={darkMode} onChange={(val) => onDarkModeToggle?.(val)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${darkMode ? 'bg-violet-900/40' : 'bg-violet-100'} rounded-xl flex items-center justify-center`}>
                      <Globe className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <h4 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Language</h4>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Select your preferred language</p>
                    </div>
                  </div>
                  <select className={`px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-purple-50 border-purple-200'} border`}>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Settings */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl shadow-lg border overflow-hidden`}>
              <div className={`px-6 py-4 ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100'} border-b`}>
                <h3 className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Preferences</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className={`block mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Response Style</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Concise', 'Balanced', 'Detailed'].map((style) => (
                      <button
                        key={style}
                        className={`px-4 py-3 rounded-xl transition-all ${
                          style === 'Balanced'
                            ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg'
                            : darkMode 
                              ? 'bg-gray-700 text-purple-400 hover:bg-gray-600'
                              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Flashcard Difficulty</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Easy', 'Mixed', 'Challenging'].map((difficulty) => (
                      <button
                        key={difficulty}
                        className={`px-4 py-3 rounded-xl transition-all ${
                          difficulty === 'Mixed'
                            ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg'
                            : darkMode 
                              ? 'bg-gray-700 text-purple-400 hover:bg-gray-600'
                              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                        }`}
                      >
                        {difficulty}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}