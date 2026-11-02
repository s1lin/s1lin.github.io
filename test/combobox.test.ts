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
 * Combobox: on a server, the box is a combobox wired to a hidden listbox and to the Field around it, its words from
 * S1Words, a chosen item's words in the box. In a real browser, with React running: typing opens the list on its first
 * option, the arrows move and wrap, Enter chooses, Esc closes and a second puts the chosen words back, leaving the box
 * puts them back, a click chooses and keeps focus in the box, × clears, the chevron opens, nothing matching says so;
 * the list in the top layer under the box and at least as wide, above it at the window's foot; the option under the
 * arrows in reverse, the chosen one with a tick; Input's heights; Esc inside a Dialog. Vite bundles a small page from
 * src/ui/ as an app would; headless Chrome runs it and prints what it found. The browser half is skipped where there
 * is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-combobox-"));
after(() => rmSync(out, { recursive: true, force: true }));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");

/**
 * The parts, bundled for node as an app's server would import them (their stylesheets left out), with React and its
 * server renderer imported after the build, which sets NODE_ENV: one React, in one mode.
 */
async function serverParts() {
  writeFileSync(path.join(out, "server.ts"), ["combobox", "field", "words"].map((p) => `export * from ${JSON.stringify(path.join(ROOT, `src/ui/${p}.tsx`))};`).join("\n"));
  await build({
    configFile: false,
    root: out,
    logLevel: "silent",
    plugins: [{ name: "no-css", enforce: "pre", load: (id) => (id.endsWith(".css") ? "" : null) }, react()],
    build: { ssr: path.join(out, "server.ts"), outDir: path.join(out, "ssr"), emptyOutDir: true, rollupOptions: { output: { format: "es", entryFileNames: "parts.mjs" } } },
  });
  const parts = await import(pathToFileURL(path.join(out, "ssr/parts.mjs")).href);
  const { createElement } = await import("react");
  const { renderToString } = await import("react-dom/server");
  return { ...parts, h: createElement, renderToString };
}

test("Combobox on a server: a combobox wired to a hidden listbox and to its Field, the chosen item's words in the box, the buttons named from S1Words", async () => {
  const { Combobox, Field, S1Words, h, renderToString } = await serverParts();
  const cities = [{ id: "sh", name: "Shanghai" }, { id: "tpe", name: "Taipei" }];
  const props = { groups: [{ key: "all", label: "Cities", items: cities }], itemText: (c: { name: string }) => c.name, itemKey: (c: { id: string }) => c.id, onValueChange() {}, placeholder: "e.g. Taipei" };
  const empty = renderToString(h(Field, { label: "City", hint: "Type a city.", id: "city" }, h(Combobox, { ...props, value: null })));
  const input = empty.match(/<input[^>]*>/)![0];
  assert.match(empty, /<label[^>]*for="city"/);
  assert.match(input, /\sid="city"/);
  assert.match(input, /role="combobox"/);
  assert.match(input, /aria-autocomplete="list"/);
  assert.match(input, /aria-expanded="false"/);
  assert.match(input, /aria-describedby="city-hint"/);
  assert.match(input, /value=""/);
  const listId = input.match(/aria-controls="([^"]+)"/)![1];
  assert.match(empty, new RegExp(`<div[^>]*popover="manual"[^>]*hidden=""[^>]*><div id="${listId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" role="listbox"`));
  assert.doesNotMatch(empty, /role="option"/, "the options wait until the list opens");
  assert.doesNotMatch(empty, /aria-label="Clear"/, "nothing to clear");
  assert.match(empty, /<button type="button" tabindex="-1" class="s1-combobox__button" aria-label="Show options" aria-expanded="false"/);
  assert.match(empty, /class="s1-input s1-input--md s1-combobox"/);
  // chosen: its words in the box, a clear button; in error, and small; the words in Chinese from S1Words
  const chosen = renderToString(h(S1Words, { words: { clear: "清除", showOptions: "显示选项" } }, h(Combobox, { ...props, value: cities[1], invalid: true, size: "sm", "aria-label": "城市" })));
  assert.match(chosen.match(/<input[^>]*>/)![0], /value="Taipei"/);
  assert.match(chosen.match(/<input[^>]*>/)![0], /aria-invalid="true"/);
  assert.match(chosen, /class="s1-input s1-input--sm s1-combobox" data-invalid=""/);
  assert.match(chosen, /aria-label="清除"/);
  assert.match(chosen, /aria-label="显示选项"/);
});

