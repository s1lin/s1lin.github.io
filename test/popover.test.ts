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
 * Popover: on a server, a closed one is in the HTML, wired to its trigger and hidden, its content not yet mounted.
 * In a real browser, with React running: it opens in the top layer below its trigger (lined up with its start, its
 * middle or its end), above it at the foot of the window, never taller than its room, kept 8px inside the screen;
 * focus goes into it and comes back on Esc; a press outside closes it and leaves focus be; Tab past its end closes it;
 * Esc inside a Dialog closes the popover and keeps the dialog; the look is Menu's list, by day and at night. Vite
 * bundles a small page from src/ui/ as an app would; headless Chrome runs it and prints what it found. The browser
 * half is skipped where there is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-popover-"));
after(() => rmSync(out, { recursive: true, force: true }));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");

/**
 * The part, bundled for node as an app's server would import it (its stylesheets left out), with React and its server
 * renderer imported after the build, which sets NODE_ENV: one React, in one mode.
 */
async function serverPart() {
  await build({
    configFile: false,
    root: out,
    logLevel: "silent",
    plugins: [{ name: "no-css", enforce: "pre", load: (id) => (id.endsWith(".css") ? "" : null) }, react()],
    build: { ssr: path.join(ROOT, "src/ui/popover.tsx"), outDir: path.join(out, "ssr"), emptyOutDir: true, rollupOptions: { output: { format: "es", entryFileNames: "popover.mjs" } } },
  });
  const { Popover } = await import(pathToFileURL(path.join(out, "ssr/popover.mjs")).href);
  const { createElement } = await import("react");
  const { renderToString } = await import("react-dom/server");
  return { Popover, h: createElement, renderToString };
}

test("Popover on a server: closed, it is in the HTML wired to its trigger and hidden, its content not mounted; open at first, mounted", async () => {
  const { Popover, h, renderToString } = await serverPart();
  const closed = renderToString(h(Popover, { trigger: h("button", { type: "button" }, "Keys"), label: "Keyboard help" }, h("p", null, "Move")));
  const button = closed.match(/<button[^>]*>/)![0];
  const panel = closed.match(/<div[^>]*role="dialog"[^>]*>/)![0];
  assert.match(button, /aria-haspopup="dialog"/);
  assert.match(button, /aria-expanded="false"/);
  assert.equal(button.match(/aria-controls="([^"]+)"/)![1], panel.match(/\sid="([^"]+)"/)![1]);
  assert.match(panel, /aria-label="Keyboard help"/);
  assert.match(panel, /popover="manual"/);
  assert.match(panel, /\shidden=""/);
  assert.match(panel, /class="s1-popover"/);
  assert.doesNotMatch(closed, /Move/, "the content waits until it opens");
  // the trigger keeps an id of its own; without one it is given one
  assert.match(renderToString(h(Popover, { trigger: h("button", { id: "own" }, "x") })), /<button id="own"/);
  assert.match(button, /\sid="[^"]+-trigger"/);
  const open = renderToString(h(Popover, { trigger: h("button", null, "Keys"), defaultOpen: true, className: "mine" }, h("p", null, "Move")));
  assert.match(open, /aria-expanded="true"/);
  assert.match(open, /class="s1-popover mine"/);
  assert.match(open, /<p>Move<\/p>/);
  assert.doesNotMatch(open.match(/<div[^>]*role="dialog"[^>]*>/)![0], /hidden/);
});

