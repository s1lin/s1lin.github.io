import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LifePage } from "@/components/Life";
import "./index.css";
import "./fonts";
import "./styles/life.css";
import "./styles/social.css";

// The page is drawn on canvases, so it is not prerendered.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LifePage />
  </StrictMode>,
);
