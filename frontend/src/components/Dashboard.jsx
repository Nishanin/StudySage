import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { BookOpen, FileText, Video, ArrowRight, TrendingUp, AlertCircle, Clock, Sparkles, Trophy } from 'lucide-react';
import LiveLectureMode from './LiveLectureMode';
import PDFUploader from './PDFUploader';
import VideoLinkPaster from './VideoLinkPaster';
import { contentAPI, sessionAPI, authAPI } from '../utils/api';

export default function Dashboard({ user, onNavigate, onLogout, darkMode = false, onFileUpload }) {
  const [showLiveLecture, setShowLiveLecture] = useState(false);
  const [showPDFUploader, setShowPDFUploader] = useState(false);
  const [showVideoLink, setShowVideoLink] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [studyResources, setStudyResources] = useState([]);
  const [todayStats, setTodayStats] = useState({ topicsCovered: 0, studyTime: 0 });
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
    fetchDashboardData();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await authAPI.me();
      const userProfile = res?.data?.user || res?.user || null;
      if (userProfile) {
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch user resources from content API
      const resourcesData = await contentAPI.getUserResources();
      const resources = resourcesData?.data?.resources || [];
      
      // Transform backend resources to match frontend structure
      const transformedResources = resources.map(r => ({
        id: r.id,
        title: r.title || r.filename || 'Untitled',
        filename: r.filename,
        type: r.content_type?.includes('pdf') ? 'pdf' : r.content_type?.includes('video') || r.youtube_video_id ? 'video' : 'document',
        lastAccessed: new Date(r.uploaded_at).toLocaleDateString(),
        progress: 0, // Progress tracking not yet implemented
        section: r.section_title
      }));

      setStudyResources(transformedResources);

      // Fetch today's session data
      try {
        const sessionData = await sessionAPI.getActiveSession();
        if (sessionData?.data?.session) {
          const durationMs = sessionData.data.session.estimated_duration_ms || 0;
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          setTodayStats({ 
            topicsCovered: transformedResources.length > 0 ? 1 : 0, 
            studyTime: hours 
          });
        }
      } catch (sessionError) {
        // Session might not exist, keep defaults
        console.log('No active session');
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (uploadData) => {
    // Refresh dashboard data after upload
    fetchDashboardData();
    
    if (onFileUpload) {
      onFileUpload(uploadData);
    }
    setShowPDFUploader(false);
  };

  const handleVideoLoaded = (videoData) => {
    // Refresh dashboard data after video load
    fetchDashboardData();
    setShowVideoLink(false);
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
          userName={profile?.full_name || (profileLoading ? 'Loading...' : 'User')} 
          userYear={user?.year || ''} 
          darkMode={darkMode} 
          onProfileClick={() => onNavigate('profile')} 
          showSearchAndProfile={true}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h2 className={`text-2xl md:text-3xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h2>
            <p className={`text-sm md:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Welcome back, {profile?.full_name || 'there'}! Here's your learning overview</p>
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
                {studyResources.length > 0 && (
                  <button className={`text-xs md:text-sm ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}>View All</button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : studyResources.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`text-lg mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No study materials yet</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Upload a document or start a live lecture to begin</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {studyResources.slice(0, 2).map((item, index) => (
                    <div 
                      key={item.id || index}
                      className={`group p-3 md:p-4 rounded-xl border ${darkMode ? 'border-gray-700 hover:border-gray-600 bg-gray-750' : 'border-purple-100 hover:border-purple-300'} hover:shadow-md transition-all cursor-pointer`}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${item.type === 'pdf' ? 'from-purple-500 to-violet-500' : item.type === 'video' ? 'from-violet-500 to-purple-500' : 'from-purple-600 to-violet-600'} rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0`}>
                          {item.type === 'pdf' ? <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" /> : <Video className="w-5 h-5 md:w-6 md:h-6 text-white" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm md:text-base mb-1 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title || item.filename || 'Untitled'}</h4>
                          <div className={`flex items-center gap-2 md:gap-3 text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span>{item.type === 'pdf' ? 'PDF Document' : item.type === 'video' ? 'Video' : 'Document'}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">{item.lastAccessed || 'Recently'}</span>
                          </div>
                          
                          <div className="mt-2 md:mt-3">
                            <div className={`flex items-center justify-between text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <span>Progress</span>
                              <span>{item.progress || 0}%</span>
                            </div>
                            <div className={`h-1.5 md:h-2 ${darkMode ? 'bg-gray-700' : 'bg-purple-100'} rounded-full overflow-hidden`}>
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all"
                                style={{ width: `${item.progress || 0}%` }}
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
              )}
            </div>
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
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Topics Covered</div>
                        <div className={`text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{todayStats.topicsCovered}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${darkMode ? 'bg-violet-900/40' : 'bg-violet-100'} rounded-xl flex items-center justify-center`}>
                        <Clock className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Study Time</div>
                        <div className={`text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{todayStats.studyTime}h</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${darkMode ? 'bg-red-900/40' : 'bg-red-100'} rounded-xl flex items-center justify-center`}>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weak Areas</div>
                        <div className={`text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>-</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gradient-to-br from-violet-900/40 to-purple-900/40 border-purple-700' : 'bg-gradient-to-br from-violet-100 to-purple-100 border-purple-200'} rounded-2xl p-6 border`}>
                <h4 className={darkMode ? 'text-white' : 'text-gray-900'}>Pending Revision</h4>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  No flashcards due for revision yet
                </p>
                <button 
                  onClick={() => onNavigate('flashcards')}
                  className={`w-full py-2.5 rounded-lg transition-colors ${darkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
                >
                  Create Flashcards
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showLiveLecture && <LiveLectureMode onClose={() => setShowLiveLecture(false)} darkMode={darkMode} />}
      {showPDFUploader && <PDFUploader onClose={() => setShowPDFUploader(false)} darkMode={darkMode} onUploadComplete={handleFileUpload} />}
      {showVideoLink && <VideoLinkPaster onClose={() => setShowVideoLink(false)} darkMode={darkMode} onVideoLoaded={handleVideoLoaded} />}
    </div>
  );
}