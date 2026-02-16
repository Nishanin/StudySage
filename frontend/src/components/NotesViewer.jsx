import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { notesAPI } from "../utils/api";
import "../styles/NotesViewer.css";

export default function NotesViewer({ noteId }) {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <div className="notes-container">
        <p className="notes-loading">Loading notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notes-container">
        <p className="notes-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="notes-container">
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
                  PreTag="div"
                  {...props}
                >
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
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
