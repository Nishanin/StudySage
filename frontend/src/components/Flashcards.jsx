import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { ChevronLeft, ChevronRight, RotateCw, Shuffle, Plus, Star, CheckCircle, Circle, Brain, BookOpen, Check, X } from 'lucide-react';
import { flashcardsAPI } from '../utils/api';

export default function Flashcards({ user, onNavigate, onLogout, darkMode = false }) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [topics, setTopics] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    setError(null);
    try {
      const data = await flashcardsAPI.getFlashcards();
      setFlashcards(data.flashcards || []);
      setTopics(data.topics || []);
      if (data.topics && data.topics.length > 0) {
        setSelectedTopic(data.topics[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch flashcards:', err);
      setError(err.message || 'Failed to load flashcards. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentCard = flashcards[currentIndex] || { question: '', answer: '', difficulty: 'medium' };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-violet-50'}`}>
      <Sidebar 
        currentPage="flashcards" 
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
              <h2 className={`text-2xl md:text-3xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Flashcards</h2>
              <p className={`text-sm md:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Practice with AI-generated flashcards</p>
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
                  onClick={fetchFlashcards}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${darkMode ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-100 text-red-700'}`}
                >
                  Try again
                </button>
              </div>
            )}

            {/* Topics */}
            {loading ? (
              <div className="flex items-center justify-center py-12 mb-8">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : topics.length === 0 && !error ? (
              <div className="text-center py-12 mb-8">
                <Brain className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-xl mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No flashcards available yet</h3>
                <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Create flashcards from your study materials to start learning</p>
              </div>
            ) : (            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {topics.map((topic) => (
                <button
                  key={topic.name}
                  onClick={() => setSelectedTopic(topic.name)}
                  className={`p-4 md:p-6 rounded-xl md:rounded-2xl transition-all text-left ${
                    selectedTopic === topic.name
                      ? `bg-gradient-to-br ${topic.color} text-white shadow-lg scale-105`
                      : darkMode ? 'bg-gray-800 border border-gray-700 hover:border-gray-600 hover:shadow-md' : 'bg-white border border-purple-100 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center mb-2 md:mb-3 ${
                    selectedTopic === topic.name ? 'bg-white/20' : darkMode ? 'bg-purple-900/40' : 'bg-purple-100'
                  }`}>
                    <Brain className={`w-4 h-4 md:w-5 md:h-5 ${
                      selectedTopic === topic.name ? 'text-white' : 'text-purple-600'
                    }`} />
                  </div>
                  <h3 className={`mb-1 ${
                    selectedTopic === topic.name ? 'text-white' : 'text-gray-900'
                  }`}>{topic.name}</h3>
                  <p className={`text-sm ${
                    selectedTopic === topic.name ? 'text-white/80' : 'text-gray-600'
                  }`}>{topic.count} cards</p>
                </button>
              ))}
            </div>
            )}

            {/* Flashcard Viewer */}
            {!loading && flashcards.length > 0 && (
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-3xl shadow-2xl border p-8`}>
              {/* Progress */}
              <div className="flex items-center justify-between mb-6">
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Card {currentIndex + 1} of {flashcards.length}
                </div>
                <div className="flex items-center gap-2">
                  {currentCard.marked && (
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'}`}>
                      <Star className={`w-4 h-4 ${darkMode ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-600 fill-yellow-600'}`} />
                      <span className={`text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>Marked</span>
                    </div>
                  )}
                  <div className={`px-3 py-1.5 rounded-full text-xs ${getDifficultyColor(currentCard.difficulty)}`}>
                    {currentCard.difficulty}
                  </div>
                </div>
              </div>

              {/* Card */}
              <div 
                className="relative h-96 mb-8 cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}>
                  {/* Front */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl p-12 flex flex-col items-center justify-center text-white backface-hidden ${
                    isFlipped ? 'invisible' : 'visible'
                  }`}>
                    <div className="text-sm mb-4 opacity-80">Question</div>
                    <h3 className="text-3xl text-center leading-relaxed">{currentCard.question}</h3>
                    <div className="absolute bottom-8 flex items-center gap-2 text-sm opacity-70">
                      <RotateCw className="w-4 h-4" />
                      <span>Click to reveal answer</span>
                    </div>
                  </div>

                  {/* Back */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-12 flex flex-col items-center justify-center text-white backface-hidden rotate-y-180 ${
                    isFlipped ? 'visible' : 'invisible'
                  }`}>
                    <div className="text-sm mb-4 opacity-80">Answer</div>
                    <p className="text-xl text-center leading-relaxed">{currentCard.answer}</p>
                    <div className="absolute bottom-8 flex items-center gap-2 text-sm opacity-70">
                      <RotateCw className="w-4 h-4" />
                      <span>Click to see question</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-colors ${darkMode ? 'bg-gray-700 text-purple-400 hover:bg-gray-600' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>

                <div className="flex gap-3">
                  <button className={`p-3 rounded-xl transition-colors ${darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title="Hard">
                    <X className="w-5 h-5" />
                  </button>
                  <button className={`p-3 rounded-xl transition-colors ${darkMode ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'}`} title="Mark">
                    <Star className="w-5 h-5" />
                  </button>
                  <button className={`p-3 rounded-xl transition-colors ${darkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-600 hover:bg-green-100'}`} title="Easy">
                    <Check className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Info */}
              <div className={`mt-6 p-4 rounded-xl border ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-100'}`}>
                <p className={`text-sm text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  💡 Mark difficult cards to practice them more often with spaced repetition
                </p>
              </div>
            </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}