const ENTRY = `
import { useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Combobox } from ${JSON.stringify(path.join(ROOT, "src/ui/combobox.tsx"))};
import { Dialog } from ${JSON.stringify(path.join(ROOT, "src/ui/dialog.tsx"))};

const CITIES = [
  { id: "sh", name: "Shanghai", region: "China" },
  { id: "sz", name: "Suzhou", region: "China" },
  { id: "tpe", name: "Taipei", region: "Taiwan" },
  { id: "sg", name: "Singapore", region: "Singapore" },
];
const log = [];
function City({ id, size }) {
  const [city, setCity] = useState(null);
  const [text, setText] = useState("");
  const q = city && text === city.name ? "" : text.trim().toLowerCase();
  const groups = ["China", "Taiwan", "Singapore"].map((r) => ({ key: r, label: r, items: CITIES.filter((c) => c.region === r && c.name.toLowerCase().includes(q)) })).filter((g) => g.items.length);
  return (
    <Combobox id={id} aria-label="City" size={size} groups={groups} value={city} onValueChange={(c) => { log.push(id + ":" + (c ? c.id : null)); setCity(c); }} onInputChange={(t) => { log.push(id + ":text:" + t); setText(t); }}
      itemText={(c) => c.name} itemKey={(c) => c.id} renderItem={(c) => <>{c.name} <small>{c.region}</small></>} empty="No matching city." />
  );
}
function InDialog() {
  const [open, setOpen] = useState(true);
  return <Dialog open={open} onClose={() => setOpen(false)} title="Where"><City id="dlg" /></Dialog>;
}
const root = createRoot(document.getElementById("app"));
const mode = location.search.slice(1);
flushSync(() =>
  root.render(
    mode === "dialog" ? <InDialog /> : (
    <>
      <div style={{ position: "absolute", top: 40, left: 40, width: 320 }}><City id="a" /></div>
      <div style={{ position: "absolute", top: 40, left: 420, width: 240 }}><City id="small" size="sm" /></div>
      <div style={{ position: "absolute", bottom: 10, left: 40, width: 320 }}><City id="foot" /></div>
      <span id="else" tabIndex={0}>else</span>
    </>),
  ),
);

const got = { log };
const $ = (s) => document.querySelector(s);
const box = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) }; };
const pop = (id) => document.getElementById($("#" + id).getAttribute("aria-controls")).parentElement;
const typeIn = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); };
const key = (el, k) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const state = (id) => {
  const i = $("#" + id);
  const act = i.getAttribute("aria-activedescendant");
  return { value: i.value, expanded: i.getAttribute("aria-expanded"), active: act ? document.getElementById(act).getAttribute("aria-label") : null, focus: document.activeElement === i };
};
const steps = [];
const step = (f) => steps.push(f);

if (mode === "dialog") {
  step(() => { $("#dlg").focus(); key($("#dlg"), "ArrowDown"); });
  step(() => { got.dlgOpen = $("#dlg").getAttribute("aria-expanded"); key($("#dlg"), "Escape"); });
  step(() => { got.afterEsc = { list: $("#dlg").getAttribute("aria-expanded"), dialog: document.querySelector("dialog").open }; });
} else {
  step(() => {
    got.heights = { md: box($("#a").parentElement).height, sm: box($("#small").parentElement).height };
    $("#a").focus();
    typeIn($("#a"), "s");
  });
  step(() => {
    const p = pop("a");
    const opts = [...p.querySelectorAll("[role=option]")];
    const groups = [...p.querySelectorAll("[role=group]")];
    got.typed = { ...state("a"), top: p.matches(":popover-open"), options: opts.map((o) => o.getAttribute("aria-label")), groups: groups.map((g) => document.getElementById(g.getAttribute("aria-labelledby")).textContent), box: box($("#a").parentElement), list: box(p) };
    const a = opts[0];
    const s = getComputedStyle(a);
    got.typed.activeLook = [s.backgroundColor, s.color, getComputedStyle(p).color, getComputedStyle(p).backgroundColor];
    key($("#a"), "ArrowDown");
  });
  step(() => {
    got.down = state("a").active;
    key($("#a"), "ArrowDown");
    key($("#a"), "ArrowDown");
  });
  step(() => {
    got.wrap = state("a").active;
    key($("#a"), "ArrowUp");
  });
  step(() => {
    got.up = state("a").active;
    key($("#a"), "Enter");
  });
  step(() => {
    got.entered = state("a");
    key($("#a"), "ArrowDown");
  });
  step(() => {
    const p = pop("a");
    const chosen = p.querySelector("[aria-selected=true]");
    got.reopened = { ...state("a"), chosen: chosen && chosen.getAttribute("aria-label"), tick: !!(chosen && chosen.querySelector(".s1-combobox__tick")), weight: chosen && getComputedStyle(chosen).fontWeight };
    key($("#a"), "Escape");
  });
  step(() => {
    got.esc1 = state("a");
    typeIn($("#a"), "zzz");
  });
  step(() => {
    const p = pop("a");
    got.nothing = { ...state("a"), empty: p.querySelector("[role=status]")?.textContent, options: p.querySelectorAll("[role=option]").length };
    key($("#a"), "Escape");
  });
  step(() => {
    key($("#a"), "Escape");
  });
  step(() => {
    got.esc2 = state("a");
    typeIn($("#a"), "tai");
  });
  step(() => {
    $("#else").focus();
  });
  step(() => {
    got.blurred = state("a");
    // a click on an option: chosen, focus kept in the box
    $("#a").focus();
    typeIn($("#a"), "sing");
  });
  step(() => {
    const o = pop("a").querySelector("[role=option]");
    o.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    o.click();
  });
  step(() => {
    got.clicked = state("a");
    $("#a").parentElement.querySelector('[aria-label="Clear"]').click();
  });
  step(() => {
    got.cleared = { ...state("a"), clear: !!$("#a").parentElement.querySelector('[aria-label="Clear"]') };
    $("#a").parentElement.querySelector('[aria-label="Show options"]').click();
  });
  step(() => {
    got.shown = { ...state("a"), options: pop("a").querySelectorAll("[role=option]").length };
    key($("#a"), "Tab");
  });
  step(() => {
    got.tabbed = state("a").expanded;
    $("#foot").focus();
    key($("#foot"), "ArrowDown");
  });
  step(() => {
    got.foot = { box: box($("#foot").parentElement), list: box(pop("foot")), room: pop("foot").style.getPropertyValue("--s1-combobox-room") };
  });
}

let i = 0;
const next = () => {
  if (i < steps.length) { steps[i++](); setTimeout(next, 120); }
  else document.getElementById("out").textContent = JSON.stringify(got);
};
setTimeout(next, 120);
`;

