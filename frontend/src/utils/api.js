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
    try {
      return await apiRequest('/notes', {
        method: 'GET',
        headers: getHeaders(true),
      });
    } catch (error) {
      console.warn('Notes API not implemented yet, returning empty array');
      return { notes: [] };
    }
  },
};

export const flashcardsAPI = {
  // Get all flashcards
  getFlashcards: async () => {
    try {
      return await apiRequest('/flashcards', {
        method: 'GET',
        headers: getHeaders(true),
      });
    } catch (error) {
      console.warn('Flashcards API not implemented yet, returning empty array');
      return { flashcards: [], topics: [] };
    }
  },
};

export const quizzesAPI = {
  // Get all quizzes
  getQuizzes: async () => {
    try {
      return await apiRequest('/quizzes', {
        method: 'GET',
        headers: getHeaders(true),
      });
    } catch (error) {
      console.warn('Quizzes API not implemented yet, returning empty array');
      return { quizzes: [] };
    }
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
};
