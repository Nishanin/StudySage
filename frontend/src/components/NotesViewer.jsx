import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { notesAPI } from "../utils/api";
import "../styles/NotesViewer.css";

export default function NotesViewer({ noteId }) {
  const { showToast } = useToast();
  // Reusable download helper
  async function downloadFile(url, filename) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to download");
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(objectUrl);
  }
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);

  // Download handlers
  const handleDownloadPdf = async () => {
    if (!noteId || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      await downloadFile(`/api/export/pdf/${noteId}`, `notes-${noteId}.pdf`);
      showToast("Download started", "success");
    } catch (err) {
      showToast("Download failed", "error");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!noteId || isDownloadingDocx) return;
    setIsDownloadingDocx(true);
    try {
      await downloadFile(`/api/export/docx/${noteId}`, `notes-${noteId}.docx`);
      showToast("Download started", "success");
    } catch (err) {
      showToast("Download failed", "error");
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  useEffect(() => {
    if (!noteId) return;

    setLoading(true);
    setError(null);

    notesAPI
      .getMarkdown(noteId)
      .then((data) => {
        setMarkdown(data.markdown);
      })
      .catch(() => {
        setError("Failed to load notes");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [noteId]);

  if (loading) {
    return (
      <div className='notes-container'>
        <div className='flex justify-end mb-4'>
          <div className='flex gap-2'>
            <button
              className='px-4 py-2 rounded-lg font-medium transition-colors bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
              style={{ minWidth: 110 }}
              onClick={handleDownloadPdf}
              disabled>
              Download PDF
            </button>
            <button
              className='px-4 py-2 rounded-lg font-medium transition-colors bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
              style={{ minWidth: 110 }}
              onClick={handleDownloadDocx}
              disabled>
              Download DOCX
            </button>
          </div>
        </div>
        <p className='notes-loading'>Loading notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='notes-container'>
        <div className='flex justify-end mb-4'>
          <div className='flex gap-2'>
            <button
              className='px-4 py-2 rounded-lg font-medium transition-colors bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
              style={{ minWidth: 110 }}
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}>
              {isDownloadingPdf ? "Downloading..." : "Download PDF"}
            </button>
            <button
              className='px-4 py-2 rounded-lg font-medium transition-colors bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
              style={{ minWidth: 110 }}
              onClick={handleDownloadDocx}
              disabled={isDownloadingDocx}>
              {isDownloadingDocx ? "Downloading..." : "Download DOCX"}
            </button>
          </div>
        </div>
        <p className='notes-error'>{error}</p>
      </div>
    );
  }

  return (
    <div className='notes-container'>
      <div className='flex justify-end mb-4'>
        <div className='flex gap-2'>
          <button
            className='px-4 py-2 rounded-lg font-medium transition-colors bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
            style={{ minWidth: 110 }}
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}>
            {isDownloadingPdf ? "Downloading..." : "Download PDF"}
          </button>
          <button
            className='px-4 py-2 rounded-lg font-medium transition-colors bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
            style={{ minWidth: 110 }}
            onClick={handleDownloadDocx}
            disabled={isDownloadingDocx}>
            {isDownloadingDocx ? "Downloading..." : "Download DOCX"}
          </button>
        </div>
      </div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "text";

            if (!inline) {
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={language}
                  PreTag='div'
                  {...props}>
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
