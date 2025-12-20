import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Search, Plus, FileText, Folder, Star, Clock, MoreVertical, Download, Share2, Trash2, Filter } from 'lucide-react';
import { notesAPI } from '../utils/api';

export default function Notes({ user, onNavigate, onLogout, darkMode = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setError(null);
      const data = await notesAPI.getNotes();
      setNotes(data.notes || []);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      setError(err.message || 'Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterBy === 'all' || note.type === filterBy;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-white to-violet-50'}`}>
      <Sidebar 
        currentPage="notes" 
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
            <div className="mb-6 md:mb-8">
              <h2 className={`text-2xl md:text-3xl mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notes & Summaries</h2>
              <p className={`text-sm md:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>AI-generated notes from your study sessions</p>
            </div>

            {/* Search & Filters */}
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border mb-4 md:mb-6`}>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center">
                <div className="flex-1 relative">
                  <Search className={`absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 rounded-lg md:rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-purple-50 border-purple-100'}`}
                  />
                </div>
                <select 
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className={`px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-purple-50 border-purple-200'}`}
                >
                  <option value="all">All Types</option>
                  <option value="lecture">Lectures</option>
                  <option value="document">Documents</option>
                </select>
                <button className={`px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl transition-colors ${darkMode ? 'bg-gray-700 text-purple-400 hover:bg-gray-600' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>
                  <Filter className="w-4 h-4 md:w-5 md:h-5 mx-auto" />
                </button>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className={`${darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} rounded-xl md:rounded-2xl p-4 md:p-6 border mb-4 md:mb-6`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm md:text-base font-medium ${darkMode ? 'text-red-400' : 'text-red-800'}`}>Failed to load notes</h3>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                    <button onClick={fetchNotes} className={`mt-3 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-700 hover:bg-red-100'}`}>
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredNotes.length === 0 && notes.length === 0 && !error ? (
              <div className="text-center py-12">
                <FileText className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-xl mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No notes available yet</h3>
                <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Start studying to generate AI notes from your materials</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <h3 className={`text-xl mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No notes found</h3>
                <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Try adjusting your search or filters</p>
              </div>
            ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredNotes.map((note) => (
                <div key={note.id} className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'} rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border hover:shadow-xl transition-all group`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${note.color} rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className={`px-2 md:px-3 py-1 rounded-lg text-xs ${darkMode ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                      {note.date}
                    </div>
                  </div>

                  <h3 className={`text-base md:text-lg mb-1 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{note.title}</h3>
                  <p className={`text-sm mb-3 md:mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{note.type}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {note.tags.map((tag, idx) => (
                      <span key={idx} className={`px-2 py-1 rounded-md text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-purple-50 text-purple-600'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className={`flex items-center justify-between text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{note.pages} pages</span>
                    </div>
                    <button className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-purple-400 hover:bg-gray-600' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>
                      View Notes
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
