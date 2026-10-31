import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = (p: string) => path.resolve(import.meta.dirname, p);

// The pages: the issue, the blog's index, a shell for each post at blog/<slug>/index.html, Life, and the UI docs.
const posts = readdirSync(here("blog"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => here(`blog/${d.name}/index.html`));

// The stylesheets every page starts with, and the library's parts the pages are set with, in one chunk:
// one stylesheet ahead of each page rather than a handful, the cascade layers declared first. Not KaTeX's
// (ui/tex.css): Tex fetches that only where a page has none. Not the console's parts either (registry.json
// items in the "console" category: forms, tables, dialogs, toasts): only /ui/ shows them, and they load with it.
const registry = JSON.parse(readFileSync(here("registry.json"), "utf8")) as { items: { categories?: string[]; files: { path: string }[] }[] };
const issueParts = new Set(registry.items.filter((i) => !i.categories?.includes("console")).flatMap((i) => i.files.map((f) => here(f.path))));
issueParts.delete(here("src/ui/tex.css"));
const SHARED = /src[\\/](index\.css|fonts\.ts|styles[\\/](fonts|base|site|social)\.css)/;
const inIssue = (id: string) => SHARED.test(id) || issueParts.has(path.resolve(id.replace(/\?.*$/, "")));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": here("./src") },
  },
  build: {
    rolldownOptions: {
      input: [here("index.html"), here("blog/index.html"), here("life/index.html"), here("ui/index.html"), ...posts],
      output: { codeSplitting: { groups: [{ name: "issue", test: inIssue }] } },
    },
  },
});