const ENTRY = `
import { useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Popover } from ${JSON.stringify(path.join(ROOT, "src/ui/popover.tsx"))};
import { Dialog } from ${JSON.stringify(path.join(ROOT, "src/ui/dialog.tsx"))};

const said = [];
function Kept() {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={(v) => { said.push(v); setOpen(v); }} trigger={<button id="kept">Range</button>} label="Range">
      <button id="choose" onClick={() => setOpen(false)}>7 days</button>
    </Popover>
  );
}
function InDialog() {
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onClose={() => setOpen(false)} title="Settings">
      <Popover trigger={<button id="dlg-trigger">Help</button>} label="Help"><p>Words</p></Popover>
    </Dialog>
  );
}
const tall = Array.from({ length: 40 }, (_, i) => <p key={i} style={{ margin: 0 }}>Line {i}</p>);
const root = createRoot(document.getElementById("app"));
const mode = location.search.slice(1);
flushSync(() =>
  root.render(
    mode === "dialog" ? <InDialog /> : (
    <>
      <div style={{ position: "absolute", top: 40, left: 400 }}>
        <Popover trigger={<button id="start" style={{ width: 120, height: 30 }}>Start</button>} align="start" label="Start"><p style={{ width: 200, margin: 0 }}>Words</p><button id="inner">Inner</button></Popover>
        <span id="after" tabIndex={0}>after</span>
      </div>
      <div style={{ position: "absolute", top: 40, left: 700 }}>
        <Popover trigger={<button id="mid" style={{ width: 120, height: 30 }}>Middle</button>} label="Middle"><p style={{ width: 200, margin: 0 }}>Words</p></Popover>
      </div>
      <div style={{ position: "absolute", top: 40, right: 2 }}>
        <Popover trigger={<button id="end" style={{ width: 60, height: 30 }}>End</button>} align="end" label="End"><p style={{ width: 300, margin: 0 }}>Words</p></Popover>
      </div>
      <div style={{ position: "absolute", bottom: 20, left: 40 }}>
        <Popover trigger={<button id="foot" style={{ width: 120, height: 30 }}>Foot</button>} label="Foot"><p style={{ width: 200, margin: 0 }}>Words</p></Popover>
      </div>
      <div style={{ position: "absolute", top: 170, left: 40 }}>
        <Popover trigger={<button id="tall">Tall</button>} label="Tall">{tall}</Popover>
      </div>
      <div style={{ position: "absolute", top: 120, left: 40 }}><Kept /></div>
      <div id="night" data-theme="dark" style={{ position: "absolute", top: 200, left: 400 }}>
        <Popover trigger={<button id="dark">Night</button>} label="Night"><p style={{ margin: 0 }}>Words</p></Popover>
      </div>
    </>),
  ),
);

const got = { said };
const $ = (s) => document.querySelector(s);
const box = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) }; };
const panelOf = (id) => document.getElementById($("#" + id).getAttribute("aria-controls"));
const look = (el) => { const s = getComputedStyle(el); return { border: [s.borderTopWidth, s.borderTopStyle, s.borderTopColor], radius: s.borderTopLeftRadius, shadow: s.boxShadow, bg: s.backgroundColor, color: s.color, padding: s.paddingTop, room: el.style.getPropertyValue("--s1-popover-room"), maxHeight: s.maxHeight, overflow: s.overflowY }; };
const key = (el, k, opts = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...opts }));
const steps = [];
const step = (f) => steps.push(f);

if (mode === "dialog") {
  step(() => { $("#dlg-trigger").click(); });
  step(() => {
    got.dlgOpen = $("#dlg-trigger").getAttribute("aria-expanded");
    key(document.activeElement, "Escape");
  });
  step(() => {
    got.afterEsc = { popover: $("#dlg-trigger").getAttribute("aria-expanded"), dialog: document.querySelector("dialog").open, focus: document.activeElement.id };
  });
} else {
  step(() => {
    got.paper = getComputedStyle(document.body).getPropertyValue("--s1-paper").trim();
    got.closed = { expanded: $("#start").getAttribute("aria-expanded"), hidden: panelOf("start").hidden, display: getComputedStyle(panelOf("start")).display };
    $("#start").click();
  });
  step(() => {
    const p = panelOf("start");
    got.start = { expanded: $("#start").getAttribute("aria-expanded"), top: p.matches(":popover-open"), focus: document.activeElement === p, trigger: box($("#start")), panel: box(p), look: look(p), side: p.dataset.side };
    key(p, "Escape");
  });
  step(() => {
    got.esc = { expanded: $("#start").getAttribute("aria-expanded"), focus: document.activeElement.id, open: panelOf("start").matches(":popover-open") };
    $("#mid").click();
  });
  step(() => {
    got.mid = { trigger: box($("#mid")), panel: box(panelOf("mid")) };
    // a press outside: closed, and focus not taken back to the trigger
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
  step(() => {
    got.outside = { expanded: $("#mid").getAttribute("aria-expanded"), focus: document.activeElement.id };
    $("#end").click();
  });
  step(() => {
    got.end = { trigger: box($("#end")), panel: box(panelOf("end")), vw: document.documentElement.clientWidth };
    $("#end").click();
  });
  step(() => {
    got.toggled = $("#end").getAttribute("aria-expanded");
    $("#foot").click();
  });
  step(() => {
    got.foot = { trigger: box($("#foot")), panel: box(panelOf("foot")), side: panelOf("foot").dataset.side };
    $("#foot").click();
    $("#tall").click();
  });
  step(() => {
    const p = panelOf("tall");
    got.tall = { trigger: box($("#tall")), panel: box(p), vh: window.innerHeight, look: look(p), scrolls: p.scrollHeight > p.clientHeight };
    $("#tall").click();
    $("#kept").click();
  });
  step(() => {
    got.kept = { expanded: $("#kept").getAttribute("aria-expanded") };
    $("#choose").focus();
    $("#choose").click();
  });
  step(() => {
    got.chosen = { expanded: $("#kept").getAttribute("aria-expanded"), focus: document.activeElement.id };
    $("#dark").click();
  });
  step(() => {
    got.night = { look: look(panelOf("dark")), paper: getComputedStyle($("#night")).getPropertyValue("--s1-paper").trim() };
    $("#dark").click();
    // Tab past the panel's end: focus leaves for the next thing on the page, and the panel closes
    $("#start").click();
  });
  step(() => {
    $("#inner").focus();
    $("#after").focus();
  });
  step(() => {
    got.tabbedAway = { expanded: $("#start").getAttribute("aria-expanded"), focus: document.activeElement.id };
  });
}

let i = 0;
const next = () => {
  if (i < steps.length) { steps[i++](); setTimeout(next, 120); }
  else document.getElementById("out").textContent = JSON.stringify(got);
};
setTimeout(next, 120);
`;

