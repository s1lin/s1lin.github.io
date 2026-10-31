// First, so the cascade layers are declared before any part brings its own styles.
import "./index.css";
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BlogPage } from "@/components/Blog";
import "./fonts";
import "./styles/tex.css";
import "./styles/social.css";

// Each page's shell names its post on the root (blog/<slug>/index.html); the blog's index names none.
const root = document.getElementById("root")!;
const page = (
  <StrictMode>
    <BlogPage slug={root.dataset.post} />
  </StrictMode>
);

// The production build is prerendered (scripts/prerender.mjs); the dev server is not.
if (root.hasChildNodes()) hydrateRoot(root, page);
else createRoot(root).render(page);
