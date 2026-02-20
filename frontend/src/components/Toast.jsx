import React, { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        minWidth: 220,
        opacity: 1,
        transition: "opacity 0.3s ease",
      }}
      className={`toast-fade-in ${
        type === "success"
          ? "bg-green-600"
          : type === "error"
            ? "bg-red-600"
            : "bg-gray-800"
      }`}>
      <div
        style={{
          borderRadius: 8,
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          padding: "14px 24px",
          color: "#fff",
          fontWeight: 500,
          fontSize: 16,
          display: "flex",
          alignItems: "center",
        }}>
        {message}
      </div>
    </div>
  );
}

// CSS for fade-in
// Add this to your global CSS or import in your main CSS file:
// .toast-fade-in { opacity: 0; animation: toast-fade-in 0.3s forwards; }
// @keyframes toast-fade-in { to { opacity: 1; } }
