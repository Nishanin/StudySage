import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

export default function FloatingChatbot({ darkMode = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your AI study assistant. How can I help you today?'
    }
  ]);

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
      content: 'I understand your question. As your AI study companion, I can help you with:\n\n• Explaining complex topics\n• Creating study materials\n• Answering questions\n• Generating flashcards\n• Summarizing content\n\nWhat would you like help with?'
    };

    setMessages([...messages, userMessage, aiResponse]);
    setChatInput('');
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
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-750' : 'bg-purple-50'}`}>
            {messages.map((msg) => (
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
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className={`flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm ${darkMode ? 'bg-gray-750 border-gray-600 text-white placeholder-gray-400' : 'border-purple-200'}`}
              />
              <button 
                onClick={handleSendMessage}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}