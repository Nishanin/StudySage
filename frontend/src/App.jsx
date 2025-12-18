import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import StudyWorkspace from './components/StudyWorkspace';
import Notes from './components/Notes';
import Flashcards from './components/Flashcards';
import Quizzes from './components/Quizzes';
import Progress from './components/Progress';
import Settings from './components/Settings';
import Profile from './components/Profile';
import FloatingChatbot from './components/FloatingChatbot';
import { authAPI } from './utils/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await authAPI.me();
          setUser(userData.user);
          setIsAuthenticated(true);
          setCurrentPage('dashboard');
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('authToken');
        }
      }
      setLoadingUser(false);
    };

    checkAuth();
  }, []);

  const handleLogin = async () => {
    try {
      const userData = await authAPI.me();
      setUser(userData.user);
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // Still allow login even if user data fetch fails
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('landing');
  };

  const handleFileUpload = (fileData) => {
    // fileData can be either a File object or an object with { file, resourceId, ... }
    const file = fileData instanceof File ? fileData : (fileData?.file || fileData);
    setUploadedFile(file);
    setCurrentPage('workspace');
  };

  const renderPage = () => {
    if (loadingUser) {
      return (
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-violet-50'}`}>
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading...</p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'landing':
        return <LandingPage onGetStarted={() => setCurrentPage('auth')} darkMode={darkMode} />;
      case 'auth':
        return <Auth onLogin={handleLogin} onBack={() => setCurrentPage('landing')} darkMode={darkMode} />;
      case 'dashboard':
        return <Dashboard user={user} onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} onFileUpload={handleFileUpload} />;
      case 'workspace':
        return <StudyWorkspace user={user} onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} uploadedFile={uploadedFile} />;
      case 'notes':
        return <Notes user={user} onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} />;
      case 'flashcards':
        return <Flashcards user={user} onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} />;
      case 'quizzes':
        return <Quizzes user={user} onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} />;
      case 'progress':
        return <Progress user={user} onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} />;
      case 'profile':
        return <Profile user={user} onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} />;
      case 'settings':
        return <Settings user={user} onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} onDarkModeToggle={setDarkMode} />;
      default:
        return <LandingPage onGetStarted={() => setCurrentPage('auth')} darkMode={darkMode} />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {renderPage()}
      {/* Show floating chatbot only when authenticated */}
      {isAuthenticated && <FloatingChatbot user={user} darkMode={darkMode} />}
    </div>
  );
}