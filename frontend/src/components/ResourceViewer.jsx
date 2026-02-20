import React, { useEffect, useMemo, useState } from "react";
import DocumentViewer from "./DocumentViewer";
import { filesAPI } from "../utils/api";

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

  useEffect(() => {
    let currentBlobUrl = null;

    const loadResource = async () => {
      if (!resourceId) return;

      try {
        setLoading(true);
        setError("");
        setBlobUrl(null);

        // Load metadata to determine file type
        const response = await filesAPI.getResourceFile(resourceId);
        const data = resolveMetadata(response);
        setMetadata(data || null);

        const resolvedMime = resolveMimeType(data);
        const isPdfFile = resolvedMime === "application/pdf";

        // Only fetch and display PDF files; PPT/other formats show unsupported message
        if (!isPdfFile) {
          setLoading(false);
          return;
        }

        // Fetch the file content for PDF
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

  // PDF: show viewer
  if (isPdf && blobUrl) {
    return (
      <div className='w-full'>
        <DocumentViewer
          fileUrl={blobUrl}
          fileType='application/pdf'
          resourceId={resourceId}
          darkMode={darkMode}
        />
      </div>
    );
  }

  // PPTX or any other format: show unsupported message
  if (metadata && !isPdf) {
    return (
      <div
        className={`rounded-2xl border p-8 text-center ${
          darkMode
            ? "bg-gray-800 border-gray-700 text-gray-300"
            : "bg-white border-purple-100 text-gray-700"
        }`}>
        <p className='text-lg font-semibold mb-2'>
          We cannot display this format currently
        </p>
        <p className='text-sm opacity-80'>
          PDF files are supported for viewing. PPTX and other formats are not
          yet supported.
        </p>
      </div>
    );
  }

  // No metadata or unknown
  if (!metadata) {
    return (
      <div
        className={`rounded-2xl border p-6 text-center ${
          darkMode
            ? "bg-gray-800 border-gray-700 text-gray-300"
            : "bg-white border-purple-100 text-gray-700"
        }`}>
        <p className='text-sm'>Unable to load resource.</p>
      </div>
    );
  }

  return null;
}
