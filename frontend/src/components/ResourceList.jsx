import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Calendar,
  FileText,
  Music,
  Video,
  X,
  Plus,
  Upload,
  Trash2,
} from "lucide-react";
import { workspaceAPI, resourceAPI, filesAPI } from "../utils/api";

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

const resolveTypeLabel = (resource) => {
  const type =
    resource?.resource_type ||
    resource?.type ||
    resource?.content_type ||
    resource?.mime_type ||
    "document";
  if (typeof type === "string" && type.includes("pdf")) return "PDF";
  if (typeof type === "string" && type.includes("powerpoint")) return "PPT";
  if (type === "ppt" || type === "pptx") return "PPT";
  if (typeof type === "string" && type.includes("video")) return "Video";
  if (typeof type === "string" && type.includes("audio")) return "Audio";
  return type.toString().toUpperCase();
};

const resolveTypeIcon = (label) => {
  switch (label) {
    case "PDF":
      return FileText;
    case "PPT":
      return BookOpen;
    case "VIDEO":
    case "Video":
      return Video;
    case "AUDIO":
    case "Audio":
      return Music;
    default:
      return FileText;
  }
};

export default function ResourceList({
  workspaceId,
  darkMode = false,
  onSelect,
}) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    type: "pdf",
    file: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadResources = async () => {
      if (!workspaceId) {
        setResources([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await workspaceAPI.getWorkspaceResources(workspaceId);
        const data = response?.data ?? response;
        const list = Array.isArray(data)
          ? data
          : data?.resources || data?.items || data?.data || [];
        setResources(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Failed to fetch workspace resources:", error);
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [workspaceId]);

  const handleUploadResource = async () => {
    if (!uploadForm.title.trim()) {
      alert("Please enter a resource title");
      return;
    }

    if (!uploadForm.file) {
      alert("Please select a file to upload");
      return;
    }

    if (!workspaceId) {
      alert("Workspace ID not found");
      return;
    }

    try {
      setIsUploading(true);

      console.log("Creating resource with data:", {
        workspace_id: workspaceId,
        title: uploadForm.title.trim(),
        type: uploadForm.type,
      });

      // Step 1: Create the resource
      const createResponse = await resourceAPI.createResource({
        workspace_id: workspaceId,
        title: uploadForm.title.trim(),
        type: uploadForm.type,
      });

      console.log("Resource created:", createResponse);

      const resourceId =
        createResponse?.resourceId || createResponse?.data?.resourceId;

      if (!resourceId) {
        throw new Error("Resource ID not received from server");
      }

      // Step 2: Upload the file
      console.log("Uploading file for resource:", resourceId);
      const uploadResponse = await filesAPI.uploadFile(
        resourceId,
        uploadForm.file,
      );

      console.log("File uploaded successfully:", uploadResponse);

      // Reset form and close modal
      setUploadForm({ title: "", type: "pdf", file: null });
      setShowUploadModal(false);

      // Reload resources
      const response = await workspaceAPI.getWorkspaceResources(workspaceId);
      const data = response?.data ?? response;
      const list = Array.isArray(data)
        ? data
        : data?.resources || data?.items || data?.data || [];
      setResources(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to upload resource:", error);
      const errorMessage =
        error.message || "Failed to upload resource. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete?.id) {
      return;
    }

    try {
      setIsDeleting(true);

      console.log("Deleting resource:", resourceToDelete.id);

      await resourceAPI.deleteResource(resourceToDelete.id);

      console.log("Resource deleted successfully");

      // Close modal and reset state
      setShowDeleteModal(false);
      setResourceToDelete(null);

      // Reload resources
      const response = await workspaceAPI.getWorkspaceResources(workspaceId);
      const data = response?.data ?? response;
      const list = Array.isArray(data)
        ? data
        : data?.resources || data?.items || data?.data || [];
      setResources(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to delete resource:", error);
      const errorMessage =
        error.message || "Failed to delete resource. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (resource, event) => {
    event.stopPropagation();
    setResourceToDelete(resource);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div>
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
            No resources in this workspace
          </p>
          <p className={`mb-6 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
            Upload or add a resource to get started.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className={`flex items-center gap-2 px-6 py-3 mx-auto rounded-lg font-medium transition-all ${
              darkMode
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg text-white"
            }`}>
            <Upload className='w-5 h-5' />
            Upload Resource
          </button>
        </div>

        {/* Upload Resource Modal */}
        {showUploadModal && (
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
                  Upload Study Resource
                </h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadForm({ title: "", type: "pdf", file: null });
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
              <div className='px-6 py-6 space-y-4'>
                {/* Title Input */}
                <div>
                  <label
                    htmlFor='resource-title-empty'
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                    Resource Title
                  </label>
                  <input
                    id='resource-title-empty'
                    type='text'
                    value={uploadForm.title}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, title: e.target.value })
                    }
                    placeholder='Enter resource title...'
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    autoFocus
                  />
                </div>

                {/* Type Selection */}
                <div>
                  <label
                    htmlFor='resource-type-empty'
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                    Resource Type
                  </label>
                  <select
                    id='resource-type-empty'
                    value={uploadForm.type}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, type: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}>
                    <option value='pdf'>PDF Document</option>
                    <option value='ppt'>PowerPoint Presentation</option>
                  </select>
                </div>

                {/* File Upload */}
                <div>
                  <label
                    htmlFor='resource-file-empty'
                    className={`block text-sm font-medium mb-2 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                    Upload File
                  </label>
                  <input
                    id='resource-file-empty'
                    type='file'
                    accept='.pdf,.ppt,.pptx'
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        file: e.target.files?.[0] || null,
                      })
                    }
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer"
                        : "bg-white border-gray-300 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 file:cursor-pointer hover:file:bg-purple-200"
                    }`}
                  />
                  {uploadForm.file && (
                    <p
                      className={`mt-2 text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}>
                      Selected: {uploadForm.file.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadForm({ title: "", type: "pdf", file: null });
                  }}
                  disabled={isUploading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}>
                  Cancel
                </button>
                <button
                  onClick={handleUploadResource}
                  disabled={
                    isUploading || !uploadForm.title.trim() || !uploadForm.file
                  }
                  className={`px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    darkMode
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg text-white"
                  }`}>
                  {isUploading ? (
                    <span className='flex items-center gap-2'>
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      Uploading...
                    </span>
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header with Upload Button */}
      <div className='flex justify-between items-center mb-6'>
        <h2
          className={`text-2xl font-semibold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}>
          Study Resources
        </h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            darkMode
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg text-white"
          }`}>
          <Upload className='w-5 h-5' />
          Upload Resource
        </button>
      </div>

      {/* Resource List */}
      <div className='space-y-4'>
        {resources.map((resource) => {
          const title =
            resource?.title ||
            resource?.name ||
            resource?.filename ||
            "Untitled";
          const typeLabel = resolveTypeLabel(resource);
          const TypeIcon = resolveTypeIcon(typeLabel);
          const addedAt =
            resource?.created_at ||
            resource?.createdAt ||
            resource?.uploaded_at ||
            resource?.date;

          return (
            <button
              key={resource?.id}
              onClick={() => onSelect?.(resource)}
              className={`w-full text-left p-4 md:p-5 rounded-2xl border transition-all shadow-sm hover:shadow-md ${
                darkMode
                  ? "bg-gray-800 border-gray-700 hover:border-purple-500"
                  : "bg-white border-purple-100 hover:border-purple-300"
              }`}>
              <div className='flex items-center gap-4'>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    darkMode ? "bg-purple-900/40" : "bg-purple-100"
                  }`}>
                  <TypeIcon
                    className={`w-6 h-6 ${
                      darkMode ? "text-purple-300" : "text-purple-600"
                    }`}
                  />
                </div>
                <div className='flex-1 min-w-0'>
                  <h3
                    className={`text-base md:text-lg mb-1 truncate ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}>
                    {title}
                  </h3>
                  <div
                    className={`flex flex-wrap items-center gap-3 text-xs md:text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        darkMode
                          ? "bg-purple-900/40 text-purple-200"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                      {typeLabel}
                    </span>
                    <span className='flex items-center gap-1'>
                      <Calendar className='w-4 h-4' />
                      {formatDate(addedAt) || "Date unavailable"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => confirmDelete(resource, e)}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    darkMode
                      ? "hover:bg-red-900/40 text-gray-400 hover:text-red-400"
                      : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                  }`}
                  title='Delete resource'>
                  <Trash2 className='w-5 h-5' />
                </button>
              </div>
            </button>
          );
        })}
      </div>

      {/* Upload Resource Modal */}
      {showUploadModal && (
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
                Upload Study Resource
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadForm({ title: "", type: "pdf", file: null });
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
            <div className='px-6 py-6 space-y-4'>
              {/* Title Input */}
              <div>
                <label
                  htmlFor='resource-title'
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                  Resource Title
                </label>
                <input
                  id='resource-title'
                  type='text'
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, title: e.target.value })
                  }
                  placeholder='Enter resource title...'
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  autoFocus
                />
              </div>

              {/* Type Selection */}
              <div>
                <label
                  htmlFor='resource-type'
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                  Resource Type
                </label>
                <select
                  id='resource-type'
                  value={uploadForm.type}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, type: e.target.value })
                  }
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}>
                  <option value='pdf'>PDF Document</option>
                  <option value='ppt'>PowerPoint Presentation</option>
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label
                  htmlFor='resource-file'
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                  Upload File
                </label>
                <input
                  id='resource-file'
                  type='file'
                  accept='.pdf,.ppt,.pptx'
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer"
                      : "bg-white border-gray-300 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 file:cursor-pointer hover:file:bg-purple-200"
                  }`}
                />
                {uploadForm.file && (
                  <p
                    className={`mt-2 text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                    Selected: {uploadForm.file.name}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadForm({ title: "", type: "pdf", file: null });
                }}
                disabled={isUploading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}>
                Cancel
              </button>
              <button
                onClick={handleUploadResource}
                disabled={
                  isUploading || !uploadForm.title.trim() || !uploadForm.file
                }
                className={`px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  darkMode
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg text-white"
                }`}>
                {isUploading ? (
                  <span className='flex items-center gap-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    Uploading...
                  </span>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Resource Confirmation Modal */}
      {showDeleteModal && resourceToDelete && (
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
                Delete Resource
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setResourceToDelete(null);
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
                  {resourceToDelete?.title ||
                    resourceToDelete?.name ||
                    resourceToDelete?.filename ||
                    "this resource"}
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
                  setResourceToDelete(null);
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
                onClick={handleDeleteResource}
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