test("Combobox in a browser: typing, the arrows, Enter, Esc twice, leaving the box, a click, clear and open; the list's place and look; heights; inside a Dialog", async (t) => {
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
      dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,700", "--virtual-time-budget=15000", "--dump-dom", `${pathToFileURL(page).href}?${mode}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
    } catch (e) {
      return t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
    }
    const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
    assert.ok(text, `${mode}: the page printed nothing`);
    return JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  };

  const got = run("page");
  if (!got) return;
  // Input's heights
  assert.deepEqual(got.heights, { md: 40, sm: 30 });
  // typing: the list opens on its first option, in its groups, in the top layer, under the box and as wide
  assert.deepEqual([got.typed.expanded, got.typed.active, got.typed.focus, got.typed.top], ["true", "Shanghai", true, true]);
  assert.deepEqual(got.typed.options, ["Shanghai", "Suzhou", "Singapore"]);
  assert.deepEqual(got.typed.groups, ["China", "Singapore"]);
  assert.equal(got.typed.list.top, got.typed.box.bottom + 4);
  assert.equal(got.typed.list.left, got.typed.box.left);
  assert.ok(got.typed.list.width >= got.typed.box.width);
  // the option under the arrows in reverse
  assert.equal(got.typed.activeLook[0], got.typed.activeLook[2]);
  assert.equal(got.typed.activeLook[1], got.typed.activeLook[3]);
  // the arrows move and wrap; Enter chooses: the words in the box, the list shut
  assert.equal(got.down, "Suzhou");
  assert.equal(got.wrap, "Shanghai");
  assert.equal(got.up, "Singapore");
  assert.deepEqual(got.entered, { value: "Singapore", expanded: "false", active: null, focus: true });
  assert.ok(got.log.includes("a:sg") && got.log.includes("a:text:Singapore"));
  // ↓ opens it on the chosen option, ticked and heavier
  assert.deepEqual([got.reopened.expanded, got.reopened.active, got.reopened.chosen, got.reopened.tick, got.reopened.weight], ["true", "Singapore", "Singapore", true, "600"]);
  // Esc closes; nothing matching says so; a second Esc puts the chosen words back
  assert.deepEqual(got.esc1, { value: "Singapore", expanded: "false", active: null, focus: true });
  assert.deepEqual([got.nothing.expanded, got.nothing.empty, got.nothing.options], ["true", "No matching city.", 0]);
  assert.equal(got.esc2.value, "Singapore");
  // leaving the box puts the chosen words back
  assert.deepEqual([got.blurred.value, got.blurred.expanded], ["Singapore", "false"]);
  // a click chooses and keeps focus in the box
  assert.deepEqual(got.clicked, { value: "Singapore", expanded: "false", active: null, focus: true });
  // × clears: no value, no words, no clear button, focus in the box
  assert.deepEqual(got.cleared, { value: "", expanded: "false", active: null, focus: true, clear: false });
  assert.ok(got.log.includes("a:null") && got.log.includes("a:text:"));
  // the chevron opens it with every option; Tab closes it
  assert.deepEqual([got.shown.expanded, got.shown.options], ["true", 4]);
  assert.equal(got.tabbed, "false");
  // at the window's foot: above the box, capped by its room
  assert.equal(got.foot.list.bottom, got.foot.box.top - 4);
  assert.match(got.foot.room, /^\d+px$/);

  // in a Dialog: Esc closes the list and keeps the dialog open
  const dialog = run("dialog");
  if (!dialog) return;
  assert.equal(dialog.dlgOpen, "true");
  assert.deepEqual(dialog.afterEsc, { list: "false", dialog: true });
});
