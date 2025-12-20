import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Layers, Maximize2, Download, Menu } from 'lucide-react';
import mermaid from 'mermaid';

export default function Diagrams({ user, onNavigate, onLogout, darkMode = false }) {
  const [diagram, setDiagram] = useState(null);
  const [diagramType, setDiagramType] = useState('mindmap');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const diagramContainerRef = useRef(null);

  // Initialize mermaid on component mount
  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: darkMode ? 'dark' : 'default' });
  }, [darkMode]);

  // Render diagram when content changes
  useEffect(() => {
    const renderDiagram = async () => {
      if (!diagram || !diagramContainerRef.current) return;

      try {
        setError(null);
        const { svg } = await mermaid.render('diagram-output', diagram);
        if (diagramContainerRef.current) {
          diagramContainerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error('Diagram render error:', err);
        setError('Failed to render diagram. Please try again.');
      }
    };

    renderDiagram();
  }, [diagram, darkMode]);

  const getDiagramTypeLabel = (type) => {
    return type === 'mindmap' ? 'Mind Map' : 'Flowchart';
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-violet-50'}`}>
      <Sidebar 
        currentPage="diagrams" 
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
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h2 className={`text-2xl md:text-3xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Diagrams</h2>
              <p className={`text-sm md:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Visualize concepts and relationships with AI-generated diagrams</p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${darkMode ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-200'}`}>
                <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${darkMode ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-100 text-red-700'}`}
                >
                  Try again
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Diagram Container */}
            {!loading && diagram ? (
              <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-3xl shadow-2xl border p-8`}>
                {/* Diagram Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className={`text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{getDiagramTypeLabel(diagramType)}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Generated AI diagram</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className={`p-3 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-purple-50 text-gray-600'}`}
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                    <button 
                      className={`p-3 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-purple-50 text-gray-600'}`}
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Diagram Canvas */}
                <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100'} border rounded-2xl p-8 min-h-96 flex items-center justify-center overflow-auto`}>
                  <div
                    ref={diagramContainerRef}
                    className="flex items-center justify-center w-full"
                    style={{ minHeight: '384px' }}
                  />
                </div>

                {/* Info */}
                <div className={`mt-6 p-4 rounded-xl border ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-100'}`}>
                  <p className={`text-sm text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    💡 Diagrams help visualize complex concepts and their relationships at a glance
                  </p>
                </div>
              </div>
            ) : !loading && !error ? (
              <div className="text-center py-12">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-purple-100'}`}>
                  <Layers className={`w-10 h-10 ${darkMode ? 'text-gray-600' : 'text-purple-600'}`} />
                </div>
                <h3 className={`text-xl mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No diagrams yet</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Generate a diagram from your study materials to see it here</p>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
