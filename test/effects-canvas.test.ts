import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { build } from "vite";

/*
 * The WebGL effects draw on a live context after they hand one back (frontend scan 2026-11-07, P1), in a real browser
 * with React running, under StrictMode as in dev. Each effect's destroy() loses its context, and a canvas gives that
 * lost context to every later getContext(): a section title scrolled past and back never tore again, and in dev no
 * effect showed at all. The page says what is in view (headless Chrome draws no frames under a virtual time budget).
 * Skipped where there is no Chrome: set CHROME to one.
 */

const ROOT = path.resolve(import.meta.dirname, "..");

function chrome(): string | undefined {
  const named = process.env.CHROME ?? process.env.CHROME_BIN;
  if (named) return named;
  const cache = path.join(process.env.HOME ?? "/root", ".cache/ms-playwright");
  const cached = existsSync(cache)
    ? readdirSync(cache)
        .filter((d) => d.startsWith("chromium-"))
        .map((d) => path.join(cache, d, "chrome-linux64/chrome"))
        .filter(existsSync)
    : [];
  const system = ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(existsSync);
  return [...cached, ...system][0];
}

const out = mkdtempSync(path.join(tmpdir(), "s1lin-effects-canvas-"));
after(() => rmSync(out, { recursive: true, force: true }));

const src = (f: string) => JSON.stringify(path.join(ROOT, "src", f));
const ENTRY = `
window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
import { StrictMode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { FrostPane, GlitchTitle } from ${src("components/effects.tsx")};

const watched = [];
window.IntersectionObserver = class {
  constructor(cb) { this.cb = cb; this.els = []; watched.push(this); }
  observe(el) { this.els.push(el); }
  unobserve() {}
  disconnect() { this.els = []; }
};
const view = (el, inView) => { for (const o of watched) for (const e of o.els) if (e === el) o.cb([{ target: e, isIntersecting: inView }], o); };
const root = createRoot(document.getElementById("app"));
flushSync(() => root.render(<StrictMode><GlitchTitle>5,000 hours.</GlitchTitle><FrostPane /></StrictMode>));

const got = {};
const steps = [];
const step = (f) => steps.push(f);
const $ = (s) => document.querySelector(s);
// what a later getContext() on the effect's canvas gets: a live context, or the lost one
const live = (s) => { const c = $(s); const gl = c && c.getContext("webgl2"); return gl ? !gl.isContextLost() : null; };
step(() => view($(".glitch"), true));
step(() => { got.glitchFirst = live(".glitch__out"); got.frost = live(".frost-pane"); view($(".glitch"), false); });
step(() => view($(".glitch"), true));
step(() => { got.glitchAgain = live(".glitch__out"); });
let i = 0;
const next = () => {
  if (i < steps.length) { steps[i++](); setTimeout(next, 150); }
  else document.getElementById("out").textContent = JSON.stringify(got);
};
setTimeout(next, 150);
`;

test("the WebGL effects draw on a live context: a title scrolled past and back, and every effect under StrictMode", async (t) => {
  const bin = chrome();
  if (!bin) return t.skip("no Chrome here: set CHROME to run it");
  writeFileSync(path.join(out, "entry.jsx"), ENTRY);
  if (!existsSync(path.join(out, "node_modules"))) symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");
  await build({
    configFile: false,
    root: out,
    logLevel: "silent",
    plugins: [react()],
    resolve: { alias: { "@": path.join(ROOT, "src") } },
    define: { "process.env.NODE_ENV": '"development"' },
    build: { outDir: path.join(out, "dist"), emptyOutDir: true, minify: false, lib: { entry: path.join(out, "entry.jsx"), formats: ["iife"], name: "Harness", fileName: () => "harness.js", cssFileName: "harness" } },
  });
  const js = readFileSync(path.join(out, "dist/harness.js"), "utf8");
  const page = path.join(out, "page.html");
  writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><main><div id="app"></div></main><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);
  let dom: string;
  try {
    dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--hide-scrollbars", "--window-size=1280,800", "--virtual-time-budget=10000", "--dump-dom", pathToFileURL(page).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000, maxBuffer: 256 * 1024 * 1024 });
  } catch (e) {
    return t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
  }
  const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
  assert.ok(text, "the page printed nothing");
  const got = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  assert.equal(got.pageError, undefined, got.pageError);
  // out of view and back: the title tears again
  assert.equal(got.glitchFirst, true, "the title's canvas as it first comes into view");
  assert.equal(got.glitchAgain, true, "the title's canvas after it was scrolled past and back");
  // under StrictMode (effects run on mount, are undone, and run again): a live context
  assert.equal(got.frost, true, "the frost's canvas, under StrictMode");
});
