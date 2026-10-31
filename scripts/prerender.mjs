// Renders each page to HTML at build time and writes it into its file under
// dist/ (the issue, the blog and its posts, the UI docs), so the pages read without
// JavaScript and the client only hydrates.
import { readFile, rm, writeFile } from "node:fs/promises";

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
  await writeFile(file, html.replace(marker, (_, attrs) => `<div id="root"${attrs}>${render()}</div>`));
  console.log(`prerendered dist/${path}`);
}
// Life is drawn in the browser and not prerendered, but its stylesheets must stack the same way.
await layerOrder(await readFile(new URL("../dist/life/index.html", import.meta.url), "utf8"), "life/index.html");
await rm(new URL("../dist-ssr", import.meta.url), { recursive: true, force: true });
