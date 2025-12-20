// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token in localStorage
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

// Helper function to get headers with auth token
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic API request handler
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// ==================== AUTH APIs ====================

export const authAPI = {
  // Register a new user
  register: async (name, email, password) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ name, email, password }),
    });
    
    // Store token if registration successful (token is in data.data.token due to API response format)
    if (data?.data?.token) {
      setAuthToken(data.data.token);
    }
    
    return data;
  },

  // Login user
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    
    // Store token if login successful (token is in data.data.token due to API response format)
    if (data?.data?.token) {
      setAuthToken(data.data.token);
    }
    
    return data;
  },

  // Get current user profile
  me: async () => {
    return apiRequest('/auth/me', {
      method: 'GET',
      headers: getHeaders(true),
    });
  },

  // Logout (client-side)
  logout: () => {
    setAuthToken(null);
  },
};

// ==================== UPLOAD APIs ====================

export const uploadAPI = {
  // Upload a single file
  uploadFile: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error?.message || 'Upload failed'));
          } catch (e) {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${API_BASE_URL}/content/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  },

  // Upload multiple files
  uploadMultiple: async (files, onProgress) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const token = getAuthToken();
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error?.message || 'Upload failed'));
          } catch (e) {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${API_BASE_URL}/upload/multiple`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  },

  // Delete a file
  deleteFile: async (filename) => {
    return apiRequest(`/upload/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
  },
};

// ==================== PLACEHOLDER APIs ====================
// These endpoints don't exist yet in the backend but are prepared for future implementation

export const studyAPI = {
  // Get all study resources for the current user
  getResources: async () => {
    try {
      return await apiRequest('/study/resources', {
        method: 'GET',
        headers: getHeaders(true),
      });
    } catch (error) {
      console.warn('Study resources API not implemented yet, returning empty array');
      return { resources: [] };
    }
  },

  // Get study analytics/progress
  getAnalytics: async () => {
    try {
      return await apiRequest('/study/analytics', {
        method: 'GET',
        headers: getHeaders(true),
      });
    } catch (error) {
      console.warn('Analytics API not implemented yet, returning defaults');
      return {
        totalStudyTime: 0,
        topicsStudied: 0,
        averageScore: 0,
        flashcardsMastered: 0,
        studyTimeData: [],
        topicsProgressData: [],
        weakAreas: [],
      };
    }
  },
};

export const notesAPI = {
  // Get all notes
  getNotes: async () => {
    const res = await apiRequest('/notes', {
      method: 'GET',
      headers: getHeaders(true),
    });
    // Backend responds with { success, data: { notes: [] } }
    return res?.data ?? res;
  },

  // Create notes generation request
  createNotes: async (resourceId, sectionId, contextText, noteStyle = 'summary') => {
    return await apiRequest('/learning/notes', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        resource_id: resourceId,
        section_id: sectionId,
        context_text: contextText,
        note_style: noteStyle,
      }),
    });
  },
};

export const flashcardsAPI = {
  // Get all flashcards
  getFlashcards: async () => {
    const res = await apiRequest('/flashcards', {
      method: 'GET',
      headers: getHeaders(true),
    });
    // Backend responds with { success, data: { flashcards: [], topics: [] } }
    return res?.data ?? res;
  },

  // Create flashcard generation request
  createFlashcards: async (resourceId, sectionId, contextText, difficulty = 'medium') => {
    return await apiRequest('/learning/flashcards', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        resource_id: resourceId,
        section_id: sectionId,
        context_text: contextText,
        difficulty: difficulty,
      }),
    });
  },
};

export const quizzesAPI = {
  // Get all quizzes
  getQuizzes: async () => {
    const res = await apiRequest('/quizzes', {
      method: 'GET',
      headers: getHeaders(true),
    });
    // Backend responds with { success, data: { quizzes: [] } }
    return res?.data ?? res;
  },

  // Create quiz generation request
  createQuiz: async (resourceId, sectionId, contextText, quizType = 'mcq', numberOfQuestions = 5) => {
    return await apiRequest('/learning/quizzes', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        resource_id: resourceId,
        section_id: sectionId,
        context_text: contextText,
        quiz_type: quizType,
        number_of_questions: numberOfQuestions,
      }),
    });
  },
};

// Learning API for tracking requests
export const learningAPI = {
  // Get learning request status
  getRequestStatus: async (requestId) => {
    return await apiRequest(`/learning/requests/${requestId}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
  },

  // Get all user learning requests
  getUserRequests: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const queryString = params.toString();
    const url = queryString ? `/learning/requests?${queryString}` : '/learning/requests';

    return await apiRequest(url, {
      method: 'GET',
      headers: getHeaders(true),
    });
  },
};

export const chatAPI = {
  // Send a chat message
  sendMessage: async (message, context = {}) => {
    try {
      return await apiRequest('/chat', {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ message, context }),
      });
    } catch (error) {
      console.warn('Chat API not implemented yet');
      throw new Error('Chat service is not available yet. Please try again later.');
    }
  },
};

export const contentAPI = {
  // Upload educational content (PDF, PPT, Audio)
  uploadFile: async (file, title = '') => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) {
      formData.append('title', title);
    }

    const token = getAuthToken();
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error?.message || 'Upload failed'));
          } catch (e) {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${API_BASE_URL}/content/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  },

  // Add YouTube video content
  addYouTubeContent: async (videoId, title = '') => {
    return apiRequest('/content/youtube', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ videoId, title }),
    });
  },

  // Get all study sections for current user
  getSections: async () => {
    return apiRequest('/content/sections', {
      method: 'GET',
      headers: getHeaders(true),
    });
  },

  // Get resources in a specific section
  getSectionResources: async (sectionId) => {
    return apiRequest(`/content/sections/${sectionId}/resources`, {
      method: 'GET',
      headers: getHeaders(true),
    });
  },

  // Get all resources for current user (with section associations)
  getUserResources: async () => {
    return apiRequest('/content/resources', {
      method: 'GET',
      headers: getHeaders(true),
    });
  },

  // Download/stream a resource file by ID
  // Returns a Blob that can be converted to Object URL
  getResourceFile: async (resourceId) => {
    const token = getAuthToken();
    
    try {
      const response = await fetch(`${API_BASE_URL}/content/download/${resourceId}`, {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to download file: ${response.status}`);
      }

      // Return the blob so frontend can create object URL
      return await response.blob();
    } catch (error) {
      console.error('Get resource file error:', error);
      throw error;
    }
  },

  // Convert PowerPoint to PDF
  convertToPdf: async (resourceId) => {
    return apiRequest(`/content/convert-to-pdf/${resourceId}`, {
      method: 'POST',
      headers: getHeaders(true),
    });
  },
};

