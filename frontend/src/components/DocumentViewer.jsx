import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function DocumentViewer({
  fileUrl,
  fileType,
  resourceId,
  onLoadSuccess,
  onLoadError,
  onMetadataReceived,
  onOcrStatusChange,
  darkMode = false
}) {
  const isPdf = useMemo(() => fileType === 'application/pdf', [fileType]);
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pdfMetadata, setPdfMetadata] = useState(null);
  const [ocrStatus, setOcrStatus] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setPdfMetadata(null);
    setOcrStatus(null);
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

        // Trigger OCR if document is scanned
        if (resourceId && metadata.isScannedPdf) {
          triggerOcrProcessing(resourceId, metadata.isScannedPdf);
        }
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
  }, [fileUrl, resourceId, onLoadSuccess, onLoadError, onMetadataReceived]);

  /**
   * Trigger OCR processing for scanned PDFs
   */
  const triggerOcrProcessing = async (resId, isScanned) => {
    try {
      setOcrStatus('checking');
      onOcrStatusChange?.('checking');

      const response = await fetch('/api/ocr/check-and-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          resourceId: resId,
          isScannedPdf: isScanned
        })
      });

      if (!response.ok) {
        throw new Error(`OCR check failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        if (data.ocrCompleted) {
          setOcrStatus('completed');
          onOcrStatusChange?.('completed');
          console.log('[DocumentViewer] OCR already completed for this document');
        } else {
          setOcrStatus('pending');
          onOcrStatusChange?.('pending');
          console.log('[DocumentViewer] OCR job started:', data.jobId);

          // Poll for job completion
          if (data.jobId) {
            pollOcrStatus(data.jobId);
          }
        }
      }
    } catch (err) {
      console.error('[DocumentViewer] OCR trigger failed:', err.message);
      setOcrStatus('error');
      onOcrStatusChange?.('error', err.message);
    }
  };

  /**
   * Poll OCR job status
   */
  const pollOcrStatus = async (jobId, attempts = 0, maxAttempts = 60) => {
    const pollInterval = 2000; // 2 seconds

    const poll = async () => {
      try {
        const response = await fetch(`/api/ocr/job/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch job status: ${response.statusText}`);
        }

        const data = await response.json();
        const job = data.data;

        console.log('[DocumentViewer] OCR job status:', job.status, `(${job.progress.percentComplete}%)`);

        if (job.status === 'completed') {
          setOcrStatus('completed');
          onOcrStatusChange?.('completed');
          console.log('[DocumentViewer] OCR processing completed');
          return;
        }

        if (job.status === 'failed') {
          setOcrStatus('error');
          onOcrStatusChange?.('error', job.error);
          console.error('[DocumentViewer] OCR processing failed:', job.error);
          return;
        }

        // Still processing, poll again
        if (attempts < maxAttempts) {
          setTimeout(() => poll(), pollInterval);
        } else {
          console.warn('[DocumentViewer] OCR polling timeout');
          setOcrStatus('timeout');
          onOcrStatusChange?.('timeout');
        }
      } catch (err) {
        console.error('[DocumentViewer] Error polling OCR status:', err.message);
        setOcrStatus('error');
        onOcrStatusChange?.('error', err.message);
      }
    };

    poll();
  };

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
      {ocrStatus && ocrStatus !== 'error' && (
        <div className={`px-3 py-2 mb-3 rounded text-sm ${
          ocrStatus === 'completed'
            ? 'bg-green-100 text-green-800'
            : ocrStatus === 'checking'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {ocrStatus === 'completed' && '✓ Scanned PDF text extracted successfully'}
          {ocrStatus === 'checking' && 'Checking if OCR is needed...'}
          {ocrStatus === 'pending' && 'Processing scanned PDF text extraction...'}
          {ocrStatus === 'timeout' && 'OCR processing is taking longer than expected'}
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
