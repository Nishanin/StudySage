import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Brain, Clock, Award, ChevronRight, CheckCircle, XCircle, Play, ArrowRight } from 'lucide-react';

export default function Quizzes({ onNavigate, onLogout, darkMode = false }) {
  const [activeTab, setActiveTab] = useState('available');
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const quizzes = [
    {
      id: 1,
      title: 'OOP Fundamentals Quiz',
      topic: 'Object-Oriented Programming',
      questions: 10,
      duration: 15,
      difficulty: 'medium',
      color: 'from-purple-500 to-violet-500',
      icon: Brain,
      description: 'Test your understanding of basic OOP concepts'
    },
    {
      id: 2,
      title: 'Inheritance & Polymorphism',
      topic: 'OOP Advanced',
      questions: 8,
      duration: 12,
      difficulty: 'hard',
      color: 'from-violet-500 to-purple-500',
      icon: Brain,
      description: 'Advanced OOP concepts and relationships'
    },
    {
      id: 3,
      title: 'Data Structures Basics',
      topic: 'Data Structures',
      questions: 12,
      duration: 20,
      difficulty: 'easy',
      completed: true,
      score: 85,
      color: 'from-purple-600 to-violet-600',
      icon: Award,
      description: 'Fundamental data structures and usage'
    },
    {
      id: 4,
      title: 'Sorting Algorithms',
      topic: 'Algorithms',
      questions: 10,
      duration: 15,
      difficulty: 'medium',
      completed: true,
      score: 92,
      color: 'from-violet-600 to-purple-600',
      icon: Award,
      description: 'Common sorting algorithms and their complexity'
    }
  ];

  const sampleQuestions = [
    {
      question: 'What is the main purpose of inheritance in OOP?',
      options: [
        'To hide implementation details',
        'To reuse code and establish hierarchical relationships',
        'To allow multiple instances of a class',
        'To define interface contracts'
      ],
      correctAnswer: 1
    },
    {
      question: 'Which of the following is NOT a pillar of OOP?',
      options: [
        'Encapsulation',
        'Inheritance',
        'Compilation',
        'Polymorphism'
      ],
      correctAnswer: 2
    }
  ];

  const availableQuizzes = quizzes.filter(q => !q.completed);
  const completedQuizzes = quizzes.filter(q => q.completed);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (showQuiz) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <Sidebar currentPage="quizzes" onNavigate={onNavigate} onLogout={onLogout} darkMode={darkMode} />
        
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {!showResult ? (
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-3xl shadow-xl border p-8`}>
                  {/* Progress */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Question {currentQuestion + 1} of {sampleQuestions.length}</span>
                      <div className={`flex items-center gap-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">12:34</span>
                      </div>
                    </div>
                    <div className={`h-2 ${darkMode ? 'bg-gray-700' : 'bg-purple-100'} rounded-full overflow-hidden`}>
                      <div 
                        className="h-full bg-gradient-to-r from-purple-600 to-violet-600 rounded-full transition-all"
                        style={{ width: `${((currentQuestion + 1) / sampleQuestions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="mb-8">
                    <h3 className={`text-2xl mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {sampleQuestions[currentQuestion].question}
                    </h3>

                    <div className="space-y-3">
                      {sampleQuestions[currentQuestion].options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedAnswer(index)}
                          className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                            selectedAnswer === index
                              ? darkMode 
                                ? 'border-purple-600 bg-purple-900/30' 
                                : 'border-purple-600 bg-purple-50'
                              : darkMode
                                ? 'border-gray-600 hover:border-gray-500 bg-gray-750'
                                : 'border-purple-100 hover:border-purple-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedAnswer === index
                                ? 'border-purple-600 bg-purple-600'
                                : darkMode ? 'border-gray-500' : 'border-gray-300'
                            }`}>
                              {selectedAnswer === index && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                            <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between">
                    <button
                      onClick={() => setShowQuiz(false)}
                      className={`px-6 py-3 border rounded-xl transition-colors ${
                        darkMode 
                          ? 'border-gray-600 text-purple-400 hover:bg-gray-700' 
                          : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      Exit Quiz
                    </button>
                    <button
                      onClick={() => {
                        if (currentQuestion < sampleQuestions.length - 1) {
                          setCurrentQuestion(currentQuestion + 1);
                          setSelectedAnswer(null);
                        } else {
                          setShowResult(true);
                        }
                      }}
                      disabled={selectedAnswer === null}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {currentQuestion < sampleQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-3xl shadow-xl border p-12 text-center`}>
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <h2 className={`text-3xl mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quiz Completed!</h2>
                  <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your Score: <span className="text-purple-400">85%</span></p>

                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className={`p-6 rounded-xl ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                      <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                      <div className={`text-2xl mb-1 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>8</div>
                      <div className={`text-sm ${darkMode ? 'text-green-500' : 'text-green-600'}`}>Correct</div>
                    </div>
                    <div className={`p-6 rounded-xl ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                      <XCircle className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                      <div className={`text-2xl mb-1 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>2</div>
                      <div className={`text-sm ${darkMode ? 'text-red-500' : 'text-red-600'}`}>Incorrect</div>
                    </div>
                    <div className={`p-6 rounded-xl ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                      <Clock className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      <div className={`text-2xl mb-1 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>8:24</div>
                      <div className={`text-sm ${darkMode ? 'text-purple-500' : 'text-purple-600'}`}>Time Taken</div>
                    </div>
                  </div>

                  <div className={`mb-8 p-6 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-purple-900/40 to-violet-900/40' : 'bg-gradient-to-br from-purple-100 to-violet-100'}`}>
                    <h3 className={`mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Topics to Review</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Polymorphism', 'Method Overriding', 'Abstract Classes'].map((topic, idx) => (
                        <span key={idx} className={`px-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-700 text-purple-400' : 'bg-white text-purple-600'}`}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        setShowResult(false);
                        setCurrentQuestion(0);
                        setSelectedAnswer(null);
                        setShowQuiz(false);
                      }}
                      className={`px-6 py-3 border rounded-xl transition-colors ${
                        darkMode 
                          ? 'border-gray-600 text-purple-400 hover:bg-gray-700' 
                          : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      Back to Quizzes
                    </button>
                    <button
                      onClick={() => {
                        setShowResult(false);
                        setCurrentQuestion(0);
                        setSelectedAnswer(null);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      Retake Quiz
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-violet-50'}`}>
      <Sidebar 
        currentPage="quizzes" 
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
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className={`text-3xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quizzes</h2>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Test your knowledge with AI-generated quizzes</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setActiveTab('available')}
                className={`px-6 py-3 rounded-xl transition-all ${
                  activeTab === 'available'
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg'
                    : darkMode 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-white text-gray-600 hover:bg-purple-50'
                }`}
              >
                Available Quizzes
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-3 rounded-xl transition-all ${
                  activeTab === 'completed'
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg'
                    : darkMode 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                      : 'bg-white text-gray-600 hover:bg-purple-50'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Quiz Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeTab === 'available' ? availableQuizzes : completedQuizzes).map((quiz) => (
                <div key={quiz.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all group`}>
                  <div className={`h-2 bg-gradient-to-r ${quiz.color}`}></div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${quiz.color} rounded-xl flex items-center justify-center`}>
                        {quiz.icon ? <quiz.icon className="w-6 h-6 text-white" /> : <Brain className="w-6 h-6 text-white" />}
                      </div>
                      {quiz.difficulty && (
                        <span className={`px-3 py-1 rounded-lg text-xs ${
                          quiz.difficulty === 'easy' 
                            ? darkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'
                            : quiz.difficulty === 'medium' 
                            ? darkMode ? 'bg-yellow-900/40 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                            : darkMode ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700'
                        }`}>
                          {quiz.difficulty}
                        </span>
                      )}
                    </div>

                    <h3 className={`mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{quiz.title}</h3>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{quiz.description}</p>

                    <div className={`flex items-center justify-between mb-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        <span>{quiz.questions} Questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{quiz.duration}</span>
                      </div>
                    </div>

                    {quiz.score ? (
                      <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                        <div className={`flex items-center justify-between text-sm ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                          <span>Your Score:</span>
                          <span className="font-semibold">{quiz.score}</span>
                        </div>
                      </div>
                    ) : null}

                    <button
                      onClick={() => setShowQuiz(true)}
                      className={`w-full py-3 rounded-xl transition-all ${
                        quiz.score
                          ? darkMode 
                            ? 'bg-gray-700 text-purple-400 hover:bg-gray-600' 
                            : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                          : 'bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:shadow-lg'
                      }`}
                    >
                      {quiz.score ? 'Retake Quiz' : 'Start Quiz'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}