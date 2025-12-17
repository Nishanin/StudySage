import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { 
  User,
  Mail,
  Calendar,
  MapPin,
  Award,
  Target,
  TrendingUp,
  Edit2,
  Save,
  X,
  GraduationCap,
  Camera,
  Star,
  Clock
} from 'lucide-react';

export default function Profile({ user, onNavigate, onLogout, darkMode = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const stats = [
    { icon: Target, label: 'Average Score', value: '87%', color: 'from-purple-600 to-violet-600' },
    { icon: Award, label: 'Achievements', value: '24', color: 'from-violet-600 to-purple-600' }
  ];

  const achievements = [
    { icon: Award, title: 'Study Streak', description: '7 days in a row!', color: 'bg-yellow-500', earned: true },
    { icon: TrendingUp, title: 'Quick Learner', description: 'Completed 10 topics in a week', color: 'bg-blue-500', earned: true },
    { icon: Target, title: 'Perfect Score', description: 'Scored 100% on a quiz', color: 'bg-purple-500', earned: true },
    { icon: Award, title: 'Milestone Master', description: 'Reached 100 study hours', color: 'bg-green-500', earned: false },
    { icon: Award, title: 'Consistency King', description: 'Studied every day for a month', color: 'bg-red-500', earned: false },
    { icon: Award, title: 'Knowledge Expert', description: 'Mastered 50 topics', color: 'bg-indigo-500', earned: false }
  ];

  const recentActivity = [
    { action: 'Completed quiz', subject: 'Object-Oriented Programming', time: '2 hours ago', score: '92%' },
    { action: 'Created notes', subject: 'Data Structures', time: '5 hours ago', score: null },
    { action: 'Studied workspace', subject: 'Algorithms', time: 'Yesterday', score: null },
    { action: 'Completed flashcards', subject: 'Database Systems', time: '2 days ago', score: '88%' }
  ];

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-violet-50'}`}>
      <Sidebar 
        currentPage="profile" 
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
          <div className="max-w-6xl mx-auto">
            {/* Profile Header Card */}
            <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-750 border-gray-700' : 'bg-gradient-to-br from-white to-purple-50 border-purple-100'} rounded-3xl shadow-xl border p-8 mb-8`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-violet-600 rounded-3xl flex items-center justify-center shadow-lg">
                      <User className="w-16 h-16 text-white" />
                    </div>
                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-purple-50 hover:bg-purple-50 transition-colors">
                      <Camera className="w-5 h-5 text-purple-600" />
                    </button>
                  </div>

                  {/* User Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className={`text-4xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'User'}</h1>
                    </div>
                    <div className={`flex items-center gap-2 mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <GraduationCap className="w-5 h-5" />
                      <span>{user?.field || 'Student'}{user?.year ? ` • Year ${user.year}` : ''}</span>
                    </div>
                    
                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{user?.email || 'No email'}</span>
                      </div>
                      <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}</span>
                      </div>
                      <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">New York, USA</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>

              {/* Bio */}
              <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-purple-100'}`}>
                <h3 className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bio</h3>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Passionate computer science student focused on AI and machine learning. Love using StudyAI to enhance my learning experience and stay on top of my coursework. Always looking to improve and learn new technologies!
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl p-6 shadow-lg border`}>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`text-3xl mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Achievements & Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Achievements */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl shadow-lg border p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>Achievements</h2>
                  <div className={`px-3 py-1 ${darkMode ? 'bg-gray-700' : 'bg-purple-100'} rounded-lg`}>
                    <span className={`text-sm ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>0 Unlocked</span>
                  </div>
                </div>

                {achievements.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No achievements earned yet. Keep studying to unlock badges!</p>
                  </div>
                ) : (
                <div className="grid grid-cols-3 gap-4">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        achievement.earned
                          ? darkMode 
                            ? 'bg-gray-750 border-purple-500 shadow-lg' 
                            : 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 shadow-md'
                          : darkMode
                            ? 'bg-gray-700/50 border-gray-600 opacity-60'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className={`w-12 h-12 ${achievement.color} rounded-xl flex items-center justify-center mb-3 mx-auto ${
                        !achievement.earned && 'grayscale opacity-50'
                      }`}>
                        <achievement.icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className={`text-sm text-center mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {achievement.title}
                      </h4>
                      <p className={`text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {achievement.description}
                      </p>
                      {achievement.earned && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Star className="w-4 h-4 text-white fill-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl shadow-lg border p-6`}>
                <h2 className={`text-2xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h2>

                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className={`p-4 ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-purple-50 border-purple-100'} rounded-xl border`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className={darkMode ? 'text-white' : 'text-gray-900'}>{activity.action}</h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{activity.subject}</p>
                        </div>
                        {activity.score && (
                          <div className="px-3 py-1 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg">
                            <span className="text-sm text-white">{activity.score}</span>
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </div>
                    </div>
                  ))}
                </div>

                {recentActivity.length > 0 && (
                  <button 
                    onClick={() => onNavigate('progress')}
                    className={`w-full mt-4 px-4 py-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'} rounded-xl transition-colors`}
                  >
                    View Full Activity
                  </button>
                )}
              </div>
            </div>

            {/* Study Preferences */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl shadow-lg border p-6 mt-8`}>
              <h2 className={`text-2xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Study Preferences</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className={`text-sm mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Preferred Study Time</label>
                  <select className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-purple-50 border-purple-200'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}>
                    <option>Morning (6AM - 12PM)</option>
                    <option>Afternoon (12PM - 6PM)</option>
                    <option>Evening (6PM - 12AM)</option>
                    <option>Night (12AM - 6AM)</option>
                  </select>
                </div>

                <div>
                  <label className={`text-sm mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Learning Style</label>
                  <select className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-purple-50 border-purple-200'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}>
                    <option>Visual</option>
                    <option>Auditory</option>
                    <option>Reading/Writing</option>
                    <option>Kinesthetic</option>
                  </select>
                </div>

                <div>
                  <label className={`text-sm mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Daily Study Goal</label>
                  <select className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-purple-50 border-purple-200'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500`}>
                    <option>1 hour</option>
                    <option>2 hours</option>
                    <option>3 hours</option>
                    <option>4+ hours</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}