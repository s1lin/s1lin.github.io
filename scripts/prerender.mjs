// Renders each page to HTML at build time and writes it into its file under
// dist/ (the issue, the blog and its posts, the UI docs), so the pages read without
// JavaScript and the client only hydrates.
import { readFile, rm, writeFile } from "node:fs/promises";

const { pages } = await import("../dist-ssr/entry-server.js");
// The root may carry data attributes (a post's slug), which stay on it.
const marker = /<div id="root"([^>]*)><\/div>/;

for (const [path, render] of Object.entries(pages())) {
  const file = new URL(`../dist/${path}`, import.meta.url);
  const html = await readFile(file, "utf8");
  if (!marker.test(html)) throw new Error(`prerender: an empty <div id="root"> not found in dist/${path}`);

  // A function, so a "$" in the page is never read as a replacement pattern.
  await writeFile(file, html.replace(marker, (_, attrs) => `<div id="root"${attrs}>${render()}</div>`));
  console.log(`prerendered dist/${path}`);
}
await rm(new URL("../dist-ssr", import.meta.url), { recursive: true, force: true });
