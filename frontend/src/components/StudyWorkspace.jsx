import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
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
  Menu
} from 'lucide-react';

export default function StudyWorkspace({ onNavigate, onLogout, darkMode = false, uploadedFile = null }) {
  const [currentPage, setCurrentPage] = useState(5);
  const [zoom, setZoom] = useState(100);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m analyzing your document. Ask me anything about "Inheritance in OOP" or request summaries, explanations, or flashcards.',
      source: 'Page 5 - Inheritance in OOP'
    }
  ]);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [fileURL, setFileURL] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false); // For mobile AI panel toggle

  // Create object URL for uploaded file
  React.useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setFileURL(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [uploadedFile]);

  // Determine file name and type
  const fileName = uploadedFile?.name || 'Object-Oriented Programming.pdf';
  const fileType = uploadedFile?.type || 'application/pdf';
  const isPDF = fileType === 'application/pdf';
  const isPPT = fileType.includes('presentation') || fileType.includes('powerpoint');

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: chatInput
    };

    const aiResponse = {
      id: messages.length + 2,
      type: 'ai',
      content: `Great question! In object-oriented programming, inheritance allows a class (child/derived class) to inherit properties and methods from another class (parent/base class). This promotes code reusability and establishes a relationship between classes.

Key points:
• Enables code reuse and reduces redundancy
• Creates a hierarchical relationship between classes
• Supports polymorphism through method overriding
• Uses keywords like 'extends' (Java) or ':' (C++)`,
      source: 'Page 5, Section 2.3'
    };

    setMessages([...messages, userMessage, aiResponse]);
    setChatInput('');
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
              { icon: FileText, label: 'Generate Notes', action: 'notes', description: 'Create comprehensive notes' },
              { icon: Layers, label: 'Generate Mind Map', action: 'mindmap', description: 'Visualize concepts' },
              { icon: Brain, label: 'Create Flashcards', action: 'flashcards', description: 'Practice flashcards' },
              { icon: Pen, label: 'Annotate Document', action: 'annotate', description: 'Add notes & highlights' },
              { icon: MessageSquare, label: 'Ask AI Chatbot', action: 'chatbot', description: 'Clear doubts' }
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => alert(`${item.label} - ${item.description}`)}
                className={`group flex items-center gap-3 px-4 py-2.5 border rounded-lg transition-all text-sm whitespace-nowrap ${
                  darkMode 
                    ? 'bg-gray-750 border-gray-600 hover:border-purple-600 hover:bg-gray-700' 
                    : 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-md'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600'}`} />
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
            <div className={`flex-1 overflow-y-auto p-4 md:p-8 ${darkMode ? 'bg-gray-750' : 'bg-purple-50'}`}>
              {uploadedFile && fileURL && isPDF ? (
                // Display actual PDF using iframe
                <iframe
                  src={fileURL}
                  className="w-full h-full rounded-lg shadow-lg"
                  title={fileName}
                />
              ) : uploadedFile && fileURL && isPPT ? (
                // Display message for PPT files
                <div className={`max-w-3xl mx-auto shadow-lg rounded-lg p-12 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-10 h-10 text-white" />
                    </div>
                    <h2 className={`text-2xl mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{fileName}</h2>
                    <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      PowerPoint file uploaded successfully! Use the AI assistant to analyze and interact with your presentation.
                    </p>
                    <div className={`p-6 rounded-lg ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'} border`}>
                      <p className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                        💡 Tip: Use the Quick Actions above or the AI Assistant panel to ask questions about your presentation.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Default demo content
                <div className={`max-w-3xl mx-auto shadow-lg rounded-lg p-12 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
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
{`class Animal {
  void eat() {
    System.out.println("Eating...");
  }
}

class Dog extends Animal {
  void bark() {
    System.out.println("Barking...");
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PDF Controls */}
            <div className={`flex items-center justify-center gap-4 px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-purple-100 bg-white'}`}>
              <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-50'}`}>
                <ChevronLeft className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Page 5 / 24</span>
              <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-50'}`}>
                <ChevronRight className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
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