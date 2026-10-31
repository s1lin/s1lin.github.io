import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { UiPage } from "@/components/uidocs/UiDocs";
import "./index.css";
import "./fonts";
import "./styles/tex.css";
import "./styles/social.css";
import "./styles/uidocs.css";

const root = document.getElementById("root")!;
const page = (
  <StrictMode>
    <UiPage />
  </StrictMode>
);

// The production build is prerendered (scripts/prerender.mjs); the dev server is not.
if (root.hasChildNodes()) hydrateRoot(root, page);
else createRoot(root).render(page);
