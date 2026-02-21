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
  const { params, headers = {}, ...fetchOptions } = options;

  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  // Debug logging
  console.log("Making request to:", buildUrl(path, params));
  console.log("Request options:", {
    ...fetchOptions,
    headers: finalHeaders,
    body: fetchOptions.body ? JSON.parse(fetchOptions.body) : undefined,
  });

  const res = await fetch(buildUrl(path, params), {
    headers: finalHeaders,
    ...fetchOptions,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.error?.message ||
      data?.error ||
      data?.message ||
      (typeof data === "string" ? data : null) ||
      `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.code = data?.code || data?.error?.code || res.status;
    error.data = data;
    console.error("API Error:", { path, status: res.status, data });
    throw error;
  }
  return data;
};

const requestWithAuth = (path, options = {}) => {
  const { headers = {}, ...restOptions } = options;
  return request(path, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      Authorization: `Bearer ${getToken()}`,
    },
  });
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
  addYouTubeContent: async (videoUrl, workspaceId) => {
    if (!workspaceId) {
      throw new Error("Workspace is required to add YouTube content");
    }
    if (!videoUrl) {
      throw new Error("videoUrl is required to add YouTube content");
    }
    const response = await requestWithAuth("/youtube/process", {
      method: "POST",
      body: JSON.stringify({
        videoUrl,
        workspaceId,
      }),
    });
    return response;
  },
  getYouTubeTranscript: async (videoId) => {
    const response = await requestWithAuth("/youtube/transcript", {
      method: "POST",
      body: JSON.stringify({ videoId }),
    });
    return response;
  },
  getYouTubeMetadata: async (videoId) => {
    const response = await requestWithAuth(`/youtube/metadata/${videoId}`, {
      method: "GET",
    });
    return response;
  },
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
  sendMessage: async (payload) => {
    // payload: { message, resource_id, context }
    return request("/chat/message", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
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
  generateDiagram: (sessionId, resourceId, page, scope, diagramType) =>
    Promise.resolve({
      success: true,
      data: { diagram: "", diagramType: diagramType || "mindmap" },
    }),
};

export const uploadAPI = {
  uploadFile: async (file, workspaceId, onProgress) => {
    if (typeof workspaceId === "function") {
      onProgress = workspaceId;
      workspaceId = null;
    }

    if (!workspaceId) {
      throw new Error("Workspace is required to upload files");
    }

    if (typeof onProgress === "function") onProgress(10);

    const resourceResponse = await requestWithAuth("/resources/", {
      method: "POST",
      body: JSON.stringify({
        workspace_id: workspaceId,
        title: file?.name || "Uploaded PDF",
        type: "pdf",
      }),
    });

    const resourceId =
      resourceResponse?.resourceId ||
      resourceResponse?.data?.resourceId ||
      resourceResponse?.data?.id ||
      resourceResponse?.data?.data?.id ||
      `mock-${Date.now()}`;

    if (typeof onProgress === "function") onProgress(60);

    const formData = new FormData();
    formData.append("file", file);

    const token = getToken();
    const res = await fetch(`${API_BASE}/files/${resourceId}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        data?.error?.message ||
        data?.error ||
        data?.message ||
        `Upload failed with status ${res.status}`;
      const error = new Error(message);
      error.code = data?.code || res.status;
      error.data = data;
      console.error("File Upload Error:", {
        resourceId,
        status: res.status,
        data,
      });
      throw error;
    }

    if (typeof onProgress === "function") onProgress(100);

    return {
      data: {
        resourceId,
        resourceType: "pdf",
        processingStatus: "uploaded",
        subjects: [],
        sections: [],
      },
    };
  },
};

export const notesAPI = {
  getNotes: () => mockList("notes"),
  generate: (resourceId) =>
    requestWithAuth(`/notes/${resourceId}/generate`, {
      method: "POST",
    }),
  getMarkdown: (noteId) =>
    requestWithAuth(`/notes/${noteId}/markdown`, {
      method: "GET",
    }),
};

export const flashcardsAPI = {
  getFlashcards: (resourceId) =>
    requestWithAuth(`/flashcards/${resourceId}`, {
      method: "GET",
    }).then((res) => res.flashcards || []),
  generateFlashcards: (resourceId) =>
    requestWithAuth(`/flashcards/${resourceId}/generate`, {
      method: "POST",
    }).then((res) => res.flashcards || []),
};

export const quizzesAPI = {
  getQuiz: (resourceId) =>
    requestWithAuth(`/quiz/${resourceId}`, {
      method: "GET",
    }).then((res) => res.quiz || []),
  generateQuiz: (resourceId) =>
    requestWithAuth(`/quiz/${resourceId}/generate`, {
      method: "POST",
    }).then((res) => res.quiz || []),
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
  start: (payload) =>
    requestWithAuth("/live-lecture/start", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    }),
  end: (payload) =>
    requestWithAuth("/live-lecture/end", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    }),
};

export const workspaceAPI = {
  getWorkspaces: (userId) =>
    requestWithAuth("/workspace/", {
      method: "GET",
      params: { user_id: userId },
    }),
  createWorkspace: (data) =>
    requestWithAuth("/workspace/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteWorkspace: (workspaceId) =>
    requestWithAuth(`/workspace/${workspaceId}`, {
      method: "DELETE",
    }),
  getWorkspaceResources: (workspaceId) =>
    requestWithAuth(`/resources/workspaces/${workspaceId}/resources`, {
      method: "GET",
    }),
};

export const resourceAPI = {
  getResource: (resourceId) =>
    requestWithAuth(`/resources/${resourceId}`, { method: "GET" }),
  createResource: (data) =>
    requestWithAuth("/resources/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteResource: (resourceId) =>
    requestWithAuth(`/resources/${resourceId}`, {
      method: "DELETE",
    }),
};

export const filesAPI = {
  getResourceFile: (resourceId) =>
    requestWithAuth(`/files/${resourceId}`, { method: "GET" }),
  uploadFile: async (resourceId, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = getToken();
    const res = await fetch(`${API_BASE}/files/${resourceId}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        data?.error?.message ||
        data?.error ||
        data?.message ||
        `Upload failed with status ${res.status}`;
      const error = new Error(message);
      error.code = data?.code || res.status;
      error.data = data;
      console.error("File Upload Error:", {
        resourceId,
        status: res.status,
        data,
      });
      throw error;
    }
    return data;
  },
  downloadFile: async (resourceUrl) => {
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

export const mindmapAPI = {
  getMindmap: (resourceId) =>
    requestWithAuth(`/mindmap/${resourceId}`, {
      method: "GET",
    }).then((res) => res.mindmap),
  generateMindmap: (resourceId) =>
    requestWithAuth(`/mindmap/${resourceId}/generate`, {
      method: "POST",
    }).then((res) => res.mindmap),
};
