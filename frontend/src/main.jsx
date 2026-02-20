import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ToastProvider } from "./context/ToastContext";
import "./styles/globals.css";
import "reactflow/dist/style.css";
import { StudyProvider } from "./context/StudyContext";

createRoot(document.getElementById("root")).render(
  <StudyProvider>
    <ToastProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ToastProvider>
  </StudyProvider>,
);