test("Popover in a browser: the top layer, placed on its side or the other, lined up, kept on the screen, capped by its room; focus in and back; Esc, a press outside, Tab away; inside a Dialog; Menu's look by day and at night", async (t) => {
  const bin = chrome();
  if (!bin) return t.skip("no Chrome here: set CHROME to run it");
  writeFileSync(path.join(out, "entry.jsx"), ENTRY);
  await build({
    configFile: false,
    root: out,
    logLevel: "silent",
    plugins: [react()],
    define: { "process.env.NODE_ENV": '"production"' },
    build: { outDir: path.join(out, "dist"), emptyOutDir: true, minify: false, lib: { entry: path.join(out, "entry.jsx"), formats: ["iife"], name: "Harness", fileName: () => "harness.js", cssFileName: "harness" } },
  });
  const js = readFileSync(path.join(out, "dist/harness.js"), "utf8");
  const css = readFileSync(path.join(out, "dist", readdirSync(path.join(out, "dist")).find((f) => f.endsWith(".css"))!), "utf8");
  const page = path.join(out, "page.html");
  writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css} body { margin: 0; background: var(--s1-paper); color: var(--s1-ink); }</style></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);

  const run = (mode: string) => {
    let dom: string;
    try {
      dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,700", "--virtual-time-budget=10000", "--dump-dom", `${pathToFileURL(page).href}?${mode}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
    } catch (e) {
      return t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
    }
    const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
    assert.ok(text, `${mode}: the page printed nothing`);
    return JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  };

  const got = run("page");
  if (!got) return;
  // closed: hidden, out of the way
  assert.deepEqual(got.closed, { expanded: "false", hidden: true, display: "none" });
  // open: in the top layer, focus on the panel (nothing in it asks for it), 6px under the trigger, lined up with its start
  assert.equal(got.start.expanded, "true");
  assert.equal(got.start.top, true, "the panel is in the top layer (:popover-open)");
  assert.equal(got.start.focus, true);
  assert.equal(got.start.side, "bottom");
  assert.equal(got.start.panel.top, got.start.trigger.bottom + 6);
  assert.equal(got.start.panel.left, got.start.trigger.left);
  // the look: Menu's list, a 1px rule in the strong hairline, square, the offset plate behind, paper, 12px in
  assert.deepEqual(got.start.look.border.slice(0, 2), ["1px", "solid"]);
  assert.equal(got.start.look.radius, "0px");
  assert.match(got.start.look.shadow, /6px 6px 0px -1px.*6px 6px 0px 0px/);
  assert.equal(got.start.look.padding, "12px");
  assert.match(got.start.look.room, /^\d+px$/);
  // Esc: closed, focus back on the trigger, out of the top layer
  assert.deepEqual(got.esc, { expanded: "false", focus: "start", open: false });
  // the middle: centred under its trigger
  assert.ok(Math.abs(got.mid.panel.left + got.mid.panel.width / 2 - (got.mid.trigger.left + got.mid.trigger.width / 2)) <= 1, "centred under the trigger");
  // a press outside: closed, and focus left where the press put it (not the trigger)
  assert.equal(got.outside.expanded, "false");
  assert.notEqual(got.outside.focus, "mid");
  // the end: its right edge on the trigger's, and kept 8px inside the screen
  assert.ok(got.end.panel.right <= got.end.vw - 8, `kept inside the screen (${got.end.panel.right} of ${got.end.vw})`);
  assert.ok(got.end.panel.right <= got.end.trigger.right + 1);
  // the trigger closes it again
  assert.equal(got.toggled, "false");
  // at the foot of the window: above its trigger
  assert.equal(got.foot.side, "top");
  assert.equal(got.foot.panel.bottom, got.foot.trigger.top - 6);
  // taller than its room on either side: on its own side, the one with more room, capped by --s1-popover-room, scrolling inside
  assert.equal(got.tall.look.room, `${got.tall.vh - got.tall.trigger.bottom - 6 - 8}px`);
  assert.equal(got.tall.look.maxHeight, got.tall.look.room);
  assert.ok(got.tall.scrolls, "the long panel scrolls inside");
  assert.ok(got.tall.panel.bottom <= got.tall.vh - 8);
  // kept by the app: it asked to open, and a choice that closes it gives focus back to the trigger
  assert.equal(got.kept.expanded, "true");
  assert.deepEqual(got.chosen, { expanded: "false", focus: "kept" });
  assert.deepEqual(got.said, [true]);
  // at night: the night's paper and ink, from the element around it
  assert.equal(got.night.paper, "#0f0f0f");
  assert.equal(got.night.look.bg, "rgb(15, 15, 15)");
  assert.equal(got.night.look.color, "rgb(237, 237, 237)");
  // focus gone elsewhere on the page: closed, focus where it went
  assert.deepEqual(got.tabbedAway, { expanded: "false", focus: "after" });

  // in a Dialog: Esc closes the popover and keeps the dialog open, focus back on the popover's trigger
  const dialog = run("dialog");
  if (!dialog) return;
  assert.equal(dialog.dlgOpen, "true");
  assert.deepEqual(dialog.afterEsc, { popover: "false", dialog: true, focus: "dlg-trigger" });
});
