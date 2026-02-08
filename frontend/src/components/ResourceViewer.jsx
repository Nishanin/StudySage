import React, { useEffect, useMemo, useState } from "react";
import { filesAPI } from "../utils/api";

const PPT_MIME_TYPES = new Set([
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const resolveApiBase = () => {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  return base.replace(/\/$/, "");
};

const buildViewUrl = (resourceId) => {
  const base = resolveApiBase();
  if (base.endsWith("/api")) {
    return `${base}/files/${resourceId}/view`;
  }
  return `${base}/api/files/${resourceId}/view`;
};

const resolveMetadata = (response) => {
  if (!response) return null;
  return response?.data || response;
};

export default function ResourceViewer({ resourceId, darkMode = false }) {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mimeType = useMemo(() => {
    return metadata?.mime_type || metadata?.mimeType || "";
  }, [metadata]);

  const viewUrl = useMemo(() => {
    if (!resourceId) return null;
    return buildViewUrl(resourceId);
  }, [resourceId]);

  const isPdf = mimeType === "application/pdf";
  const isPpt = PPT_MIME_TYPES.has(mimeType);

  const iframeSrc = useMemo(() => {
    if (!viewUrl) return "";
    if (isPpt) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(viewUrl)}`;
    }
    return viewUrl;
  }, [isPpt, viewUrl]);

  useEffect(() => {
    const loadMetadata = async () => {
      if (!resourceId) return;

      try {
        setLoading(true);
        setError("");
        const response = await filesAPI.getResourceFile(resourceId);
        const data = resolveMetadata(response);
        setMetadata(data || null);
      } catch (err) {
        console.error("Failed to load resource metadata:", err);
        setError(err?.message || "Failed to load resource metadata.");
        setMetadata(null);
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, [resourceId]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-2xl border p-6 text-center ${
          darkMode
            ? "bg-gray-800 border-gray-700 text-gray-300"
            : "bg-white border-purple-100 text-gray-700"
        }`}>
        <p className='text-sm'>{error}</p>
      </div>
    );
  }

  if (!metadata || !iframeSrc || (!isPdf && !isPpt)) {
    return (
      <div
        className={`rounded-2xl border p-6 text-center ${
          darkMode
            ? "bg-gray-800 border-gray-700 text-gray-300"
            : "bg-white border-purple-100 text-gray-700"
        }`}>
        <p className='text-sm'>Unsupported or missing file type.</p>
      </div>
    );
  }

  return (
    <div className='w-full'>
      <iframe
        title={metadata?.original_file_name || "Resource Viewer"}
        src={iframeSrc}
        className='w-full h-[75vh] border-0 rounded-xl shadow'
      />
    </div>
  );
}
