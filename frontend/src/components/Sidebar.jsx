import React from 'react';
import { 
  Home, 
  BookOpen, 
  FileText, 
  CreditCard, 
  Brain as BrainQuiz, 
  BarChart3, 
  Settings, 
  LogOut,
  Brain,
  User,
  X,
  Layers
} from 'lucide-react';
import logoImage from '../assets/a1cc9b00771e3e571f802dca94aac15bb06b4f82.png';

export default function Sidebar({ currentPage, onNavigate, onLogout, darkMode = false, isMobileOpen = false, onClose }) {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'workspace', icon: BookOpen, label: 'Study Workspace' },
    { id: 'notes', icon: FileText, label: 'Notes' },
    { id: 'diagrams', icon: Layers, label: 'Diagrams' },
    { id: 'flashcards', icon: CreditCard, label: 'Flashcards' },
    { id: 'quizzes', icon: BrainQuiz, label: 'Quizzes' },
    { id: 'progress', icon: BarChart3, label: 'Progress' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleNavigate = (page) => {
    onNavigate(page);
    if (onClose) onClose(); // Close mobile menu after navigation
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed md:sticky top-0 left-0 z-50 md:z-auto
        w-64 h-screen 
        ${darkMode ? 'bg-gradient-to-b from-gray-800 to-gray-900' : 'bg-gradient-to-b from-purple-600 to-violet-700'} 
        flex flex-col 
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2">
              <img src={logoImage} alt="StudySage Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl text-white">StudySage</span>
          </div>
          {/* Close button for mobile */}
          {onClose && (
            <button 
              onClick={onClose}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
    </>
  );
}