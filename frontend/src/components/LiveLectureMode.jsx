import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, FileText, Brain, Layers, MessageSquare, Download, Pause, Play } from 'lucide-react';

export default function LiveLectureMode({ onClose, darkMode = false }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const isPausedRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
    isPausedRef.current = isPaused;
  }, [isListening, isPaused]);

  // Setup recognition only when needed
  const setupRecognition = () => {
    if (recognitionRef.current) {
      return recognitionRef.current;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(prev => prev + finalTranscript);
      setError('');
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
        setPermissionGranted(false);
      } else if (event.error === 'no-speech') {
        // Don't show error for no speech - it's common during pauses
      } else if (event.error === 'network') {
        setError('Network error. Please check your internet connection.');
      } else if (event.error !== 'aborted') {
        // Don't show error for aborted - happens when stopping
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      // Use refs to get current values
      if (isListeningRef.current && !isPausedRef.current) {
        // Auto-restart if it was supposed to be listening
        try {
          recognition.start();
        } catch (e) {
          console.error('Error restarting recognition:', e);
        }
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  const toggleListening = async () => {
    const recognition = setupRecognition();
    if (!recognition) {
      return;
    }

    if (isListening) {
      // Stop listening
      try {
        recognition.stop();
        setIsListening(false);
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    } else {
      // Don't request permission manually - let SpeechRecognition handle it
      // The browser will prompt for permission when recognition.start() is called
      setError('');
      try {
        recognition.start();
        setIsListening(true);
        setIsPaused(false);
        setPermissionGranted(true); // Assume granted if start succeeds
      } catch (e) {
        console.error('Error starting recognition:', e);
        if (e.message && e.message.includes('not-allowed')) {
          setPermissionGranted(false);
          setError('Microphone access denied. Please allow microphone access in your browser settings to use live lecture listening.');
        } else {
          setError('Failed to start speech recognition. Please try again.');
        }
      }
    }
  };

  const togglePause = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isPaused) {
      try {
        recognition.start();
        setIsPaused(false);
        setError('');
      } catch (e) {
        console.error('Error resuming recognition:', e);
      }
    } else {
      try {
        recognition.stop();
        setIsPaused(true);
      } catch (e) {
        console.error('Error pausing recognition:', e);
      }
    }
  };

  const generateNotes = () => {
    alert('Generating notes from transcript...');
  };

  const generateMindmap = () => {
    alert('Generating mindmap from transcript...');
  };

  const generateFlashcards = () => {
    alert('Generating flashcards from transcript...');
  };

  const annotate = () => {
    alert('Opening annotation mode...');
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lecture-transcript.txt';
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-5xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-3xl shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`px-8 py-6 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50'} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>Live Lecture Mode</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {isListening ? (isPaused ? 'Paused' : 'Listening...') : 'Ready to start'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-purple-100 text-gray-600'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-8">
          {/* Transcript Area */}
          <div className={`flex-1 p-6 rounded-2xl border-2 mb-6 overflow-y-auto ${
            darkMode 
              ? 'bg-gray-750 border-gray-700' 
              : 'bg-purple-50 border-purple-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>Transcript</h3>
              {transcript && (
                <button 
                  onClick={downloadTranscript}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 text-purple-400 hover:bg-gray-600' 
                      : 'bg-white text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
            </div>
            <div className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {transcript || (
                <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                  Click "Start Listening" to begin transcribing the lecture...
                </span>
              )}
            </div>
          </div>

          {/* Info Message */}
          {!error && permissionGranted === null && !isListening && (
            <div className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 ${
              darkMode 
                ? 'bg-blue-900/20 border-blue-700' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <Mic className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div className={`text-sm leading-relaxed ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                <strong>Microphone access required:</strong> When you click "Start Listening", your browser will ask for microphone permission. Please allow access to use this feature.
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 ${
              darkMode 
                ? 'bg-red-900/20 border-red-700' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`text-sm leading-relaxed ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-3">
              <button
                onClick={toggleListening}
                className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
                  isListening 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg text-white'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </button>
              
              {isListening && (
                <button
                  onClick={togglePause}
                  className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 text-purple-400 hover:bg-gray-600' 
                      : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  }`}
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
              )}
            </div>

            {isListening && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Recording
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {transcript && (
            <div className="grid grid-cols-4 gap-4">
              <button
                onClick={generateNotes}
                className={`p-4 rounded-xl border-2 transition-all group ${
                  darkMode 
                    ? 'border-gray-700 hover:border-purple-600 bg-gray-750' 
                    : 'border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg'
                }`}
              >
                <FileText className={`w-6 h-6 mx-auto mb-2 ${darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600'}`} />
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Generate Notes</div>
              </button>

              <button
                onClick={generateMindmap}
                className={`p-4 rounded-xl border-2 transition-all group ${
                  darkMode 
                    ? 'border-gray-700 hover:border-purple-600 bg-gray-750' 
                    : 'border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg'
                }`}
              >
                <Layers className={`w-6 h-6 mx-auto mb-2 ${darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600'}`} />
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Mind Map</div>
              </button>

              <button
                onClick={generateFlashcards}
                className={`p-4 rounded-xl border-2 transition-all group ${
                  darkMode 
                    ? 'border-gray-700 hover:border-purple-600 bg-gray-750' 
                    : 'border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg'
                }`}
              >
                <Brain className={`w-6 h-6 mx-auto mb-2 ${darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600'}`} />
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Flashcards</div>
              </button>

              <button
                onClick={annotate}
                className={`p-4 rounded-xl border-2 transition-all group ${
                  darkMode 
                    ? 'border-gray-700 hover:border-purple-600 bg-gray-750' 
                    : 'border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg'
                }`}
              >
                <MessageSquare className={`w-6 h-6 mx-auto mb-2 ${darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600'}`} />
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Annotate</div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}