import React from 'react';
import { BookOpen, Headphones, FileText, MessageCircle, Lightbulb, Brain, BarChart3, Sparkles, PlayCircle, ArrowRight } from 'lucide-react';
import logoImage from '../assets/a1cc9b00771e3e571f802dca94aac15bb06b4f82.png';

export default function LandingPage({ onGetStarted, darkMode = false }) {
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900' : 'bg-gradient-to-br from-purple-50 via-white to-violet-50'}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-br from-purple-900/20 to-violet-900/20' : 'bg-gradient-to-br from-purple-600/5 to-violet-600/5'}`}></div>
        
        {/* Navigation */}
        <nav className="relative px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${darkMode ? 'bg-white' : 'bg-white'} rounded-xl flex items-center justify-center p-2`}>
                <img src={logoImage} alt="StudySage Logo" className="w-full h-full object-contain" />
              </div>
              <span className={`text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>StudySage</span>
            </div>
            <div className="flex items-center gap-4">
              <button className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:text-purple-400' : 'text-gray-700 hover:text-purple-600'} transition-colors`}>
                About
              </button>
              <button className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:text-purple-400' : 'text-gray-700 hover:text-purple-600'} transition-colors`}>
                Contact
              </button>
              <button 
                onClick={onGetStarted}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className={`inline-flex items-center gap-2 px-4 py-2 ${darkMode ? 'bg-purple-900/50' : 'bg-purple-100'} rounded-full`}>
                <Sparkles className={`w-4 h-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <span className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>AI-Powered Learning Platform</span>
              </div>
              
              <h1 className={`text-5xl leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Your Personal AI Study Companion
              </h1>
              
              <p className={`text-xl leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Listens to lectures, reads PDFs & PPTs live, generates notes, summaries, flashcards, and explains doubts in real time.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={onGetStarted}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2"
                >
                  Start Studying
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-8 py-4 border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-violet-400 rounded-3xl blur-3xl opacity-20"></div>
              <img 
                src="https://images.unsplash.com/photo-1758612214899-c1bb0bfae408?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwbGVhcm5pbmclMjBvbmxpbmV8ZW58MXx8fHwxNzY1Njk2ODY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Student learning"
                className="relative rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Problem → Solution Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Problem */}
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-3xl p-8 shadow-lg border`}>
            <div className={`w-12 h-12 ${darkMode ? 'bg-red-900/30' : 'bg-red-100'} rounded-xl flex items-center justify-center mb-6`}>
              <span className="text-2xl">😰</span>
            </div>
            <h3 className={`text-2xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Why Students Struggle Today</h3>
            <ul className="space-y-4">
              {[
                'Watching long lectures without understanding key points',
                'Reading PDFs without clarity or context',
                'Spending hours on manual note-making',
                'Searching for explanations across multiple platforms',
                'No personalized learning or weak area tracking'
              ].map((problem, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full ${darkMode ? 'bg-red-900/40' : 'bg-red-100'} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>✕</span>
                  </div>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{problem}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solution */}
          <div className="bg-gradient-to-br from-purple-600 to-violet-600 rounded-3xl p-8 shadow-lg text-white">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl mb-6">How Our System Solves This</h3>
            <ul className="space-y-4">
              {[
                'Live lecture listening with AI transcription',
                'Live PDF / PPT understanding and analysis',
                'Auto-generated notes, summaries & key points',
                'Context-aware AI chatbot for instant explanations',
                'Personalized flashcards and adaptive quizzes',
                'Track progress and identify weak areas'
              ].map((solution, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white">✓</span>
                  </div>
                  <span className="text-white/95">{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className={`text-4xl mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Powerful Features for Smarter Learning</h2>
          <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Everything you need to excel in your studies</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Headphones,
              title: 'Live Lecture Listening',
              description: 'AI listens to your lectures in real-time and generates structured notes automatically',
              color: 'from-purple-500 to-violet-500'
            },
            {
              icon: FileText,
              title: 'Live PDF / PPT Understanding',
              description: 'Upload documents and get instant summaries, key points, and explanations',
              color: 'from-violet-500 to-purple-500'
            },
            {
              icon: BookOpen,
              title: 'Auto Notes & Summaries',
              description: 'Never miss important points with AI-generated notes and chapter summaries',
              color: 'from-purple-600 to-violet-600'
            },
            {
              icon: MessageCircle,
              title: 'Context-Aware Chatbot',
              description: 'Ask questions about your study material and get instant, accurate answers',
              color: 'from-violet-600 to-purple-600'
            },
            {
              icon: Lightbulb,
              title: 'Flashcards & Quizzes',
              description: 'Practice with AI-generated flashcards and adaptive quizzes tailored to you',
              color: 'from-purple-500 to-violet-600'
            },
            {
              icon: BarChart3,
              title: 'Learning Dashboard',
              description: 'Track your progress, identify weak areas, and optimize your study time',
              color: 'from-violet-500 to-purple-600'
            }
          ].map((feature, index) => (
            <div key={index} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl p-6 shadow-lg border hover:shadow-xl transition-shadow`}>
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className={`text-xl mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-purple-600 to-violet-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl mb-4">Ready to Transform Your Learning?</h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already learning smarter with AI
          </p>
          <button 
            onClick={onGetStarted}
            className="px-10 py-4 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-colors inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-10 h-10 ${darkMode ? 'bg-white' : 'bg-white'} rounded-lg flex items-center justify-center p-1.5`}>
                  <img src={logoImage} alt="StudySage Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl text-gray-900">StudySage</span>
              </div>
              <p className="text-gray-600">StudySage - Your intelligent study companion for better learning outcomes.</p>
            </div>
            <div>
              <h4 className="text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-purple-600">Features</a></li>
                <li><a href="#" className="hover:text-purple-600">Pricing</a></li>
                <li><a href="#" className="hover:text-purple-600">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-purple-600">About</a></li>
                <li><a href="#" className="hover:text-purple-600">Contact</a></li>
                <li><a href="#" className="hover:text-purple-600">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-purple-100 text-center text-gray-600">
            <p>© 2025 StudySage. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}