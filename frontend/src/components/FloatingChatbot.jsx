import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { chatAPI } from '../utils/api';

export default function FloatingChatbot({ user, darkMode = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendMessage = async () => {
    if (!chatInput.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: chatInput
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setLoading(true);
    setError('');

    try {
      const response = await chatAPI.sendMessage(chatInput);
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.message || response.content || 'I received your message!'
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
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
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 group"
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white" />
        )}
        <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {isOpen ? 'Close Chat' : 'AI Assistant'}
        </span>
      </button>

      {/* Chatbot Popup */}
      {isOpen && (
        <div className={`fixed bottom-28 right-8 w-96 h-[600px] ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-purple-200'}`}>
          {/* Chat Header */}
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-purple-100 bg-white'} flex-shrink-0`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Study Assistant</div>
                  <div className={`text-xs ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Always here to help</div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-50'}`}
              >
                <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-750' : 'bg-purple-50'}`}>            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className={`w-16 h-16 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-lg mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start a conversation!</p>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Ask me anything about your studies</p>
              </div>
            )}            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-3 rounded-xl max-w-[85%] ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white'
                    : darkMode ? 'bg-gray-800 border border-gray-700 text-gray-200' : 'bg-white border border-purple-200 text-gray-800'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className={`flex-shrink-0 p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-purple-100 bg-white'}`}>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                placeholder="Ask me anything..."
                className={`flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm ${darkMode ? 'bg-gray-750 border-gray-600 text-white placeholder-gray-400' : 'border-purple-200'}`}
                disabled={loading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={loading || !chatInput.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}