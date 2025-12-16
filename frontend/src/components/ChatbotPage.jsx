import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Send, Sparkles, FileText, Trash2, BookOpen, ExternalLink } from 'lucide-react';

export default function ChatbotPage({ onNavigate, onLogout, darkMode = false }) {
  const [input, setInput] = useState('');
  const [viewMode, setViewMode] = useState('chat');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I have access to all your study materials. Ask me anything about your lectures, PDFs, or notes. I can explain concepts, create summaries, or generate flashcards.',
    },
    {
      id: 2,
      type: 'user',
      content: 'Explain polymorphism in object-oriented programming',
    },
    {
      id: 3,
      type: 'ai',
      content: `Polymorphism is a core concept in OOP that allows objects of different classes to be treated as objects of a common parent class. It means "many forms" and enables you to write flexible, reusable code.

There are two main types:

1. Compile-time Polymorphism (Method Overloading)
   - Same method name, different parameters
   - Decided at compile time

2. Runtime Polymorphism (Method Overriding)
   - Child class provides specific implementation of parent method
   - Decided at runtime through dynamic binding

This allows you to write code that works with parent class references but executes child class methods, making your code more extensible and maintainable.`,
      source: 'OOP Lecture Notes - Page 12, Section 3.4',
      keyPoints: [
        'Polymorphism means "many forms"',
        'Allows objects to be treated as instances of their parent class',
        'Two types: Compile-time (overloading) and Runtime (overriding)',
        'Enables flexible and reusable code',
        'Uses dynamic binding for method execution'
      ]
    }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = {
      id: messages.length + 1,
      type: 'user',
      content: input
    };

    const aiMsg = {
      id: messages.length + 2,
      type: 'ai',
      content: 'I can help you with that! Based on your study materials, here\'s a detailed explanation...',
      source: 'Multiple sources referenced'
    };

    setMessages([...messages, userMsg, aiMsg]);
    setInput('');
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-violet-50'}`}>
      <Sidebar currentPage="chatbot" onNavigate={onNavigate} onLogout={onLogout} darkMode={darkMode} />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 flex overflow-hidden p-8">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-3xl shadow-xl border flex flex-col h-full overflow-hidden`}>
            {/* Header */}
            <div className={`px-8 py-6 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Study Assistant</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Context-aware chatbot with access to all your materials</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('chat')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'chat' 
                        ? darkMode 
                          ? 'bg-purple-900/40 text-purple-400' 
                          : 'bg-purple-100 text-purple-600' 
                        : darkMode 
                          ? 'text-gray-400 hover:bg-gray-700' 
                          : 'text-gray-600 hover:bg-purple-50'
                    }`}
                    title="Chat view"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('diagram')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'diagram' 
                        ? darkMode 
                          ? 'bg-purple-900/40 text-purple-400' 
                          : 'bg-purple-100 text-purple-600' 
                        : darkMode 
                          ? 'text-gray-400 hover:bg-gray-700' 
                          : 'text-gray-600 hover:bg-purple-50'
                    }`}
                    title="Diagram view"
                  >
                    <BookOpen className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('bullets')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'bullets' 
                        ? darkMode 
                          ? 'bg-purple-900/40 text-purple-400' 
                          : 'bg-purple-100 text-purple-600' 
                        : darkMode 
                          ? 'text-gray-400 hover:bg-gray-700' 
                          : 'text-gray-600 hover:bg-purple-50'
                    }`}
                    title="Key points view"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${msg.type === 'user' ? '' : 'w-full'}`}>
                    <div
                      className={`rounded-2xl px-6 py-4 ${
                        msg.type === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white'
                          : darkMode 
                            ? 'bg-gray-750 border border-gray-700 text-gray-200' 
                            : 'bg-purple-50 border border-purple-200 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                      {msg.type === 'ai' && viewMode === 'bullets' && msg.keyPoints && (
                        <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-purple-200'}`}>
                          <div className={`text-sm mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>Key Points:</div>
                          <ul className="space-y-2">
                            {msg.keyPoints.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>•</span>
                                <span className={`text-sm ${darkMode ? 'text-gray-300' : ''}`}>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {msg.source && (
                        <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-purple-200'} flex items-center justify-between`}>
                          <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                            <ExternalLink className="w-4 h-4" />
                            <span>{msg.source}</span>
                          </div>
                          <button className={`text-sm hover:underline ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}>
                            Highlight source
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className={`px-8 py-6 border-t ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50'}`}>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything about your study materials..."
                  className={`flex-1 px-6 py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-purple-200'
                  }`}
                />
                <button
                  onClick={handleSend}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </div>
              <div className={`mt-3 text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                AI has access to all your notes, PDFs, and lecture materials
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}