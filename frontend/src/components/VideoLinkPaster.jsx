import React, { useState } from 'react';
import { Video, X, Link as LinkIcon, Upload, FileText, Brain, Layers, Sparkles, Pen, Play } from 'lucide-react';

export default function VideoLinkPaster({ onClose, darkMode = false }) {
  const [videoLink, setVideoLink] = useState('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState(null);

  const handleLoadVideo = () => {
    if (videoLink.trim()) {
      // Validate YouTube or other video URL
      if (videoLink.includes('youtube.com') || videoLink.includes('youtu.be') || videoLink.includes('vimeo.com')) {
        setVideoLoaded(true);
      } else {
        alert('Please enter a valid YouTube or Vimeo URL');
      }
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedVideo(file);
      setVideoLoaded(true);
    } else {
      alert('Please upload a valid video file');
    }
  };

  const generateNotes = () => {
    alert('Generating notes from video transcript...');
  };

  const generateMindmap = () => {
    alert('Generating mindmap from video content...');
  };

  const generateFlashcards = () => {
    alert('Generating flashcards from video...');
  };

  const annotate = () => {
    alert('Opening video annotation mode...');
  };

  const openChatbot = () => {
    alert('Opening chatbot to discuss video content...');
  };

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getEmbedUrl = (url) => {
    const videoId = extractVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-3xl shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`px-8 py-6 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50'} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>Paste Video Link</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Learn from YouTube lectures and video content
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
        <div className="flex-1 overflow-y-auto p-8">
          {!videoLoaded ? (
            <div className="space-y-6">
              {/* Paste Link Section */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-purple-50 border-purple-200'}`}>
                <h3 className={`mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Paste Video URL
                </h3>
                
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <LinkIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleLoadVideo()}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
                          : 'bg-white border-purple-200'
                      }`}
                    />
                  </div>
                  <button
                    onClick={handleLoadVideo}
                    disabled={!videoLink.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Load Video
                  </button>
                </div>

                <p className={`mt-3 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Supports YouTube, Vimeo, and other major platforms
                </p>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className={`absolute inset-0 flex items-center`}>
                  <div className={`w-full border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-4 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>
                    OR
                  </span>
                </div>
              </div>

              {/* Upload Video Section */}
              <div className={`p-6 rounded-2xl border text-center ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-purple-50 border-purple-200'}`}>
                <Upload className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h3 className={`mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Upload Local Video
                </h3>
                <p className={`mb-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Upload a video file from your device
                </p>
                
                <input 
                  type="file" 
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label 
                  htmlFor="video-upload"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg transition-all cursor-pointer"
                >
                  Choose Video File
                </label>
              </div>
            </div>
          ) : (
            // Video Loaded - Show Preview and Actions
            <div>
              {/* Video Preview */}
              <div className={`mb-8 rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-750' : 'bg-gray-100'}`}>
                {uploadedVideo ? (
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <Play className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{uploadedVideo.name}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {(uploadedVideo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <iframe
                    className="w-full aspect-video"
                    src={getEmbedUrl(videoLink)}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                )}
              </div>

              {/* Change Video Button */}
              <div className="mb-6 text-center">
                <button
                  onClick={() => {
                    setVideoLoaded(false);
                    setVideoLink('');
                    setUploadedVideo(null);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Change Video
                </button>
              </div>

              {/* Action Buttons */}
              <div>
                <h3 className={`mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  What would you like to do?
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={generateNotes}
                    className={`p-6 rounded-xl border-2 transition-all text-left group ${
                      darkMode 
                        ? 'border-gray-700 hover:border-purple-600 bg-gray-750' 
                        : 'border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg'
                    }`}
                  >
                    <FileText className={`w-8 h-8 mb-3 ${darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600'}`} />
                    <h4 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Generate Notes</h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Create notes from video transcript
                    </p>
                  </button>

                  <button
                    onClick={generateMindmap}
                    className={`p-6 rounded-xl border-2 transition-all text-left group ${
                      darkMode 
                        ? 'border-gray-700 hover:border-purple-600 bg-gray-750' 
                        : 'border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg'
                    }`}
                  >
                    <Layers className={`w-8 h-8 mb-3 ${darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600'}`} />
                    <h4 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Generate Mind Map</h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Visualize video concepts
                    </p>
                  </button>

                  <button
                    onClick={generateFlashcards}
                    className={`p-6 rounded-xl border-2 transition-all text-left group ${
                      darkMode 
                        ? 'border-gray-700 hover:border-purple-600 bg-gray-750' 
                        : 'border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg'
                    }`}
                  >
                    <Brain className={`w-8 h-8 mb-3 ${darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600'}`} />
                    <h4 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create Flashcards</h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Generate study flashcards
                    </p>
                  </button>

                  <button
                    onClick={annotate}
                    className={`p-6 rounded-xl border-2 transition-all text-left group ${
                      darkMode 
                        ? 'border-gray-700 hover:border-purple-600 bg-gray-750' 
                        : 'border-purple-200 hover:border-purple-400 bg-white hover:shadow-lg'
                    }`}
                  >
                    <Pen className={`w-8 h-8 mb-3 ${darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600'}`} />
                    <h4 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Annotate Video</h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Add timestamped notes
                    </p>
                  </button>

                  <button
                    onClick={openChatbot}
                    className={`md:col-span-2 p-6 rounded-xl border-2 transition-all text-left group ${
                      darkMode 
                        ? 'border-gray-700 hover:border-purple-600 bg-gradient-to-r from-purple-900/30 to-violet-900/30' 
                        : 'border-purple-200 hover:border-purple-400 bg-gradient-to-r from-purple-50 to-violet-50 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Sparkles className={`w-8 h-8 ${darkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600'}`} />
                      <div>
                        <h4 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ask AI Chatbot</h4>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Clear doubts and get explanations about the video content
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}