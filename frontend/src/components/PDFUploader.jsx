import React, { useState, useRef } from 'react';
import { FileText, X, Upload, File, Brain, Layers, MessageSquare, Sparkles, Pen } from 'lucide-react';

export default function PDFUploader({ onClose, onUploadComplete, darkMode = false }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    const validTypes = [
      'application/pdf', 
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (validTypes.includes(file.type)) {
      // Directly call onUploadComplete with the file
      onUploadComplete(file);
    } else {
      alert('Please upload a PDF or PPT file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const generateNotes = () => {
    alert(`Generating notes from ${uploadedFile?.name}...`);
  };

  const generateMindmap = () => {
    alert(`Generating mindmap from ${uploadedFile?.name}...`);
  };

  const generateFlashcards = () => {
    alert(`Generating flashcards from ${uploadedFile?.name}...`);
  };

  const annotate = () => {
    alert(`Opening ${uploadedFile?.name} in annotation mode...`);
  };

  const openChatbot = () => {
    alert(`Opening chatbot to discuss ${uploadedFile?.name}...`);
  };

  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.pdf')) return '📄';
    if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return '📊';
    return '📁';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-3xl shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`px-8 py-6 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50'} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>Upload PDF / PPT</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Analyze and interact with your study materials
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
          {!uploadedFile ? (
            // Upload Area
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                isDragging 
                  ? darkMode 
                    ? 'border-purple-500 bg-purple-900/20' 
                    : 'border-purple-500 bg-purple-50'
                  : darkMode 
                    ? 'border-gray-600 bg-gray-750' 
                    : 'border-purple-200 bg-purple-50/50'
              }`}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-white" />
              </div>
              
              <h3 className={`text-xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Upload your study documents
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Drag and drop or click to browse
              </p>

              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf,.ppt,.pptx"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                Browse Files
              </button>

              <p className={`mt-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Supported formats: PDF, PPT, PPTX
              </p>
            </div>
          ) : (
            // File Uploaded - Show Actions
            <div>
              {/* File Info */}
              <div className={`p-6 rounded-2xl border mb-8 ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-purple-50 border-purple-200'}`}>
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{getFileIcon(uploadedFile.name)}</div>
                  <div className="flex-1">
                    <h3 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {uploadedFile.name}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Remove
                  </button>
                </div>
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
                      Create comprehensive study notes
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
                      Visualize concepts and relationships
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
                      Generate practice flashcards
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
                    <h4 className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Annotate Document</h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Add notes and highlights
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
                          Clear doubts and get explanations from the document
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