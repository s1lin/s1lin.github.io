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
 * S1Words, a chosen item's words in the box, a status in the box from the start; words or marks before and after the
 * text, every other prop on the <input>, and no open button for a search. In a real browser, with React running: typing
 * opens the list on its first option, the arrows move and wrap, Enter chooses, Esc closes and a second puts the chosen
 * words back, leaving the box puts them back, a click chooses and keeps focus in the box, × clears, the chevron opens,
 * nothing matching says so in the status that was there all along; a search (clearOnChoose) empties after a choice;
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
  // the status a screen reader hears when nothing matches: in the box from the start, empty, before the input
  assert.match(empty, /class="s1-input s1-input--md s1-combobox"><span class="s1-combobox__status" role="status"><\/span><input /);
  assert.equal(empty.match(/role="status"/g)?.length, 1, "one status, in the box, not in the list");
  // chosen: its words in the box, a clear button; in error, and small; the words in Chinese from S1Words
  const chosen = renderToString(h(S1Words, { words: { clear: "清除", showOptions: "显示选项" } }, h(Combobox, { ...props, value: cities[1], invalid: true, size: "sm", "aria-label": "城市" })));
  assert.match(chosen.match(/<input[^>]*>/)![0], /value="Taipei"/);
  assert.match(chosen.match(/<input[^>]*>/)![0], /aria-invalid="true"/);
  assert.match(chosen, /class="s1-input s1-input--sm s1-combobox" data-invalid=""/);
  // the line: the same combobox with one more class, the box's own classes kept
  const line = renderToString(h(Combobox, { ...props, value: null, variant: "line", "aria-label": "Search" }));
  assert.match(line, /class="s1-input s1-input--md s1-combobox s1-combobox--line"/);
  assert.match(line.match(/<input[^>]*>/)![0], /role="combobox"/);
  assert.doesNotMatch(empty, /s1-combobox--line/, "the box is the default");
  assert.match(chosen, /aria-label="清除"/);
  assert.match(chosen, /aria-label="显示选项"/);
  // a search: a mark before the text, a key's hint after it, inside the box; no open button; every other prop on the
  // <input>; words before and after are read with the box, a mark hidden from screen readers is not
  const search = renderToString(
    h(Combobox, {
      ...props,
      value: null,
      clearOnChoose: true,
      showButton: false,
      "aria-label": "Search",
      "aria-keyshortcuts": "/",
      enterKeyHint: "go",
      name: "q",
      required: true,
      "aria-describedby": "help",
      prefix: h("svg", { "aria-hidden": "true", class: "glass" }),
      suffix: h("kbd", { "aria-hidden": "true" }, "/"),
    }),
  );
  const box = search.match(/<span class="s1-input s1-input--md s1-combobox">[\s\S]*?<\/span><div/)![0];
  assert.match(box, /<span class="s1-input__affix"><svg aria-hidden="true" class="glass"><\/svg><\/span><input /, "the mark before the text");
  assert.match(box, /<input [^>]*><span class="s1-input__affix s1-input__affix--end"><kbd aria-hidden="true">\/<\/kbd><\/span><\/span><div$/, "the hint after it, last in the box");
  assert.doesNotMatch(search, /Show options/, "no open button");
  const searchInput = search.match(/<input[^>]*>/)![0];
  for (const attr of [/aria-keyshortcuts="\/"/, /enterKeyHint="go"|enterkeyhint="go"/, /name="q"/, /required=""/, /aria-describedby="help"/, /role="combobox"/, /autoComplete="off"|autocomplete="off"/]) assert.match(searchInput, attr);
  const worded = renderToString(h(Combobox, { ...props, value: null, "aria-label": "Price", prefix: "US$", suffix: "per day", "aria-describedby": "help" }));
  const ids = [...worded.matchAll(/class="s1-input__affix[^"]*" id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, 2);
  assert.match(worded.match(/<input[^>]*>/)![0], new RegExp(`aria-describedby="${ids[0]} ${ids[1]} help"`), "words before and after are read with the box");
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
function City({ id, size, variant }) {
  const [city, setCity] = useState(null);
  const [text, setText] = useState("");
  const q = city && text === city.name ? "" : text.trim().toLowerCase();
  const groups = ["China", "Taiwan", "Singapore"].map((r) => ({ key: r, label: r, items: CITIES.filter((c) => c.region === r && c.name.toLowerCase().includes(q)) })).filter((g) => g.items.length);
  return (
    <Combobox id={id} aria-label="City" size={size} variant={variant} groups={groups} value={city} onValueChange={(c) => { log.push(id + ":" + (c ? c.id : null)); setCity(c); }} onInputChange={(t) => { log.push(id + ":text:" + t); setText(t); }}
      itemText={(c) => c.name} itemKey={(c) => c.id} renderItem={(c) => <>{c.name} <small>{c.region}</small></>} empty="No matching city." />
  );
}
// a search that goes somewhere: the box empties after a choice, no open button, a mark before and a hint after
function Search() {
  const [text, setText] = useState("");
  const q = text.trim().toLowerCase();
  const items = CITIES.filter((c) => c.name.toLowerCase().includes(q));
  const groups = q && items.length ? [{ key: "all", label: "Cities", items }] : [];
  return (
    <Combobox id="go" aria-label="Go to a city" groups={groups} value={null} clearOnChoose showButton={false}
      onValueChange={(c) => log.push("go:" + (c ? c.id : null))} onInputChange={(t) => { log.push("go:text:" + t); setText(t); }}
      itemText={(c) => c.name} itemKey={(c) => c.id} empty={q ? "Nothing matches" : undefined}
      prefix={<svg className="glass" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" />} suffix={<kbd aria-hidden="true">/</kbd>} />
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
      <div style={{ position: "absolute", top: 40, left: 720, width: 320 }}><Search /></div>
      <div style={{ position: "absolute", top: 120, left: 40, width: 320 }}><City id="line" variant="line" /></div>
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
  return { value: i.value, expanded: i.getAttribute("aria-expanded"), active: act ? document.getElementById(act).getAttribute("aria-label") ?? document.getElementById(act).textContent : null, focus: document.activeElement === i };
};
const steps = [];
const step = (f) => steps.push(f);
const statusOf = (id) => $("#" + id).parentElement.querySelector("[role=status]");
const firstStatus = mode === "dialog" ? null : statusOf("a");

if (mode === "dialog") {
  step(() => { $("#dlg").focus(); key($("#dlg"), "ArrowDown"); });
  step(() => { got.dlgOpen = $("#dlg").getAttribute("aria-expanded"); key($("#dlg"), "Escape"); });
  step(() => { got.afterEsc = { list: $("#dlg").getAttribute("aria-expanded"), dialog: document.querySelector("dialog").open }; });
} else {
  step(() => {
    got.heights = { md: box($("#a").parentElement).height, sm: box($("#small").parentElement).height };
    const lineBox = () => $("#line").parentElement;
    const look = () => { const c = getComputedStyle(lineBox()); return { top: c.borderTopWidth, side: c.borderLeftWidth + "/" + c.borderRightWidth, bottom: c.borderBottomWidth, style: c.borderBottomStyle, bg: c.backgroundColor, height: Math.round(lineBox().getBoundingClientRect().height), size: getComputedStyle($("#line")).fontSize, shadow: c.boxShadow, outline: c.outlineStyle, color: c.borderBottomColor }; };
    got.line = { rest: look() };
    $("#line").focus();
    got.line.focus = look();
    const ink = getComputedStyle(document.documentElement).getPropertyValue("--s1-ink").trim();
    got.line.inkShadow = got.line.focus.shadow !== "none" && got.line.focus.shadow.includes(getComputedStyle(lineBox()).borderBottomColor);
    typeIn($("#line"), "s");
    key($("#line"), "ArrowDown");
    got.line.list = { expanded: $("#line").getAttribute("aria-expanded"), top: pop("line").matches(":popover-open"), under: Math.round(pop("line").getBoundingClientRect().top) - Math.round(lineBox().getBoundingClientRect().bottom) };
    key($("#line"), "Escape");
    key($("#line"), "Escape");
    $("#line").blur();
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
    got.nothing = { ...state("a"), empty: statusOf("a").textContent, same: statusOf("a") === firstStatus, shown: p.querySelector(".s1-combobox__empty")?.textContent, hidden: p.querySelector(".s1-combobox__empty")?.getAttribute("aria-hidden"), inList: p.querySelectorAll("[role=status]").length, options: p.querySelectorAll("[role=option]").length };
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
    // a box emptied from the keyboard and left is cleared: the keyboard's way to choose nothing
    $("#a").focus();
    typeIn($("#a"), "sing");
  });
  step(() => {
    key($("#a"), "Enter");
  });
  step(() => {
    got.rechosen = state("a").value;
    typeIn($("#a"), "");
  });
  step(() => {
    got.logAt = log.length;
    $("#else").focus();
  });
  step(() => {
    got.emptied = { ...state("a"), said: log.slice(got.logAt), status: statusOf("a").textContent };
    // the search: no buttons while it is empty, the mark before the text and the hint after it, inside the box
    const g = $("#go");
    const b = box(g.parentElement), i = box(g), mark = box(g.parentElement.querySelector(".glass")), hint = box(g.parentElement.querySelector("kbd"));
    got.search = { buttons: g.parentElement.querySelectorAll("button").length, order: mark.left < i.left && i.left + i.width <= hint.left, inside: mark.left > b.left && hint.left + hint.width < b.left + b.width };
    g.focus();
    g.click();
  });
  step(() => {
    got.search.clickedEmpty = state("go").expanded;
    typeIn($("#go"), "tai");
  });
  step(() => {
    got.search.typed = state("go");
    got.search.buttons2 = $("#go").parentElement.querySelectorAll("button").length;
    got.logAt = log.length;
    key($("#go"), "Enter");
  });
  step(() => {
    got.search.chosen = { ...state("go"), said: log.slice(got.logAt), buttons: $("#go").parentElement.querySelectorAll("button").length };
    key($("#go"), "ArrowDown");
  });
  step(() => {
    got.search.reopened = state("go").expanded;
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
  // said in the status that was in the box before anything was typed, so it is read as it changes; shown in the list,
  // hidden there from screen readers so it is not read twice
  assert.deepEqual([got.nothing.same, got.nothing.shown, got.nothing.hidden, got.nothing.inList], [true, "No matching city.", "true", 0]);
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
  // emptied from the keyboard and left: no value (but the words of something matched stay theirs, above)
  assert.equal(got.rechosen, "Singapore");
  assert.deepEqual([got.emptied.value, got.emptied.expanded], ["", "false"]);
  assert.ok(got.emptied.said.includes("a:null"), `cleared: ${JSON.stringify(got.emptied.said)}`);
  assert.equal(got.emptied.status, "", "the status falls quiet once the list is shut");
  // the line: no box, only the bottom edge, at Input's height; the line thickens in the ink with focus; the list opens under it
  assert.deepEqual([got.line.rest.top, got.line.rest.side, got.line.rest.bottom, got.line.rest.style, got.line.rest.bg, got.line.rest.height], ["0px", "0px/0px", "1px", "solid", "rgba(0, 0, 0, 0)", 40]);
  assert.equal(got.line.rest.size, "14px", "the line types smaller than the 16px page and the box (touch screens keep 16px against focus zoom)");
  assert.equal(got.line.focus.outline, "none", "no ring around a line: the thicker ink line is its focus");
  assert.equal(got.line.focus.bottom, "1px");
  assert.ok(got.line.inkShadow, `focus thickens the line in the ink: ${got.line.focus.shadow}`);
  assert.deepEqual([got.line.list.expanded, got.line.list.top, got.line.list.under], ["true", true, 4]);
  // a search: no open button, nothing to clear while empty, the mark and the hint either side of the text in the box;
  // a click in the empty box opens nothing; typing opens it; Enter goes, and the box empties and hears ""
  assert.deepEqual([got.search.buttons, got.search.order, got.search.inside, got.search.clickedEmpty], [0, true, true, "false"]);
  assert.deepEqual([got.search.typed.expanded, got.search.typed.active, got.search.buttons2], ["true", "Taipei", 1]);
  assert.deepEqual([got.search.chosen.value, got.search.chosen.expanded, got.search.chosen.focus, got.search.chosen.buttons], ["", "false", true, 0]);
  assert.deepEqual(got.search.chosen.said, ["go:tpe", "go:text:"], "chosen, then the text is \"\": nothing left to filter by");
  assert.equal(got.search.reopened, "false", "↓ in the emptied box opens nothing, not the last search");

  // in a Dialog: Esc closes the list and keeps the dialog open
  const dialog = run("dialog");
  if (!dialog) return;
  assert.equal(dialog.dlgOpen, "true");
  assert.deepEqual(dialog.afterEsc, { list: "false", dialog: true });
});
