import katex from "katex";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App.tsx";
import { BlogPage } from "@/components/Blog";
import { UiPage } from "@/components/uidocs/UiDocs";
import { POSTS } from "@/content/posts";
import { setKatex } from "@/ui/tex";

// Maths is set here, as the pages are prerendered: readers get finished HTML and no KaTeX script.
setKatex(katex);

/** The issue as HTML. */
export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

/** A page of the blog as HTML: a post by its slug, or the index. */
function renderBlog(slug?: string) {
  return renderToString(
    <StrictMode>
      <BlogPage slug={slug} />
    </StrictMode>,
  );
}

/** The UI docs at /ui/. */
function renderUi() {
  return renderToString(
    <StrictMode>
      <UiPage />
    </StrictMode>,
  );
}

/** Every page, by its file under dist/, for scripts/prerender.mjs. */
export function pages(): Record<string, () => string> {
  return {
    "index.html": render,
    "blog/index.html": () => renderBlog(),
    "ui/index.html": renderUi,
    ...Object.fromEntries(POSTS.map((p) => [`blog/${p.slug}/index.html`, () => renderBlog(p.slug)])),
  };
}
