import React, { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import StudyWorkspace from "./components/StudyWorkspace";
import StudyWorkspacesPage from "./components/StudyWorkspacesPage";
import WorkspaceDetailPage from "./components/WorkspaceDetailPage";
import ResourceViewerPage from "./components/ResourceViewerPage";
import Notes from "./components/Notes";
import Flashcards from "./components/Flashcards";
import Diagrams from "./components/Diagrams";
import Quizzes from "./components/Quizzes";
import Progress from "./components/Progress";
import Settings from "./components/Settings";
import Profile from "./components/Profile";
import FloatingChatbot from "./components/FloatingChatbot";
import { authAPI } from "./utils/api";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const userData = await authAPI.me();
          setUser(userData.data);
          setIsAuthenticated(true);
          if (location.pathname === "/" || location.pathname === "/auth") {
            navigate("/dashboard", { replace: true });
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("authToken");
        }
      }
      setLoadingUser(false);
    };

    checkAuth();
  }, [location.pathname, navigate]);

  const handleLogin = async () => {
    try {
      const userData = await authAPI.me();
      setUser(userData.data);
      setIsAuthenticated(true);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setIsAuthenticated(true);
      navigate("/dashboard", { replace: true });
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
    navigate("/", { replace: true });
  };

  const handleFileUpload = (fileData) => {
    const file = fileData instanceof File ? fileData : fileData?.file || null;
    const resId = fileData?.resourceId || null;

    if (resId) {
      navigate(`/study-resources/${resId}`, {
        state: { uploadedFile: file },
      });
    } else {
      navigate("/study-workspaces");
    }
  };

  const pageRouteMap = useMemo(
    () => ({
      landing: "/",
      auth: "/auth",
      dashboard: "/dashboard",
      workspace: "/study-workspaces",
      notes: "/notes",
      flashcards: "/flashcards",
      diagrams: "/diagrams",
      quizzes: "/quizzes",
      progress: "/progress",
      profile: "/profile",
      settings: "/settings",
    }),
    [],
  );

  const handleNavigate = (page) => {
    const target = pageRouteMap[page] || "/";
    navigate(target);
  };

  const RequireAuth = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to='/auth' replace />;
    }
    return children;
  };

  if (loadingUser) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode
            ? "bg-gray-900"
            : "bg-gradient-to-br from-purple-50 via-white to-violet-50"
        }`}>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <Routes>
        <Route
          path='/'
          element={
            <LandingPage
              onGetStarted={() => navigate("/auth")}
              darkMode={darkMode}
            />
          }
        />
        <Route
          path='/auth'
          element={
            isAuthenticated ? (
              <Navigate to='/dashboard' replace />
            ) : (
              <Auth
                onLogin={handleLogin}
                onBack={() => navigate("/")}
                darkMode={darkMode}
              />
            )
          }
        />
        <Route
          path='/dashboard'
          element={
            <RequireAuth>
              <Dashboard
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                darkMode={darkMode}
                onFileUpload={handleFileUpload}
              />
            </RequireAuth>
          }
        />
        <Route
          path='/study-workspaces'
          element={
            <RequireAuth>
              <StudyWorkspacesPage
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                darkMode={darkMode}
              />
            </RequireAuth>
          }
        />
        <Route
          path='/study-workspaces/:workspaceId'
          element={
            <RequireAuth>
              <WorkspaceDetailPage
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                darkMode={darkMode}
              />
            </RequireAuth>
          }
        />
        <Route
          path='/study-resources/:resourceId'
          element={
            <RequireAuth>
              <ResourceViewerPage
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                darkMode={darkMode}
              />
            </RequireAuth>
          }
        />
        <Route
          path='/notes'
          element={
            <RequireAuth>
              <Notes
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                darkMode={darkMode}
              />
            </RequireAuth>
          }
        />
        <Route
          path='/flashcards'
          element={
            <RequireAuth>
              <Flashcards
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                darkMode={darkMode}
              />
            </RequireAuth>
          }
        />
        <Route
          path='/diagrams'
          element={
            <RequireAuth>
              <Diagrams
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                darkMode={darkMode}
              />
            </RequireAuth>
          }
        />
        <Route
          path='/quizzes'
          element={
            <RequireAuth>
              <Quizzes
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                darkMode={darkMode}
              />
            </RequireAuth>
          }
        />
        <Route
          path='/progress'
          element={
            <RequireAuth>
              <Progress
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                darkMode={darkMode}
              />
            </RequireAuth>
          }
        />
        <Route
          path='/profile'
          element={
            <RequireAuth>
              <Profile
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                darkMode={darkMode}
              />
            </RequireAuth>
          }
        />
        <Route
          path='/settings'
          element={
            <RequireAuth>
              <Settings
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                darkMode={darkMode}
                onDarkModeToggle={setDarkMode}
              />
            </RequireAuth>
          }
        />
        <Route
          path='/workspace'
          element={
            <RequireAuth>
              <StudyWorkspace
                user={user}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
                darkMode={darkMode}
              />
            </RequireAuth>
          }
        />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
      {isAuthenticated && <FloatingChatbot user={user} darkMode={darkMode} />}
    </div>
  );
}
