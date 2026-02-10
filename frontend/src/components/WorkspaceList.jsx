import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { authAPI, workspaceAPI } from "../utils/api";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const extractUserId = (payload) => {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  return (
    payload?.id ||
    payload?.user_id ||
    payload?.data?.id ||
    payload?.data?.user_id ||
    payload?.user?.id ||
    payload?.data?.user?.id ||
    payload?.data?.user?.user_id ||
    null
  );
};

export default function WorkspaceList({ user, darkMode = false, onSelect }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvedUserId, setResolvedUserId] = useState(
    user?.id || user?.user_id || null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceTitle, setNewWorkspaceTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setResolvedUserId(user?.id || user?.user_id || null);
  }, [user?.id, user?.user_id]);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoading(true);
        let userId = resolvedUserId;

        if (!userId) {
          const cachedUser = localStorage.getItem("authUser");
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              userId = extractUserId(parsedUser);
              setResolvedUserId(userId);
            } catch (error) {
              console.error("Failed to parse cached user:", error);
              userId = extractUserId(cachedUser);
              setResolvedUserId(userId);
            }
          }
        }

        if (!userId) {
          try {
            const response = await authAPI.me();
            userId = extractUserId(response);
            setResolvedUserId(userId);
          } catch (error) {
            console.error("Failed to resolve user id:", error);
          }
        }

        if (!userId) {
          setWorkspaces([]);
          return;
        }

        const response = await workspaceAPI.getWorkspaces(userId);
        const data =
          response?.data?.workspaces ||
          response?.workspaces ||
          response?.data ||
          [];
        setWorkspaces(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
        setWorkspaces([]);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, [resolvedUserId]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceTitle.trim()) {
      alert("Please enter a workspace title");
      return;
    }

    if (!resolvedUserId) {
      alert("User ID not found. Please log in again.");
      return;
    }

    console.log(resolvedUserId);
    console.log(newWorkspaceTitle);

    try {
      setIsCreating(true);

      console.log("Creating workspace with data:", {
        user_id: resolvedUserId,
        title: newWorkspaceTitle.trim(),
      });

      const response = await workspaceAPI.createWorkspace({
        user_id: resolvedUserId,
        title: newWorkspaceTitle.trim(),
      });

      console.log(response);

      console.log("Workspace created successfully:", response);

      // Reset form and close modal
      setNewWorkspaceTitle("");
      setShowCreateModal(false);

      // Reload workspaces
      const workspacesResponse =
        await workspaceAPI.getWorkspaces(resolvedUserId);
      const data =
        workspacesResponse?.data?.workspaces ||
        workspacesResponse?.workspaces ||
        workspacesResponse?.data ||
        [];
      setWorkspaces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to create workspace:", error);
      const errorMessage =
        error.message || "Failed to create workspace. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete?.id) {
      return;
    }

    try {
      setIsDeleting(true);

      console.log("Deleting workspace:", workspaceToDelete.id);

      await workspaceAPI.deleteWorkspace(workspaceToDelete.id);

      console.log("Workspace deleted successfully");

      // Close modal and reset state
      setShowDeleteModal(false);
      setWorkspaceToDelete(null);

      // Reload workspaces
      const workspacesResponse =
        await workspaceAPI.getWorkspaces(resolvedUserId);
      const data =
        workspacesResponse?.data?.workspaces ||
        workspacesResponse?.workspaces ||
        workspacesResponse?.data ||
        [];
      setWorkspaces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      const errorMessage =
        error.message || "Failed to delete workspace. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (workspace, event) => {
    event.stopPropagation();
    setWorkspaceToDelete(workspace);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div
        className={`rounded-2xl border p-10 text-center ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-purple-100"
        }`}>
        <BookOpen
          className={`w-14 h-14 mx-auto mb-4 ${
            darkMode ? "text-gray-600" : "text-gray-300"
          }`}
        />
        <p
          className={`text-lg mb-2 ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}>
          No workspaces yet
        </p>
        <p className={`${darkMode ? "text-gray-500" : "text-gray-500"}`}>
          Create a workspace by uploading a resource from the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <h2
          className={`text-2xl font-semibold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}>
          My Workspaces
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            darkMode
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg text-white"
          }`}>
          <Plus className='w-5 h-5' />
          Create Workspace
        </button>
      </div>
      <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6'>
        {workspaces.map((workspace) => {
          const title = workspace?.title || workspace?.name || "Untitled";
          const createdAt =
            workspace?.created_at || workspace?.createdAt || workspace?.date;

          return (
            <button
              key={workspace?.id}
              onClick={() => onSelect?.(workspace)}
              className={`text-left p-5 rounded-2xl border transition-all shadow-sm hover:shadow-lg group ${
                darkMode
                  ? "bg-gray-800 border-gray-700 hover:border-purple-500"
                  : "bg-white border-purple-100 hover:border-purple-300"
              }`}>
              <div className='flex items-center justify-between mb-4'>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    darkMode ? "bg-purple-900/40" : "bg-purple-100"
                  }`}>
                  <BookOpen
                    className={`w-6 h-6 ${
                      darkMode ? "text-purple-300" : "text-purple-600"
                    }`}
                  />
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={(e) => confirmDelete(workspace, e)}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode
                        ? "hover:bg-red-900/40 text-gray-400 hover:text-red-400"
                        : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                    }`}
                    title='Delete workspace'>
                    <Trash2 className='w-5 h-5' />
                  </button>
                  <ChevronRight
                    className={`w-5 h-5 ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    } group-hover:translate-x-1 transition-transform`}
                  />
                </div>
              </div>
              <h3
                className={`text-lg mb-2 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}>
                {title}
              </h3>
              <div
                className={`flex items-center gap-2 text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                <Calendar className='w-4 h-4' />
                <span>{formatDate(createdAt) || "Date unavailable"}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'>
          <div
            className={`w-full max-w-md rounded-2xl shadow-xl ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}>
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between px-6 py-4 border-b ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}>
              <h3
                className={`text-xl font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}>
                Create New Workspace
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWorkspaceTitle("");
                }}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}>
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Modal Body */}
            <div className='px-6 py-6'>
              <label
                htmlFor='workspace-title'
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                Workspace Title
              </label>
              <input
                id='workspace-title'
                type='text'
                value={newWorkspaceTitle}
                onChange={(e) => setNewWorkspaceTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isCreating) {
                    handleCreateWorkspace();
                  }
                }}
                placeholder='Enter workspace title...'
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                autoFocus
              />
            </div>

            {/* Modal Footer */}
            <div
              className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWorkspaceTitle("");
                }}
                disabled={isCreating}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}>
                Cancel
              </button>
              <button
                onClick={handleCreateWorkspace}
                disabled={isCreating || !newWorkspaceTitle.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg text-white"
                }`}>
                {isCreating ? (
                  <span className='flex items-center gap-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    Creating...
                  </span>
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Workspace Confirmation Modal */}
      {showDeleteModal && workspaceToDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'>
          <div
            className={`w-full max-w-md rounded-2xl shadow-xl ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}>
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between px-6 py-4 border-b ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}>
              <h3
                className={`text-xl font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}>
                Delete Workspace
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setWorkspaceToDelete(null);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}>
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Modal Body */}
            <div className='px-6 py-6'>
              <p
                className={`text-base ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                Are you sure you want to delete{" "}
                <span className='font-semibold'>
                  {workspaceToDelete?.title ||
                    workspaceToDelete?.name ||
                    "this workspace"}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            {/* Modal Footer */}
            <div
              className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setWorkspaceToDelete(null);
                }}
                disabled={isDeleting}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}>
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkspace}
                disabled={isDeleting}
                className={`px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}>
                {isDeleting ? (
                  <span className='flex items-center gap-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
