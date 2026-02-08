import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import StudyWorkspace from "./StudyWorkspace";
import { resourceAPI } from "../utils/api";

const resolveResourceData = (response) => {
  if (!response) return null;
  return (
    response?.data?.resource || response?.resource || response?.data || null
  );
};

const getAssetBaseUrl = () => {
  const apiBase =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  return apiBase.replace(/\/?api\/?$/, "");
};

const normalizeFileUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  const clean = value.replace(/\\/g, "/");
  if (clean.startsWith("/")) {
    return `${getAssetBaseUrl()}${clean}`;
  }

  const uploadsIndex = clean.indexOf("uploads/");
  if (uploadsIndex >= 0) {
    const relative = clean.slice(uploadsIndex);
    return `${getAssetBaseUrl()}/${relative}`;
  }

  return clean;
};

const extractResourceUrl = (resource) => {
  const rawUrl =
    resource?.fileUrl ||
    resource?.file_url ||
    resource?.url ||
    resource?.downloadUrl ||
    resource?.signedUrl ||
    resource?.file_path ||
    resource?.filePath ||
    resource?.local_path ||
    resource?.localPath ||
    resource?.storage_path ||
    resource?.path ||
    null;

  return normalizeFileUrl(rawUrl);
};

const resolveResourceType = (resource) => {
  return (
    resource?.resource_type ||
    resource?.type ||
    resource?.content_type ||
    resource?.mime_type ||
    null
  );
};

export default function ResourceViewerPage({
  user,
  onNavigate,
  onLogout,
  darkMode = false,
}) {
  const { resourceId } = useParams();
  const location = useLocation();
  const uploadedFile = location.state?.uploadedFile || null;
  const stateResource = location.state?.resource || null;
  const [resource, setResource] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(true);

  const resourceTitle = useMemo(() => {
    if (uploadedFile?.name) return uploadedFile.name;
    return resource?.title || resource?.name || resource?.filename || null;
  }, [resource, uploadedFile]);

  useEffect(() => {
    let localBlobUrl = null;

    const loadResource = async () => {
      let resourceData = null;

      try {
        setLoading(true);

        if (stateResource) {
          setResource(stateResource);
          const urlFromState = extractResourceUrl(stateResource);
          if (urlFromState) {
            setFileUrl(urlFromState);
          }
          const typeFromState = resolveResourceType(stateResource);
          if (typeFromState) setFileType(typeFromState);
        }

        if (uploadedFile && uploadedFile instanceof File) {
          localBlobUrl = URL.createObjectURL(uploadedFile);
          setFileUrl(localBlobUrl);
          setFileType(uploadedFile.type || null);
        }

        const response = await resourceAPI.getResource(resourceId);
        resourceData = resolveResourceData(response);
        if (resourceData) {
          setResource(resourceData);
          const url = extractResourceUrl(resourceData);
          if (url) {
            setFileUrl(url);
          }
          const type = resolveResourceType(resourceData);
          if (type) setFileType(type);
        }
      } catch (error) {
        console.error("Failed to fetch resource:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResource();

    return () => {
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [resourceId, uploadedFile, stateResource]);

  return (
    <StudyWorkspace
      user={user}
      onNavigate={onNavigate}
      onLogout={onLogout}
      darkMode={darkMode}
      resourceId={resourceId}
      resourceTitle={resourceTitle}
      resourceType={fileType}
      fileUrl={fileUrl}
      uploadedFile={uploadedFile}
      isResourceLoading={loading}
    />
  );
}
