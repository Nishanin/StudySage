import React, { useEffect, useMemo, useRef, useState } from "react";

export default function DocumentViewer({
  fileUrl,
  fileType,
  resourceId,
  onLoadSuccess,
  onLoadError,
  onMetadataReceived,
  onOcrStatusChange,
  darkMode = false,
}) {
  const isPdf = useMemo(() => fileType === "application/pdf", [fileType]);
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [fileUrl]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      onLoadSuccess?.();
    };

    const handleError = (event) => {
      setIsLoading(false);
      setHasError(true);
      onLoadError?.(event);
    };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
      iframe.src = "about:blank";
    };
  }, [fileUrl, onLoadSuccess, onLoadError]);

  if (!fileUrl) {
    return null;
  }

  if (!isPdf) {
    return (
      <div
        className={`text-center ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        <p className='text-lg font-semibold'>Unsupported document type</p>
        <p className='text-sm mt-2'>
          This viewer currently supports PDF files only.
        </p>
      </div>
    );
  }

  return (
    <div className='w-full'>
      {isLoading && (
        <div className='flex flex-col items-center justify-center py-12 gap-3'>
          <div
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Loading document...
          </div>
        </div>
      )}
      {hasError && (
        <div className='w-full p-4 bg-red-100 border border-red-400 text-red-700 rounded'>
          <p className='font-semibold'>Error loading document</p>
          <p className='text-sm'>Please try again or upload a different PDF.</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={fileUrl}
        title='PDF Viewer'
        className='w-full h-[75vh] border-0'
      />
    </div>
  );
}