// ==================== CONTEXT APIs ====================

export const contextAPI = {
  // Update current study context
  updateContext: async (resourceId, position = {}) => {
    return apiRequest('/context/update', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        resourceId,
        pageNumber: position.pageNumber,
        timestampSeconds: position.timestampSeconds,
        metadata: position.metadata || {}
      }),
    });
  },

  // Get current live context
  getCurrentContext: async () => {
    return apiRequest('/context/current', {
      method: 'GET',
      headers: getHeaders(true),
    });
  },

  // Clear context (end study session)
  clearContext: async () => {
    return apiRequest('/context/clear', {
      method: 'POST',
      headers: getHeaders(true),
    });
  },

  // Get context age in milliseconds
  getContextAge: async () => {
    return apiRequest('/context/age', {
      method: 'GET',
      headers: getHeaders(true),
    });
  },
};

// ==================== SESSION APIs ====================

export const sessionAPI = {
  // End current study session
  endSession: async () => {
    return apiRequest('/session/end', {
      method: 'POST',
      headers: getHeaders(true),
    });
  },

  // Get current active session
  getActiveSession: async () => {
    return apiRequest('/session/active', {
      method: 'GET',
      headers: getHeaders(true),
    });
  },

  // Get duration estimate of current session
  getDurationEstimate: async () => {
    return apiRequest('/session/duration-estimate', {
      method: 'GET',
      headers: getHeaders(true),
    });
  },

  // Get session history
  getSessionHistory: async (daysBack = 7, limit = 50) => {
    return apiRequest(`/session/history?daysBack=${daysBack}&limit=${limit}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
  },

  // Get session configuration
  getSessionConfig: async () => {
    return apiRequest('/session/config', {
      method: 'GET',
      headers: getHeaders(true),
    });
  },
};

// ==================== LIVE LECTURE APIs ====================

export const liveLectureAPI = {
  // Start a new live lecture session
  startSession: async (title = null) => {
    return apiRequest('/live-lecture/start', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ title }),
    });
  },

  // Append transcript chunk to session
  appendTranscript: async (sessionId, transcriptText, timestampOffsetMs, isFinal = true) => {
    return apiRequest('/live-lecture/transcript', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        sessionId,
        transcriptText,
        timestampOffsetMs,
        isFinal
      }),
    });
  },

  // Get active live lecture session
  getActiveSession: async () => {
    try {
      return await apiRequest('/live-lecture/active', {
        method: 'GET',
        headers: getHeaders(true),
      });
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('No active session')) {
        return null;
      }
      throw error;
    }
  },

  // End live lecture session
  endSession: async (sessionId) => {
    return apiRequest(`/live-lecture/${sessionId}/end`, {
      method: 'POST',
      headers: getHeaders(true),
    });
  },

  // Get full transcript for a session
  getFullTranscript: async (sessionId) => {
    return apiRequest(`/live-lecture/${sessionId}/transcript`, {
      method: 'GET',
      headers: getHeaders(true),
    });
  },

  // Get session history
  getSessions: async (limit = 20) => {
    return apiRequest(`/live-lecture/sessions?limit=${limit}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
  },

  // Get rolling buffer for session
  getRollingBuffer: async (sessionId) => {
    return apiRequest(`/live-lecture/buffer/${sessionId}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
  },
};

// ==================== AI APIs ====================

export const aiAPI = {
  // Generate explanation for selected text or page content
  generateExplanation: async (sessionId, resourceId, pageNumber = null, selectedText = null) => {
    return apiRequest('/ai/explain', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        sessionId,
        resourceId,
        pageNumber,
        selectedText,
        task: 'explain'
      }),
    });
  },

  // Generate notes from page or selection
  generateNotes: async (sessionId, resourceId, pageNumber = null, scope = 'page') => {
    return apiRequest('/ai/notes', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        sessionId,
        resourceId,
        pageNumber,
        scope
      }),
    });
  },

  // Generate flashcards from page or selection
  generateFlashcards: async (sessionId, resourceId, pageNumber = null, scope = 'page') => {
    return apiRequest('/ai/flashcards', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        sessionId,
        resourceId,
        pageNumber,
        scope
      }),
    });
  },

  // Generate diagrams (mindmap or flowchart)
  generateDiagram: async (sessionId, resourceId, pageNumber = null, scope = 'page', diagramType = 'mindmap') => {
    return apiRequest('/ai/diagram', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        sessionId,
        resourceId,
        pageNumber,
        scope,
        diagramType
      }),
    });
  },
};

export default {
  authAPI,
  uploadAPI,
  studyAPI,
  notesAPI,
  flashcardsAPI,
  quizzesAPI,
  chatAPI,
  contentAPI,
  contextAPI,
  sessionAPI,
  liveLectureAPI,
  learningAPI,
  aiAPI,
};
