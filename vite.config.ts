import { readdirSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = (p: string) => path.resolve(import.meta.dirname, p);

// The pages: the issue, the blog's index, a shell for each post at blog/<slug>/index.html, Life, and the UI docs.
const posts = readdirSync(here("blog"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => here(`blog/${d.name}/index.html`));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": here("./src") },
  },
  build: {
    rolldownOptions: { input: [here("index.html"), here("blog/index.html"), here("life/index.html"), here("ui/index.html"), ...posts] },
  },
});
