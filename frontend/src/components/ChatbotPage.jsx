import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Send, Sparkles, FileText, Trash2, BookOpen, ExternalLink, Loader2 } from 'lucide-react';
import { chatAPI } from '../utils/api';

export default function ChatbotPage({ user, onNavigate, onLogout, darkMode = false }) {
  const [input, setInput] = useState('');
  const [viewMode, setViewMode] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(currentInput);
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: response?.message || response?.content || 'I received your message!',
        source: response?.source,
        keyPoints: response?.keyPoints,
        relatedMemories: Array.isArray(response?.relatedMemories) ? response.relatedMemories : [],
        persistedMemories: Array.isArray(response?.persistedMemories) ? response.persistedMemories : [],
        context: response?.context || null,
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I\'m not available right now. The chat service will be ready soon!'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
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
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className={`w-20 h-20 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`text-xl mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start a conversation!</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>I have access to all your study materials and can help you learn</p>
                </div>
              )}
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

                      {msg.type === 'ai' && msg?.relatedMemories && msg.relatedMemories.length > 0 && (
                        <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-purple-200'}`}>
                          <div className={`text-sm mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>Related memories</div>
                          <ul className="space-y-2">
                            {msg.relatedMemories.slice(0,3).map((mem, idx) => (
                              <li key={idx} className={`flex items-start gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <span className={darkMode ? 'text-purple-400' : 'text-purple-600'}>•</span>
                                <span>{mem?.summary || mem?.text || mem?.title || 'Referenced memory'}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {msg.type === 'ai' && msg?.persistedMemories && msg.persistedMemories.length > 0 && (
                        <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Saved {msg.persistedMemories.length} new memory item(s).
                        </div>
                      )}

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
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                  placeholder="Ask anything about your study materials..."
                  className={`flex-1 px-6 py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-purple-200'
                  }`}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-2xl hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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