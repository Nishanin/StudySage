const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("authToken");
const setToken = (token) => localStorage.setItem("authToken", token);
const clearToken = () => localStorage.removeItem("authToken");

const request = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.message || data?.error?.message || "Request failed";
    const error = new Error(message);
    error.code = data?.code || data?.error?.code;
    throw error;
  }
  return data;
};

export const authAPI = {
  register: async (name, email, password) => {
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    if (data?.token) setToken(data.token);
    return data;
  },

  login: async (email, password) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data?.token) setToken(data.token);
    return data;
  },

  me: () =>
    request("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }),

  logout: () => clearToken(),
};

const mockSuccess = (data = {}) => Promise.resolve({ status: "success", data });
const mockList = (key) => Promise.resolve({ [key]: [] });

export const contentAPI = {
  getUserResources: () => mockSuccess({ resources: [] }),
  addYouTubeContent: () =>
    mockSuccess({
      resourceId: `mock-${Date.now()}`,
      resourceType: "video",
      processingStatus: "queued",
      subjects: [],
      sections: [],
    }),
  getResourceFile: () =>
    Promise.resolve(new Blob([], { type: "application/pdf" })),
};

export const sessionAPI = {
  getActiveSession: () => mockSuccess({ session: null }),
  getSessionHistory: () => mockSuccess({ sessions: [] }),
};

export const contextAPI = {
  updateContext: () => mockSuccess(),
};

export const chatAPI = {
  sendMessage: (message) =>
    Promise.resolve({
      message: message ? `Mock reply: ${message}` : "Mock reply",
      relatedMemories: [],
      persistedMemories: [],
      context: null,
    }),
};

export const aiAPI = {
  generateExplanation: () =>
    Promise.resolve({
      success: true,
      data: { explanation: "Mock explanation.", relatedConcepts: [] },
    }),
  generateNotes: () =>
    Promise.resolve({
      success: true,
      data: {
        notesId: `mock-${Date.now()}`,
        notes: "",
        summary: "",
        keyTerms: [],
        metadata: {},
      },
    }),
  generateFlashcards: () =>
    Promise.resolve({
      success: true,
      data: { flashcards: [], totalCards: 0 },
    }),
  generateDiagram: (sessionId, resourceId, page, scope, diagramType) =>
    Promise.resolve({
      success: true,
      data: { diagram: "", diagramType: diagramType || "mindmap" },
    }),
};

export const uploadAPI = {
  uploadFile: async (file, onProgress) => {
    if (typeof onProgress === "function") onProgress(100);
    return mockSuccess({
      resourceId: `mock-${Date.now()}`,
      resourceType: "pdf",
      processingStatus: "uploaded",
      subjects: [],
      sections: [],
    });
  },
};

export const notesAPI = {
  getNotes: () => mockList("notes"),
};

export const flashcardsAPI = {
  getFlashcards: () =>
    mockList("flashcards").then((res) => ({
      ...res,
      topics: [],
    })),
};

export const quizzesAPI = {
  getQuizzes: () => mockList("quizzes"),
};

export const studyAPI = {
  getAnalytics: () =>
    Promise.resolve({
      totalStudyTime: 0,
      topicsStudied: 0,
      averageScore: 0,
      flashcardsMastered: 0,
      studyTimeData: [],
      topicsProgressData: [],
      weakAreas: [],
    }),
};

export const liveLectureAPI = {
  startSession: () => mockSuccess({ session: { id: `mock-${Date.now()}` } }),
  appendTranscript: () => mockSuccess(),
  endSession: () => mockSuccess(),
};
