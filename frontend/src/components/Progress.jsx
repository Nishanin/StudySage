import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { TrendingUp, BookOpen, Clock, Target, AlertCircle, Award, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function Progress({ onNavigate, onLogout, darkMode = false }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const studyTimeData = [
    { day: 'Mon', hours: 2.5 },
    { day: 'Tue', hours: 3.2 },
    { day: 'Wed', hours: 1.8 },
    { day: 'Thu', hours: 4.1 },
    { day: 'Fri', hours: 2.9 },
    { day: 'Sat', hours: 3.5 },
    { day: 'Sun', hours: 2.2 }
  ];

  const topicsProgressData = [
    { day: '1', topics: 3 },
    { day: '2', topics: 5 },
    { day: '3', topics: 4 },
    { day: '4', topics: 7 },
    { day: '5', topics: 6 },
    { day: '6', topics: 8 },
    { day: '7', topics: 5 }
  ];

  const weakAreasData = [
    { subject: 'OOP', score: 65 },
    { subject: 'Data Structures', score: 80 },
    { subject: 'Algorithms', score: 55 },
    { subject: 'Databases', score: 75 },
    { subject: 'Networks', score: 60 }
  ];

  const confusionHeatmap = [
    { topic: 'Inheritance', confusion: 45, color: 'bg-yellow-200' },
    { topic: 'Polymorphism', confusion: 75, color: 'bg-red-300' },
    { topic: 'Encapsulation', confusion: 20, color: 'bg-green-200' },
    { topic: 'Abstraction', confusion: 60, color: 'bg-orange-200' },
    { topic: 'Interfaces', confusion: 50, color: 'bg-yellow-300' },
    { topic: 'Exception Handling', confusion: 35, color: 'bg-yellow-100' }
  ];

  const stats = [
    { icon: BookOpen, label: 'Topics Studied', value: '42', change: '+12%', color: 'from-purple-500 to-violet-500' },
    { icon: Clock, label: 'Total Study Time', value: '28.5h', change: '+8%', color: 'from-violet-500 to-purple-500' },
    { icon: Target, label: 'Quiz Score Avg', value: '84%', change: '+5%', color: 'from-purple-600 to-violet-600' },
    { icon: Award, label: 'Flashcards Mastered', value: '156', change: '+24', color: 'from-violet-600 to-purple-600' }
  ];

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-500 via-white to-violet-50'}`}>
      <Sidebar 
        currentPage="progress" 
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
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className={`text-3xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Progress & Insights</h2>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Track your learning journey and identify areas for improvement</p>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl p-6 shadow-lg border`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-green-500 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      {stat.change}
                    </div>
                  </div>
                  <div className={`text-3xl mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Study Time Chart */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl p-6 shadow-lg border`}>
                <h3 className={`text-xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Weekly Study Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={studyTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="day" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                    <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        border: darkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                        borderRadius: '0.75rem',
                        color: darkMode ? '#FFFFFF' : '#000000'
                      }}
                    />
                    <Bar dataKey="hours" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9333EA" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Topics Progress Chart */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl p-6 shadow-lg border`}>
                <h3 className={`text-xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Topics Learned (Last 7 Days)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={topicsProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="day" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                    <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        border: darkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                        borderRadius: '0.75rem',
                        color: darkMode ? '#FFFFFF' : '#000000'
                      }}
                    />
                    <Line type="monotone" dataKey="topics" stroke="#9333EA" strokeWidth={3} dot={{ fill: '#9333EA', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weak Areas & Confusion Heatmap */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Weak Areas */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl p-6 shadow-lg border`}>
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
                  <h3 className={`text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>Weak Areas to Focus</h3>
                </div>
                <div className="space-y-4">
                  {weakAreasData.map((area, index) => (
                    <div key={index}>
                      <div className={`flex items-center justify-between mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span>{area.subject}</span>
                        <span>{area.score}%</span>
                      </div>
                      <div className={`h-3 ${darkMode ? 'bg-gray-700' : 'bg-purple-100'} rounded-full overflow-hidden`}>
                        <div
                          className={`h-full rounded-full ${
                            area.score >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                            area.score >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                            'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}
                          style={{ width: `${area.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confusion Heatmap */}
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl p-6 shadow-lg border`}>
                <h3 className={`text-xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Topic Confusion Heatmap</h3>
                <div className="space-y-3">
                  {confusionHeatmap.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className={`flex items-center justify-between mb-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span>{item.topic}</span>
                          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.confusion}% confused</span>
                        </div>
                        <div className={`h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
                          <div
                            className={`h-full rounded-full ${
                              item.confusion >= 70 ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                              item.confusion >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              item.confusion >= 30 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                              'bg-gradient-to-r from-green-500 to-emerald-500'
                            }`}
                            style={{ width: `${item.confusion}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className={`text-sm mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Based on quiz responses and AI chatbot interactions
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}