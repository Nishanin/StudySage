import React, { useEffect, useState } from "react";
import { BookOpen, Calendar, FileText, Music, Video } from "lucide-react";
import { workspaceAPI } from "../utils/api";

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

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  if (resources.length === 0) {
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
          No resources in this workspace
        </p>
        <p className={`${darkMode ? "text-gray-500" : "text-gray-500"}`}>
          Upload or add a resource to get started.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {resources.map((resource) => {
        const title =
          resource?.title || resource?.name || resource?.filename || "Untitled";
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
            </div>
          </button>
        );
      })}
    </div>
  );
}
