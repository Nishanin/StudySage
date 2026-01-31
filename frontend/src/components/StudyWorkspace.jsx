import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DocumentViewer from './DocumentViewer';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  FileText,
  Lightbulb,
  List,
  GitBranch,
  CreditCard,
  Send,
  Sparkles,
  Radio,
  Maximize2,
  Download,
  MessageSquare,
  BookOpen,
  Brain,
  Layers,
  Pen,
  X,
  Menu,
  Loader
} from 'lucide-react';
import { contextAPI, chatAPI, aiAPI, contentAPI } from '../utils/api';
import { getOrCreateUUID } from '../utils/uuid';

export default function StudyWorkspace({ onNavigate, onLogout, darkMode = false, uploadedFile = null, resourceId = null }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(24);
  const [zoom, setZoom] = useState(100);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [fileURL, setFileURL] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [contextUpdateTimer, setContextUpdateTimer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => getOrCreateUUID('sessionId'));
  const [finalResourceId, setFinalResourceId] = useState(() => resourceId || getOrCreateUUID('resourceId'));
  const [currentResourceTitle, setCurrentResourceTitle] = useState(uploadedFile?.name || 'Untitled Document');
  const [viewerError, setViewerError] = useState(null);

  // Determine file name and type BEFORE useEffects
  const fileName = uploadedFile?.name || 'Object-Oriented Programming.pdf';
  const fileType = uploadedFile?.type || 'application/pdf';
  const isPDF = fileType === 'application/pdf';

  // Update finalResourceId when resourceId prop changes
  useEffect(() => {
    if (resourceId) {
      console.log('Resource ID from props:', resourceId);
      setFinalResourceId(resourceId);
    }
  }, [resourceId]);

  // Create object URL for uploaded file
  useEffect(() => {
    if (uploadedFile && uploadedFile instanceof File) {
      const url = URL.createObjectURL(uploadedFile);
      setFileURL(url);
      setViewerError(null);
      setCurrentResourceTitle(uploadedFile.name);
      return () => URL.revokeObjectURL(url);
    }
  }, [uploadedFile]);

  // Fetch file from backend when resourceId is provided (Resume button)
  useEffect(() => {
    const fetchResourceFile = async () => {
      if (resourceId && !uploadedFile && !fileURL) {
        try {
          console.log('Fetching resource file for resourceId:', resourceId);
          setIsLoading(true);
          
          // Get the file blob from backend
          const blob = await contentAPI.getResourceFile(resourceId);
          
          // Create object URL from blob
          const url = URL.createObjectURL(blob);
          setFileURL(url);
          setViewerError(null);
          
          console.log('✅ Resource file loaded successfully');
          
          return () => URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Failed to fetch resource file:', error);
          // Fall back to demo content if fetch fails
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchResourceFile();
  }, [resourceId, uploadedFile, fileURL]);

  const handleDocumentLoadSuccess = (numPages) => {
    if (typeof numPages === 'number' && Number.isFinite(numPages) && numPages > 0) {
      setTotalPages(numPages);
      setCurrentPage((prev) => (prev > numPages ? 1 : prev));
    }
  };

  const handleDocumentLoadError = (error) => {
    setViewerError(error?.message || 'Failed to load document');
  };

  const handleOcrStatusChange = (status, error = null) => {
    console.log('[StudyWorkspace] OCR status changed:', status, error);
    
    // You can store OCR status in state or context here if needed
    // For now, just logging for visibility
    if (status === 'completed') {
      console.log('[StudyWorkspace] Scanned PDF text extraction completed');
      // Optional: Trigger automatic transcription or AI analysis
    } else if (status === 'error') {
      console.error('[StudyWorkspace] OCR failed:', error);
    }
  };

  // Update context when page or resource changes
  useEffect(() => {
    if (finalResourceId && currentPage) {
      updateContext(currentPage);
    }
  }, [finalResourceId, currentPage]);

  const updateContext = async (pageNumber) => {
    // Debounce context updates
    if (contextUpdateTimer) {
      clearTimeout(contextUpdateTimer);
    }

    const timer = setTimeout(async () => {
      try {
        await contextAPI.updateContext(finalResourceId, {
          pageNumber,
          metadata: { fileName, fileType, zoom }
        });
      } catch (error) {
        console.error('Failed to update context:', error);
      }
    }, 1000);

    setContextUpdateTimer(timer);
  };

  // Debug logging
  useEffect(() => {
    console.log('StudyWorkspace state:', {
      uploadedFile: uploadedFile?.name,
      fileURL: fileURL ? 'exists' : 'null',
      fileName,
      fileType,
      isPDF,
      viewerError: viewerError ? 'error' : 'none',
      isLoading,
      currentPage,
      totalPages
    });
  }, [uploadedFile, fileURL, fileName, fileType, isPDF, viewerError, isLoading, currentPage, totalPages]);

  // Handle next page
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      updateContext(nextPage);
    }
  };

  // Handle previous page
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      updateContext(prevPage);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: chatInput
    };

    setMessages([...messages, userMessage]);
    const currentInput = chatInput;
    setChatInput('');

    try {
      // Send message to backend chat API
      const response = await chatAPI.sendMessage(currentInput);
      
      const aiResponse = {
        id: messages.length + 2,
        type: 'ai',
        content: response?.message || response?.content || 'I received your message!',
        source: response?.context?.resource_title || null,
        relatedMemories: response?.relatedMemories || []
      };

      setMessages([...messages, userMessage, aiResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse = {
        id: messages.length + 2,
        type: 'ai',
        content: 'Sorry, I\'m having trouble processing your request. Please try again.'
      };
      setMessages([...messages, userMessage, errorResponse]);
    }
  };

  const handleExplain = async () => {
    setShowAIPanel(true);
    setIsLoading(true);

    const loadingMessage = {
      id: messages.length + 1,
      type: 'ai',
      content: 'Generating explanation...'
    };
    setMessages([...messages, loadingMessage]);

    try {
      const response = await aiAPI.generateExplanation(sessionId, finalResourceId, currentPage);
      
      if (response?.success && response?.data) {
        const aiResponse = {
          id: messages.length + 2,
          type: 'ai',
          content: response.data.explanation || 'Explanation generated successfully.',
          source: `Page ${currentPage}`,
          relatedMemories: response.data.relatedConcepts || []
        };
        
        // Replace loading message with actual response
        setMessages(prev => [...prev.slice(0, -1), aiResponse]);
      } else {
        throw new Error('No explanation received');
      }
    } catch (error) {
      console.error('Explain error:', error);
      const errorResponse = {
        id: messages.length + 2,
        type: 'ai',
        content: `Sorry, I couldn't generate an explanation. Please try again. Error: ${error.message}`
      };
      setMessages(prev => [...prev.slice(0, -1), errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNotes = async () => {
    setIsLoading(true);

    try {
      // Determine scope based on whether text is selected
      const scope = window.getSelection().toString().trim().length > 0 ? 'selection' : 'page';

      // Call backend API to generate notes
      const response = await aiAPI.generateNotes(sessionId, finalResourceId, currentPage, scope);

      if (response?.success && response?.data) {
        const notesData = {
          id: response.data.notesId,
          title: `Notes - Page ${currentPage}`,
          content: response.data.notes || '',
          summary: response.data.summary || '',
          type: 'document',
          tags: response.data.keyTerms || [],
          date: new Date().toLocaleDateString(),
          pages: Math.ceil((response.data.notes?.length || 0) / 500),
          color: 'from-purple-500 to-violet-600',
          metadata: response.data.metadata || {}
        };

        // Navigate to Notes page to show the generated notes
        onNavigate('notes');

        // Show success message
        const successMessage = {
          id: messages.length + 1,
          type: 'ai',
          content: `✅ Notes generated successfully! ${notesData.content.length} words extracted.`,
          source: `Page ${currentPage}`
        };
        setShowAIPanel(true);
        setMessages([...messages, successMessage]);
      } else {
        throw new Error('No notes generated');
      }
    } catch (error) {
      console.error('Generate notes error:', error);
      const errorResponse = {
        id: messages.length + 1,
        type: 'ai',
        content: `Sorry, I couldn't generate notes. Please try again. Error: ${error.message}`
      };
      setShowAIPanel(true);
      setMessages([...messages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    setIsLoading(true);

    try {
      // Determine scope based on whether text is selected
      const scope = window.getSelection().toString().trim().length > 0 ? 'selection' : 'page';

      // Call backend API to generate flashcards
      const response = await aiAPI.generateFlashcards(sessionId, finalResourceId, currentPage, scope);

      if (response?.success && response?.data) {
        const flashcardCount = response.data.flashcards?.length || response.data.totalCards || 0;

        // Show success message
        const successMessage = {
          id: messages.length + 1,
          type: 'ai',
          content: `✅ Flashcards generated successfully! ${flashcardCount} cards created.`,
          source: `Page ${currentPage}`
        };
        setShowAIPanel(true);
        setMessages([...messages, successMessage]);

        // Navigate to Flashcards page to show the generated flashcards
        onNavigate('flashcards');
      } else {
        throw new Error('No flashcards generated');
      }
    } catch (error) {
      console.error('Generate flashcards error:', error);
      const errorResponse = {
        id: messages.length + 1,
        type: 'ai',
        content: `Sorry, I couldn't generate flashcards. Please try again. Error: ${error.message}`
      };
      setShowAIPanel(true);
      setMessages([...messages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDiagram = async (diagramType) => {
    setIsLoading(true);

    try {
      // Determine scope based on whether text is selected
      const scope = window.getSelection().toString().trim().length > 0 ? 'selection' : 'page';

      // Call backend API to generate diagram
      const response = await aiAPI.generateDiagram(sessionId, finalResourceId, currentPage, scope, diagramType);

      if (response?.success && response?.data) {
        // Store diagram data in sessionStorage for Diagrams component
        sessionStorage.setItem('generatedDiagram', JSON.stringify({
          diagram: response.data.diagram,
          diagramType: response.data.diagramType || diagramType
        }));

        // Show success message
        const successMessage = {
          id: messages.length + 1,
          type: 'ai',
          content: `✅ ${diagramType === 'mindmap' ? 'Mind Map' : 'Flowchart'} generated successfully!`,
          source: `Page ${currentPage}`
        };
        setShowAIPanel(true);
        setMessages([...messages, successMessage]);

        // Navigate to Diagrams page to show the generated diagram
        onNavigate('diagrams');
      } else {
        throw new Error('No diagram generated');
      }
    } catch (error) {
      console.error('Generate diagram error:', error);
      const errorResponse = {
        id: messages.length + 1,
        type: 'ai',
        content: `Sorry, I couldn't generate ${diagramType === 'mindmap' ? 'mind map' : 'flowchart'}. Please try again. Error: ${error.message}`
      };
      setShowAIPanel(true);
      setMessages([...messages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { icon: Lightbulb, label: 'Explain this', color: 'from-yellow-500 to-orange-500' },
    { icon: List, label: 'Summarize page', color: 'from-purple-500 to-violet-500' },
    { icon: FileText, label: 'Extract key points', color: 'from-blue-500 to-cyan-500' },
    { icon: GitBranch, label: 'Generate diagram', color: 'from-green-500 to-emerald-500' },
    { icon: CreditCard, label: 'Make flashcards', color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-violet-50'}`}>
      <Sidebar 
        currentPage="workspace" 
        onNavigate={onNavigate} 
        onLogout={onLogout} 
        darkMode={darkMode}
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Quick Actions Bar - Horizontal */}
        <div className={`px-4 md:px-6 py-3 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} flex-shrink-0`}>
          {/* Mobile Hamburger Menu */}
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className={`md:hidden p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-50'} rounded-xl transition-colors`}
            >
              <Menu className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
            </button>
            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} md:block hidden`}>Quick Actions</div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">{[
              { icon: Lightbulb, label: 'Explain', action: 'explain', description: 'Get explanation of content' },
              { icon: FileText, label: 'Generate Notes', action: 'notes', description: 'Create comprehensive notes' },
              { icon: Layers, label: 'Generate Mind Map', action: 'mindmap', description: 'Visualize concepts' },
              { icon: Brain, label: 'Create Flashcards', action: 'flashcards', description: 'Practice flashcards' },
              { icon: Pen, label: 'Annotate Document', action: 'annotate', description: 'Add notes & highlights' },
              { icon: MessageSquare, label: 'Ask AI Chatbot', action: 'chatbot', description: 'Clear doubts' }
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (item.action === 'explain') {
                    handleExplain();
                  } else if (item.action === 'notes') {
                    handleGenerateNotes();
                  } else if (item.action === 'mindmap') {
                    handleGenerateDiagram('mindmap');
                  } else if (item.action === 'flashcards') {
                    handleGenerateFlashcards();
                  } else {
                    alert(`${item.label} - ${item.description}`);
                  }
                }}
                disabled={isLoading && (item.action === 'explain' || item.action === 'notes' || item.action === 'mindmap' || item.action === 'flashcards')}
                className={`group flex items-center gap-3 px-4 py-2.5 border rounded-lg transition-all text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode 
                    ? 'bg-gray-750 border-gray-600 hover:border-purple-600 hover:bg-gray-700' 
                    : 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-md'
                }`}
              >
                {isLoading && (item.action === 'explain' || item.action === 'notes' || item.action === 'mindmap' || item.action === 'flashcards') ? (
                  <Loader className={`w-5 h-5 flex-shrink-0 animate-spin ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                ) : (
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600'}`} />
                )}
                <div className="text-left">
                  <div className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{item.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <main className="flex-1 flex overflow-hidden">
          {/* PDF Viewer - Center */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* PDF Content */}
            <div className={`flex-1 overflow-y-auto p-4 md:p-8 flex justify-center ${darkMode ? 'bg-gray-750' : 'bg-purple-50'}`}>
              {uploadedFile && fileURL ? (
                <div className="w-full max-w-4xl flex flex-col items-center gap-4">
                  {viewerError && (
                    <div className="w-full p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                      <p className="font-semibold">Error loading document:</p>
                      <p className="text-sm">{viewerError}</p>
                    </div>
                  )}
                  <div className={`w-full rounded-lg shadow-lg border ${darkMode ? 'border-gray-600 bg-gray-900' : 'border-gray-300 bg-white'}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '20px', overflow: 'auto', position: 'relative' }}>
                    <DocumentViewer
                      fileUrl={fileURL}
                      fileType={fileType}
                      resourceId={finalResourceId}
                      currentPage={currentPage}
                      zoom={zoom}
                      darkMode={darkMode}
                      onLoadSuccess={handleDocumentLoadSuccess}
                      onLoadError={handleDocumentLoadError}
                      onOcrStatusChange={handleOcrStatusChange}
                    />
                  </div>
                </div>
              ) : uploadedFile && !fileURL ? (
                // File is being processed
                <div className="flex items-center justify-center h-full">
                  <Loader className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : (
                // Default demo content or error state
                <div className={`max-w-3xl mx-auto shadow-lg rounded-lg p-12 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  {uploadedFile && !isPDF ? (
                    <div className="text-center">
                      <p className={`text-red-500 mb-4`}>Unsupported file type: {fileType}</p>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Please upload a PDF file.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h1 className={`text-3xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Chapter 5: Inheritance in OOP</h1>
                      
                      <h2 className={`text-2xl mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>5.1 Introduction</h2>
                      <p className={`mb-4 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Inheritance is a fundamental concept in object-oriented programming that allows a class to inherit properties 
                        and methods from another class. This mechanism promotes code reusability and establishes a hierarchical 
                        relationship between classes.
                      </p>

                      <h2 className={`text-2xl mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>5.2 Types of Inheritance</h2>
                      <ul className={`list-disc list-inside space-y-2 mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <li>Single Inheritance: A class inherits from one parent class</li>
                        <li>Multiple Inheritance: A class inherits from multiple parent classes</li>
                      <li>Multilevel Inheritance: A class inherits from a child class</li>
                      <li>Hierarchical Inheritance: Multiple classes inherit from one parent</li>
                    </ul>
                    <div className={`p-6 rounded-lg ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'} border`}>
                      <div className={`mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>Code Example:</div>
                      <pre className={`text-sm p-4 rounded overflow-x-auto ${darkMode ? 'text-purple-300 bg-gray-900' : 'text-purple-800 bg-white'}`}>
                        {`class Animal {\n  void eat() {\n    System.out.println("Eating...");\n  }\n}\n\nclass Dog extends Animal {\n  void bark() {\n    System.out.println("Barking...");\n  }\n}`}
                      </pre>
                    </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PDF Controls */}
            <div className={`flex items-center justify-center gap-4 px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-purple-100 bg-white'}`}>
              <button 
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
                className={`p-2 rounded-lg transition-colors ${currentPage <= 1 ? (darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed') : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-purple-50 text-gray-600')}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Page {currentPage} / {totalPages}</span>
              <button 
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className={`p-2 rounded-lg transition-colors ${currentPage >= totalPages ? (darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed') : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-purple-50 text-gray-600')}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* AI Assistant Panel - Mobile Only Overlay */}
          {showAIPanel && (
            <>
              <div 
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowAIPanel(false)}
              />
              
              <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-gray-800 border-l border-purple-100 dark:border-gray-700 flex flex-col overflow-hidden shadow-2xl">
                {/* Chat Header */}
                <div className={`px-4 md:px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-purple-100'} flex-shrink-0`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Assistant</div>
                        <div className={`text-xs ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Context-aware help</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowAIPanel(false)}
                      className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-50'} rounded-lg transition-colors`}
                    >
                      <X className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    </button>
                  </div>
                </div>

                {/* Chat Messages - Scrollable */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-750' : 'bg-purple-50'}`}>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-3 md:px-4 py-2 md:py-3 rounded-xl max-w-[85%] ${
                        msg.type === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white'
                          : darkMode ? 'bg-gray-800 border border-gray-700 text-gray-200' : 'bg-white border border-purple-200 text-gray-800'
                      }`}>
                        <p className="text-xs md:text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                        {msg.source && (
                          <p className={`text-xs mt-2 ${msg.type === 'user' ? 'text-purple-200' : darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            📄 {msg.source}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input - Fixed at bottom */}
                <div className={`flex-shrink-0 p-4 border-t ${darkMode ? 'border-gray-700' : 'border-purple-100'}`}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask about this page..."
                      className={`flex-1 px-3 md:px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm ${darkMode ? 'bg-gray-750 border-gray-600 text-white placeholder-gray-400' : 'border-purple-200'}`}
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="px-3 md:px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
