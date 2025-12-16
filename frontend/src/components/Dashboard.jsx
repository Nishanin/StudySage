import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { BookOpen, FileText, Video, ArrowRight, TrendingUp, AlertCircle, Clock, Sparkles, Trophy } from 'lucide-react';
import { useState } from 'react';
import LiveLectureMode from './LiveLectureMode';
import PDFUploader from './PDFUploader';
import VideoLinkPaster from './VideoLinkPaster';

export default function Dashboard({ onNavigate, onLogout, darkMode = false, onFileUpload }) {
  const [showLiveLecture, setShowLiveLecture] = useState(false);
  const [showPDFUploader, setShowPDFUploader] = useState(false);
  const [showVideoLink, setShowVideoLink] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleFileUpload = (file) => {
    if (onFileUpload) {
      onFileUpload(file);
    }
    setShowPDFUploader(false);
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-violet-50'}`}>
      <Sidebar 
        currentPage="dashboard" 
        onNavigate={onNavigate} 
        onLogout={onLogout} 
        darkMode={darkMode}
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col">
        <Header 
          userName="John Doe" 
          userYear="Year 3" 
          darkMode={darkMode} 
          onProfileClick={() => onNavigate('profile')} 
          showSearchAndProfile={true}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h2 className={`text-2xl md:text-3xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h2>
            <p className={`text-sm md:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Welcome back! Here's your learning overview</p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {[
              {
                icon: BookOpen,
                title: 'Start Live Lecture Mode',
                description: 'Listen and transcribe lectures in real-time',
                color: 'from-purple-500 to-violet-500',
                action: () => setShowLiveLecture(true)
              },
              {
                icon: FileText,
                title: 'Open PDF / PPT',
                description: 'Upload and analyze study documents',
                color: 'from-violet-500 to-purple-500',
                action: () => setShowPDFUploader(true)
              },
              {
                icon: Video,
                title: 'Paste Video Link',
                description: 'Learn from YouTube lectures',
                color: 'from-purple-600 to-violet-600',
                action: () => setShowVideoLink(true)
              }
            ].map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`group text-left p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all shadow-lg ${darkMode ? 'border-gray-700 hover:border-gray-600 bg-gray-800' : 'border-purple-100 hover:border-purple-300 bg-white'} hover:shadow-xl`}
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${action.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <h4 className={`text-base md:text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{action.title}</h4>
                <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{action.description}</p>
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Continue Studying */}
            <div className={`lg:col-span-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border`}>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className={`text-lg md:text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>Continue Studying</h3>
                <button className={`text-xs md:text-sm ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}>View All</button>
              </div>

              <div className="space-y-3 md:space-y-4">
                {[
                  {
                    title: 'Object-Oriented Programming',
                    type: 'PDF Document',
                    progress: 65,
                    lastAccessed: '2 hours ago',
                    icon: FileText,
                    color: 'from-purple-500 to-violet-500'
                  },
                  {
                    title: 'Data Structures & Algorithms',
                    type: 'Lecture Video',
                    progress: 42,
                    lastAccessed: '1 day ago',
                    icon: Video,
                    color: 'from-violet-500 to-purple-500'
                  }
                ].map((item, index) => (
                  <div 
                    key={index}
                    className={`group p-3 md:p-4 rounded-xl border ${darkMode ? 'border-gray-700 hover:border-gray-600 bg-gray-750' : 'border-purple-100 hover:border-purple-300'} hover:shadow-md transition-all cursor-pointer`}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${item.color} rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <item.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm md:text-base mb-1 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                        <div className={`flex items-center gap-2 md:gap-3 text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <span>{item.type}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{item.lastAccessed}</span>
                        </div>
                        
                        <div className="mt-2 md:mt-3">
                          <div className={`flex items-center justify-between text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span>Progress</span>
                            <span>{item.progress}%</span>
                          </div>
                          <div className={`h-1.5 md:h-2 ${darkMode ? 'bg-gray-700' : 'bg-purple-100'} rounded-full overflow-hidden`}>
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all"
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => onNavigate('workspace')}
                        className={`px-4 py-2 ${darkMode ? 'bg-gray-700 text-purple-400 hover:bg-gray-600' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'} rounded-lg transition-colors opacity-0 group-hover:opacity-100`}
                      >
                        Resume
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Snapshot */}
            <div className="space-y-6">
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl p-6 shadow-lg border`}>
                <h3 className={`text-xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Today's Progress</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${darkMode ? 'bg-purple-900/40' : 'bg-purple-100'} rounded-xl flex items-center justify-center`}>
                        <BookOpen className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Topics Studied</div>
                        <div className={`text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>8</div>
                      </div>
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${darkMode ? 'bg-violet-900/40' : 'bg-violet-100'} rounded-xl flex items-center justify-center`}>
                        <Clock className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Study Time</div>
                        <div className={`text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>3.5h</div>
                      </div>
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${darkMode ? 'bg-red-900/40' : 'bg-red-100'} rounded-xl flex items-center justify-center`}>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weak Areas</div>
                        <div className={`text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>3</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gradient-to-br from-violet-900/40 to-purple-900/40 border-purple-700' : 'bg-gradient-to-br from-violet-100 to-purple-100 border-purple-200'} rounded-2xl p-6 border`}>
                <h4 className={darkMode ? 'text-white' : 'text-gray-900'}>Pending Revision</h4>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  You have 12 flashcards due for revision today
                </p>
                <button 
                  onClick={() => onNavigate('flashcards')}
                  className={`w-full py-2.5 rounded-lg transition-colors ${darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                >
                  Review Now
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showLiveLecture && <LiveLectureMode onClose={() => setShowLiveLecture(false)} darkMode={darkMode} />}
      {showPDFUploader && <PDFUploader onClose={() => setShowPDFUploader(false)} darkMode={darkMode} onUploadComplete={handleFileUpload} />}
      {showVideoLink && <VideoLinkPaster onClose={() => setShowVideoLink(false)} darkMode={darkMode} />}
    </div>
  );
}