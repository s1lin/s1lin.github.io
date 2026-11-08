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
 * Two fixes from the frontend scan of 2026-11-07 (P1), in a real browser with React running:
 * - The Life puzzle: Enter on a focused button is that button's click only. The window's Enter (Submit, or Next once
 *   solved) ran as well, so Enter on Submit counted two wrong tries and Enter on Undo or Reset submitted. A real Enter
 *   on a button is a keydown and then the button's click; the page dispatches both.
 * - The tokens odometer: a roll cut short (the total scrolled out of view mid-roll) shows the real total, never the
 *   figure it had reached.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-puzzle-odometer-"));
after(() => rmSync(out, { recursive: true, force: true }));

const src = (f: string) => JSON.stringify(path.join(ROOT, "src", f));
const ENTRY = `
window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Puzzle } from ${src("components/life/Puzzle.tsx")};
import { TokenSkyline } from ${src("components/TokenSkyline.tsx")};

try { localStorage.removeItem("life-level"); } catch {}
const mode = location.search.slice(1);
// Under --virtual-time-budget headless Chrome draws no frames after the load, so neither animation frames nor
// intersection callbacks would come: frames on a timer, and the page says what is in view.
const watched = [];
if (mode === "odometer") {
  window.requestAnimationFrame = (f) => setTimeout(() => f(performance.now()), 16);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
  window.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; this.els = []; watched.push(this); }
    observe(el) { this.els.push(el); }
    unobserve() {}
    disconnect() { this.els = []; }
  };
}
const view = (el, inView) => { for (const o of watched) for (const e of o.els) if (e === el) o.cb([{ target: e, isIntersecting: inView }], o); };
const root = createRoot(document.getElementById("app"));
flushSync(() => root.render(mode === "odometer" ? <TokenSkyline /> : <Puzzle onDone={() => {}} />));

const got = {};
const steps = [];
const step = (f, wait = 120) => steps.push([f, wait]);
const $ = (s) => document.querySelector(s);
const button = (words) => [...document.querySelectorAll(".life__bar button")].find((b) => b.textContent.trim().startsWith(words));
// a real Enter on a focused button: the keydown, then the button's own click
const enterOn = (el) => { el.focus(); el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); el.click(); };
const verdict = () => $(".life__verdict").textContent;

if (mode === "odometer") {
  const n = () => $(".tokens__n");
  // the total comes into view: the roll starts; 200ms later, mid-roll, it leaves
  step(() => { got.full = n().getAttribute("aria-label").replaceAll(",", ""); view(n(), true); }, 200);
  step(() => { got.mid = n().textContent.replaceAll(",", ""); view(n(), false); }, 2500);
  step(() => { got.after = n().textContent.replaceAll(",", ""); });
} else {
  step(() => { got.start = verdict(); enterOn(button("Undo")); enterOn(button("Reset")); });
  step(() => { got.undoReset = verdict(); enterOn(button("Submit")); });
  step(() => { got.submitted = verdict(); button("Reset").click(); });
  step(() => { got.afterSubmit = verdict(); document.body.focus(); document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); });
  step(() => { got.bodyEnter = verdict(); button("Reset").click(); });
  step(() => { got.afterBody = verdict(); });
}
let i = 0;
const next = () => {
  if (i < steps.length) { const [f, wait] = steps[i++]; f(); setTimeout(next, wait); }
  else document.getElementById("out").textContent = JSON.stringify(got);
};
setTimeout(next, 120);
`;

test("the Life puzzle's Enter on a focused button, and the odometer cut short, in a browser", async (t) => {
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
    define: { "process.env.NODE_ENV": '"production"' },
    build: { outDir: path.join(out, "dist"), emptyOutDir: true, minify: false, lib: { entry: path.join(out, "entry.jsx"), formats: ["iife"], name: "Harness", fileName: () => "harness.js", cssFileName: "harness" } },
  });
  const js = readFileSync(path.join(out, "dist/harness.js"), "utf8");
  const page = path.join(out, "page.html");
  writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);
  const run = (mode: string) => {
    let dom: string;
    try {
      dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,800", "--virtual-time-budget=20000", "--dump-dom", `${pathToFileURL(page).href}?${mode}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
    } catch (e) {
      t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
      return undefined;
    }
    const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
    assert.ok(text, `${mode}: the page printed nothing`);
    const got = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
    assert.equal(got.pageError, undefined, `${mode}: ${got.pageError}`);
    return got;
  };

  const puzzle = run("puzzle");
  if (!puzzle) return;
  assert.equal(puzzle.start, "Actions 0 · Wrong 0");
  // Enter on Undo and on Reset: their own clicks, no submit
  assert.equal(puzzle.undoReset, "Actions 0 · Wrong 0");
  // Enter on Submit with a wrong answer: one wrong try, not two
  assert.equal(puzzle.submitted, "Not that. Look again.");
  assert.equal(puzzle.afterSubmit, "Actions 0 · Wrong 1");
  // Enter with no control focused still submits
  assert.equal(puzzle.bodyEnter, "Not that. Look again.");
  assert.equal(puzzle.afterBody, "Actions 0 · Wrong 2");

  const odo = run("odometer");
  if (!odo) return;
  assert.match(odo.full, /^\d{9,}$/);
  // the roll was under way when the total left the screen ...
  assert.notEqual(odo.mid, odo.full, "the roll had started and not finished when the total was scrolled away");
  // ... and the total shows the real figure, not where the roll stopped
  assert.equal(odo.after, odo.full);
});
