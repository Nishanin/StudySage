import React, { useState } from 'react';
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

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('landing');
  };

  const handleFileUpload = (file) => {
    setUploadedFile(file);
    setCurrentPage('workspace');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onGetStarted={() => setCurrentPage('auth')} darkMode={darkMode} />;
      case 'auth':
        return <Auth onLogin={handleLogin} onBack={() => setCurrentPage('landing')} darkMode={darkMode} />;
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} onFileUpload={handleFileUpload} />;
      case 'workspace':
        return <StudyWorkspace onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} uploadedFile={uploadedFile} />;
      case 'notes':
        return <Notes onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} />;
      case 'flashcards':
        return <Flashcards onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} />;
      case 'quizzes':
        return <Quizzes onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} />;
      case 'progress':
        return <Progress onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} />;
      case 'profile':
        return <Profile onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} />;
      case 'settings':
        return <Settings onNavigate={setCurrentPage} onLogout={handleLogout} darkMode={darkMode} onDarkModeToggle={setDarkMode} />;
      default:
        return <LandingPage onGetStarted={() => setCurrentPage('auth')} darkMode={darkMode} />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {renderPage()}
      {/* Show floating chatbot only when authenticated */}
      {isAuthenticated && <FloatingChatbot darkMode={darkMode} />}
    </div>
  );
}