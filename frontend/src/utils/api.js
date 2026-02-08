const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("authToken");
const setToken = (token) => localStorage.setItem("authToken", token);
const clearToken = () => localStorage.removeItem("authToken");
const setAuthUser = (user) =>
  localStorage.setItem("authUser", JSON.stringify(user));
const clearAuthUser = () => localStorage.removeItem("authUser");

const buildUrl = (path, params) => {
  if (!params) return `${API_BASE}${path}`;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `${API_BASE}${path}?${query}` : `${API_BASE}${path}`;
};

const request = async (path, options = {}) => {
  const { params, ...fetchOptions } = options;
  const res = await fetch(buildUrl(path, params), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...fetchOptions,
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

const requestWithAuth = (path, options = {}) =>
  request(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${getToken()}`,
    },
  });

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

  me: async () => {
    const data = await request("/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    if (data?.data) {
      setAuthUser(data.data);
    }
    return data;
  },

  logout: () => {
    clearToken();
    clearAuthUser();
  },
};

const mockSuccess = (data = {}) => Promise.resolve({ status: "success", data });
const mockList = (key) => Promise.resolve({ [key]: [] });

export const contentAPI = {
  getUserResources: () => requestWithAuth("/resources", { method: "GET" }),
  addYouTubeContent: () =>
    mockSuccess({
      resourceId: `mock-${Date.now()}`,
      resourceType: "video",
      processingStatus: "queued",
      subjects: [],
      sections: [],
    }),
  getResourceFile: async (resourceUrl) => {
    if (!resourceUrl) return null;
    const res = await fetch(resourceUrl, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!res.ok) {
      const error = new Error("Failed to fetch resource file");
      error.code = res.status;
      throw error;
    }

    return res.blob();
  },
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

export const workspaceAPI = {
  getWorkspaces: (userId) =>
    requestWithAuth("/workspace/", {
      method: "GET",
      params: { user_id: userId },
    }),
  getWorkspaceResources: (workspaceId) =>
    requestWithAuth(`/resources/workspaces/${workspaceId}/resources`, {
      method: "GET",
    }),
};

export const resourceAPI = {
  getResource: (resourceId) =>
    requestWithAuth(`/resources/${resourceId}`, { method: "GET" }),
};

export const filesAPI = {
  getResourceFile: (resourceId) =>
    requestWithAuth(`/files/${resourceId}`, { method: "GET" }),
};
