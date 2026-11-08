// Renders each page to HTML at build time and writes it into its file under
// dist/ (the issue, the blog and its posts, the UI docs), so the pages read without
// JavaScript and the client only hydrates.
import { readFile, rm, writeFile } from "node:fs/promises";
import { withCsp } from "./csp.mjs";

const { pages } = await import("../dist-ssr/entry-server.js");
// The root may carry data attributes (a post's slug), which stay on it.
const marker = /<div id="root"([^>]*)><\/div>/;

// The cascade layers, lowest first (src/index.css). The library's parts bring their own
// stylesheets, so the page's first one must declare this order before any part's.
const LAYERS = ["compat", "base", "components", "site"];
async function layerOrder(html, path) {
  const first = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"/)?.[1];
  if (!first) throw new Error(`prerender: dist/${path} links no stylesheet`);
  const css = await readFile(new URL(`../dist${first}`, import.meta.url), "utf8");
  const seen = [];
  for (const m of css.matchAll(/@layer\s+([\w-]+(?:\s*,\s*[\w-]+)*)\s*[{;]/g))
    for (const name of m[1].split(/\s*,\s*/)) if (!seen.includes(name)) seen.push(name);
  if (LAYERS.some((l, i) => seen[i] !== l)) throw new Error(`prerender: dist/${path} declares layers ${seen.join(", ")}, not ${LAYERS.join(", ")} first`);
}

for (const [path, render] of Object.entries(pages())) {
  const file = new URL(`../dist/${path}`, import.meta.url);
  const html = await readFile(file, "utf8");
  if (!marker.test(html)) throw new Error(`prerender: an empty <div id="root"> not found in dist/${path}`);
  await layerOrder(html, path);

  // A function, so a "$" in the page is never read as a replacement pattern.
  // With its Content-Security-Policy, hashed over the page as it is written (scripts/csp.mjs).
  await writeFile(file, withCsp(html.replace(marker, (_, attrs) => `<div id="root"${attrs}>${render()}</div>`), `dist/${path}`));
  console.log(`prerendered dist/${path}`);
}
// Life is drawn in the browser and not prerendered, but its stylesheets must stack the same way, and it has the policy.
const life = new URL("../dist/life/index.html", import.meta.url);
const lifeHtml = await readFile(life, "utf8");
await layerOrder(lifeHtml, "life/index.html");
await writeFile(life, withCsp(lifeHtml, "dist/life/index.html"));
await rm(new URL("../dist-ssr", import.meta.url), { recursive: true, force: true });
