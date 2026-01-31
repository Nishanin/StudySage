import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function DocumentViewer({
  fileUrl,
  fileType,
  onLoadSuccess,
  onLoadError,
  onMetadataReceived,
  darkMode = false
}) {
  const isPdf = useMemo(() => fileType === 'application/pdf', [fileType]);
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pdfMetadata, setPdfMetadata] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setPdfMetadata(null);
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

    // Listen for metadata from PDF viewer iframe
    const handleMessage = (event) => {
      if (event.data?.type === 'PDF_METADATA') {
        const metadata = event.data.metadata;
        setPdfMetadata(metadata);
        onMetadataReceived?.(metadata);
        console.log('[DocumentViewer] Received PDF metadata:', metadata);
      }
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);
    window.addEventListener('message', handleMessage);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
      window.removeEventListener('message', handleMessage);
      iframe.src = 'about:blank';
    };
  }, [fileUrl, onLoadSuccess, onLoadError, onMetadataReceived]);

  if (!fileUrl) {
    return null;
  }

  if (!isPdf) {
    return (
      <div className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <p className="text-lg font-semibold">Unsupported document type</p>
        <p className="text-sm mt-2">This viewer currently supports PDF files only.</p>
      </div>
    );
  }

  const viewerSrc = `/pdfjs/web/viewer.html?file=${encodeURIComponent(fileUrl)}`;

  return (
    <div className="w-full">
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading document...
          </div>
        </div>
      )}
      {hasError && (
        <div className="w-full p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-semibold">Error loading document</p>
          <p className="text-sm">Please try again or upload a different PDF.</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={viewerSrc}
        title="PDF Viewer"
        className="w-full h-[75vh] border-0"
      />
    </div>
  );
}
