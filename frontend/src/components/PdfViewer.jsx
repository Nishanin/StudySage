import React, { useCallback, useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.mjs";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const buildViewUrl = (resourceId, page, loaded) => {
  const search = new URLSearchParams({
    page: String(page),
    loaded: String(loaded),
  });
  return `${API_BASE}/files/${resourceId}/view?${search.toString()}`;
};

export default function PdfViewer({
  resourceId,
  onPageChange,
  onLoadedChange,
  onTotalPages,
  onError,
  darkMode = false,
}) {
  const [pages, setPages] = useState([]);
  const [loadedPages, setLoadedPages] = useState(0);
  const [totalPages, setTotalPages] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visiblePage, setVisiblePage] = useState(1);
  const observerRef = useRef(null);
  const loadingRef = useRef(false);
  const containerRef = useRef(null);

  const resetState = useCallback(() => {
    setPages([]);
    setLoadedPages(0);
    setTotalPages(null);
    setIsLoading(false);
    setError(null);
    loadingRef.current = false;
  }, []);

  const fetchChunk = useCallback(
    async (startPage, count) => {
      if (!resourceId || loadingRef.current) return;
      if (totalPages && startPage > totalPages) return;

      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(
          buildViewUrl(resourceId, startPage, count),
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );

        if (response.status === 204) {
          setIsLoading(false);
          loadingRef.current = false;
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to load PDF pages (${response.status})`);
        }

        const totalHeader = response.headers.get("x-total-pages");
        const parsedTotal = totalHeader
          ? Number.parseInt(totalHeader, 10)
          : null;
        if (Number.isFinite(parsedTotal) && parsedTotal > 0) {
          setTotalPages(parsedTotal);
          onTotalPages?.(parsedTotal);
        }

        const buffer = await response.arrayBuffer();
        const pdf = await getDocument({ data: buffer }).promise;

        const renderedPages = [];
        for (let i = 1; i <= pdf.numPages; i += 1) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.2 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport }).promise;
          renderedPages.push({
            pageNumber: startPage + i - 1,
            dataUrl: canvas.toDataURL("image/png"),
          });
        }

        setPages((prev) => {
          const existing = new Set(prev.map((item) => item.pageNumber));
          const next = renderedPages.filter(
            (item) => !existing.has(item.pageNumber),
          );
          return [...prev, ...next].sort((a, b) => a.pageNumber - b.pageNumber);
        });

        const newLoaded = startPage + pdf.numPages - 1;
        setLoadedPages((prev) => Math.max(prev, newLoaded));
        onLoadedChange?.(newLoaded);
      } catch (err) {
        const message = err?.message || "Failed to load PDF pages";
        setError(message);
        onError?.(message);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [resourceId, totalPages, onLoadedChange, onTotalPages, onError],
  );

  useEffect(() => {
    if (!resourceId) return;
    resetState();
    fetchChunk(1, 10);
  }, [resourceId, fetchChunk, resetState]);

  useEffect(() => {
    if (!pages.length) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length === 0) return;

        const pageNumber = Number.parseInt(
          visibleEntries[0].target.dataset.page,
          10,
        );
        if (Number.isFinite(pageNumber)) {
          onPageChange?.(pageNumber);
          setVisiblePage(pageNumber);
        }
      },
      { threshold: [0.6] },
    );

    const pageElements =
      containerRef.current?.querySelectorAll("[data-pdf-page]") || [];
    pageElements.forEach((element) => observerRef.current.observe(element));

    return () => observerRef.current?.disconnect();
  }, [pages, loadedPages, totalPages, fetchChunk, onPageChange]);

  useEffect(() => {
    if (!visiblePage) return;
    if (loadedPages < 10) return;
    if (totalPages && loadedPages >= totalPages) return;
    if (visiblePage >= loadedPages - 2) {
      fetchChunk(loadedPages + 1, 5);
    }
  }, [visiblePage, loadedPages, totalPages, fetchChunk]);

  if (!resourceId) {
    return null;
  }

  return (
    <div className='w-full'>
      {error && (
        <div
          className={`w-full p-4 border rounded text-sm mb-4 ${
            darkMode
              ? "bg-red-900/30 border-red-900 text-red-200"
              : "bg-red-100 border-red-300 text-red-700"
          }`}>
          {error}
        </div>
      )}
      {pages.length === 0 && isLoading && (
        <div
          className={`text-sm text-center py-6 ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}>
          Loading pages...
        </div>
      )}
      <div ref={containerRef} className='flex flex-col items-center gap-6'>
        {pages.map((page) => (
          <div
            key={page.pageNumber}
            data-pdf-page
            data-page={page.pageNumber}
            className='w-full flex items-center justify-center'>
            <img
              alt={`Page ${page.pageNumber}`}
              src={page.dataUrl}
              className='max-w-full shadow-lg border border-gray-200'
            />
          </div>
        ))}
      </div>
      {isLoading && pages.length > 0 && (
        <div
          className={`text-sm text-center py-4 ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}>
          Loading more pages...
        </div>
      )}
    </div>
  );
}
