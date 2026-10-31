import { readdirSync } from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = (p: string) => path.resolve(import.meta.dirname, p);

// The pages: the issue, the blog's index, a shell for each post at blog/<slug>/index.html, Life, and the UI docs.
const posts = readdirSync(here("blog"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => here(`blog/${d.name}/index.html`));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": here("./src") },
  },
  build: {
    rolldownOptions: {
      input: [here("index.html"), here("blog/index.html"), here("life/index.html"), here("ui/index.html"), ...posts],
      // The stylesheets every page starts with, and the library's parts with theirs, in one chunk:
      // one stylesheet ahead of each page rather than a handful, the cascade layers declared first.
      // Not KaTeX's (ui/tex.css): Tex fetches that only where a page has none.
      output: { codeSplitting: { groups: [{ name: "issue", test: /src[\\/](index\.css|fonts\.ts|ui[\\/](?!tex\.css)|styles[\\/](fonts|base|site|social)\.css)/ }] } },
    },
  },
});
