import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/globals.css";
import "reactflow/dist/style.css";
import { StudyProvider } from "./context/StudyContext";

createRoot(document.getElementById("root")).render(
  <StudyProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StudyProvider>,
);
