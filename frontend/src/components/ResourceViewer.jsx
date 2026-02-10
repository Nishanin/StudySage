import React, { useEffect, useMemo, useState } from "react";
import DocumentViewer from "./DocumentViewer";
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
  const data = response?.data || response;
  if (Array.isArray(data)) {
    return data[0] || null;
  }
  return data;
};

const resolveMimeType = (metadata) => {
  const mimeType = metadata?.mime_type || metadata?.mimeType || "";
  if (mimeType) return mimeType;

  const fileName = metadata?.original_file_name || "";
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "ppt" || ext === "pptx") {
    return "application/vnd.ms-powerpoint";
  }

  return "";
};

export default function ResourceViewer({ resourceId, darkMode = false }) {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blobUrl, setBlobUrl] = useState(null);

  const mimeType = useMemo(() => resolveMimeType(metadata), [metadata]);

  const isPdf = mimeType === "application/pdf";
  const isPpt = PPT_MIME_TYPES.has(mimeType);

  const iframeSrc = useMemo(() => {
    if (!blobUrl) return "";
    // For both PDF and PowerPoint, use the blob URL directly
    // The backend converts PowerPoint to PDF already
    return blobUrl;
  }, [blobUrl]);

  const viewerFileType = isPdf || isPpt ? "application/pdf" : mimeType;

  useEffect(() => {
    let currentBlobUrl = null;

    const loadResource = async () => {
      if (!resourceId) return;

      try {
        setLoading(true);
        setError("");

        // Load metadata
        const response = await filesAPI.getResourceFile(resourceId);
        const data = resolveMetadata(response);
        setMetadata(data || null);

        // Fetch the file content with authentication
        const viewUrl = buildViewUrl(resourceId);
        const token = localStorage.getItem("authToken");

        const fileResponse = await fetch(viewUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!fileResponse.ok) {
          throw new Error(`Failed to load file: ${fileResponse.status}`);
        }

        const blob = await fileResponse.blob();
        const url = URL.createObjectURL(blob);
        currentBlobUrl = url;
        setBlobUrl(url);
      } catch (err) {
        console.error("Failed to load resource:", err);
        setError(err?.message || "Failed to load resource.");
        setMetadata(null);
        setBlobUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadResource();

    // Cleanup blob URL on unmount or when resourceId changes
    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
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
      <DocumentViewer
        fileUrl={iframeSrc}
        fileType={viewerFileType}
        resourceId={resourceId}
        darkMode={darkMode}
      />
    </div>
  );
}
