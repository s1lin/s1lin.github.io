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
 * Command: on a server, an open palette is a dialog named by its label holding a combobox wired to an always-open
 * listbox, the first result its active descendant, results in groups named by their headings (an empty group left
 * out), chips as a radio group, the close button named from S1Words, two status regions from the start, the foot. In a
 * real browser, with React running: it opens modal with focus in the box on the first result; the arrows move and wrap
 * across groups; results arriving keep the chosen one; an IME's Enter chooses nothing; Enter chooses; a new query chooses
 * its first result again; nothing
 * matching says so in the list and in a status; a press on a result keeps focus in the box and a click chooses it;
 * the chips choose by a click and by the arrows, with no line round any chip, the chosen one filled; Esc closes and
 * focus goes back to the opener; the result under the arrows is in reverse; under 640px it is the whole screen with
 * its close button shown and no foot. Vite bundles a small page from src/ui/ as an app would; headless Chrome runs it
 * and prints what it found. The browser half is skipped where there is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-command-"));
after(() => rmSync(out, { recursive: true, force: true }));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");

/** The parts, bundled for node as an app's server would import them (their stylesheets left out). */
async function serverParts() {
  writeFileSync(path.join(out, "server.ts"), ["command", "words"].map((p) => `export * from ${JSON.stringify(path.join(ROOT, `src/ui/${p}.tsx`))};`).join("\n"));
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

test("Command on a server: a dialog named by its label, a combobox over an always-open listbox in named groups, the first result active, chips as a radio group", async () => {
  const { Command, S1Words, h, renderToString } = await serverParts();
  const items = (names: string[]) => names.map((n) => ({ id: n.toLowerCase(), name: n }));
  const props = {
    onClose() {},
    label: "Search",
    query: "pro",
    onQueryChange() {},
    placeholder: "Search or jump to…",
    groups: [
      { key: "pages", label: "Pages", items: items(["Profile", "Projects"]) },
      { key: "none", label: "Files", items: [] },
      { key: "keys", label: "Keys", items: items(["prod-backend"]) },
    ],
    itemKey: (i: { id: string }) => i.id,
    renderItem: (i: { name: string }) => i.name,
    onChoose() {},
    scopes: [{ value: "all", label: "All" }, { value: "keys", label: "Keys" }],
    scope: "all",
    onScopeChange() {},
    scopesLabel: "Look in",
    foot: h("span", null, "↑↓ move"),
  };
  const shut = renderToString(h(Command, { ...props, open: false }));
  assert.match(shut, /^<dialog class="s1-command" aria-label="Search"><\/dialog>$/, "closed: the dialog and nothing in it");

  const html = renderToString(h(Command, { ...props, open: true }));
  const input = html.match(/<input[^>]*>/)![0];
  assert.match(input, /role="combobox"/);
  assert.match(input, /aria-label="Search"/);
  assert.match(input, /aria-expanded="true"/);
  assert.match(input, /aria-autocomplete="list"/);
  assert.match(input, /value="pro"/);
  assert.match(input, /placeholder="Search or jump to…"/);
  const listId = input.match(/aria-controls="([^"]+)"/)![1];
  const activeId = input.match(/aria-activedescendant="([^"]+)"/)![1];
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(html, new RegExp(`<div class="s1-command__list" id="${esc(listId)}" role="listbox" aria-label="Search">`));
  const options = [...html.matchAll(/<div id="([^"]+)" role="option" aria-selected="(true|false)"[^>]*>([^<]*)<\/div>/g)].map((m) => ({ id: m[1], selected: m[2], text: m[3] }));
  assert.deepEqual(options.map((o) => [o.text, o.selected]), [["Profile", "true"], ["Projects", "false"], ["prod-backend", "false"]]);
  assert.equal(options[0]!.id, activeId, "the first result is the box's active descendant");
  const groups = [...html.matchAll(/role="group" class="s1-command__group" aria-labelledby="([^"]+)"><div class="s1-command__label" id="([^"]+)" role="presentation">([^<]*)</g)];
  assert.deepEqual(groups.map((g) => g[3]), ["Pages", "Keys"], "the empty group is left out");
  for (const g of groups) assert.equal(g[1], g[2], "a group is named by its heading");
  assert.match(html, /<div class="s1-command__scopes" role="radiogroup" aria-label="Look in">/);
  assert.match(html, /<button type="button" role="radio" aria-checked="true" tabindex="0" class="s1-command__scope">All<\/button><button type="button" role="radio" aria-checked="false" tabindex="-1" class="s1-command__scope">Keys<\/button>/);
  assert.match(html, /<button type="button" class="s1-command__close" aria-label="Close">/);
  assert.equal(html.match(/role="status"/g)?.length, 2, "two live regions from the start: the empty list's words and the status line");
  assert.match(html, /<div class="s1-command__foot"><span>↑↓ move<\/span><\/div>/);

  // nothing matches: no option, no active descendant, the empty words in the list and in the hidden status
  const none = renderToString(h(Command, { ...props, open: true, groups: [{ key: "pages", label: "Pages", items: [] }], empty: "Nothing matches “zz”." }));
  assert.doesNotMatch(none, /role="option"/);
  assert.doesNotMatch(none.match(/<input[^>]*>/)![0], /aria-activedescendant/);
  assert.match(none, /<div class="s1-command__empty">Nothing matches “zz”.<\/div>/);
  assert.match(none, /<div class="s1-command__said" role="status">Nothing matches “zz”.<\/div>/);
  // the close button's name from S1Words; full screen as a class
  const zh = renderToString(h(S1Words, { words: { close: "关闭" } }, h(Command, { ...props, open: true, fullScreen: true })));
  assert.match(zh, /aria-label="关闭"/);
  assert.match(zh, /^<dialog class="s1-command s1-command--full"/);
});

const ENTRY = `
import { useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Command } from ${JSON.stringify(path.join(ROOT, "src/ui/command.tsx"))};

window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
const ALL = [
  { id: "keys", group: "pages", name: "Access keys" },
  { id: "orders", group: "pages", name: "My orders" },
  { id: "profile", group: "pages", name: "Profile" },
  { id: "prod", group: "keys", name: "prod-backend" },
  { id: "ci", group: "keys", name: "ci-runner" },
];
const log = [];
function Palette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const [late, setLate] = useState(false);
  window.addLate = () => setLate(true);
  const q = query.trim().toLowerCase();
  const hits = [...ALL, ...(late ? [{ id: "late", group: "keys", name: "prod-late" }] : [])].filter((h) => (scope === "all" || h.group === scope) && h.name.toLowerCase().includes(q));
  const groups = [{ key: "pages", label: "Pages", items: hits.filter((h) => h.group === "pages") }, { key: "keys", label: "Keys", items: hits.filter((h) => h.group === "keys") }];
  return (
    <>
      <button id="opener" type="button" onClick={() => setOpen(true)}>Search</button>
      <Command open={open} onClose={() => { log.push("close"); setOpen(false); }} label="Search" placeholder="Search" query={query} onQueryChange={setQuery}
        groups={groups} itemKey={(h) => h.id} renderItem={(h) => h.name} onChoose={(h) => log.push("choose:" + h.id)}
        scopes={[{ value: "all", label: "All" }, { value: "pages", label: "Pages" }, { value: "keys", label: "Keys" }]} scope={scope} onScopeChange={setScope} scopesLabel="Look in"
        empty={"Nothing matches " + q} foot={<span>keys</span>} />
    </>
  );
}
const root = createRoot(document.getElementById("app"));
flushSync(() => root.render(<Palette />));

const got = { log };
const $ = (s) => document.querySelector(s);
const input = () => $(".s1-command__input");
const typeIn = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); };
const key = (el, k, o = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...o }));
const imeEnter = (el) => { const safari = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }); Object.defineProperty(safari, "keyCode", { value: 229 }); return [key(el, "Enter", { isComposing: true }), el.dispatchEvent(safari)]; };
const active = () => { const id = input().getAttribute("aria-activedescendant"); return id ? document.getElementById(id).textContent : null; };
// the layout box (not the opening animation's transform)
const rect = (el) => ({ top: el.offsetTop, left: el.offsetLeft, width: el.offsetWidth, height: el.offsetHeight });
const look = (el) => { const s = getComputedStyle(el); return { bg: s.backgroundColor, color: s.color, border: s.borderTopWidth + "/" + s.borderBottomWidth, outline: s.outlineStyle, shadow: s.boxShadow }; };
const steps = [];
const step = (f) => steps.push(f);
step(() => { $("#opener").focus(); $("#opener").click(); });
step(() => {
  const d = $("dialog.s1-command");
  got.opened = { open: d.open, modal: d.matches(":modal"), focus: document.activeElement === input(), active: active(), options: [...document.querySelectorAll("[role=option]")].map((o) => o.textContent) };
  key(input(), "ArrowDown");
});
step(() => { got.down = active(); key(input(), "ArrowDown"); key(input(), "ArrowDown"); key(input(), "ArrowDown"); key(input(), "ArrowDown"); });
step(() => { got.wrapped = active(); key(input(), "ArrowUp"); });
step(() => {
  got.up = active();
  const opt = document.getElementById(input().getAttribute("aria-activedescendant"));
  const ink = getComputedStyle(document.documentElement).getPropertyValue("--s1-ink").trim();
  got.reverse = { option: look(opt), paper: getComputedStyle(document.body).backgroundColor };
  typeIn(input(), "pro");
});
step(() => { got.typed = { active: active(), options: [...document.querySelectorAll("[role=option]")].map((o) => o.textContent) }; key(input(), "ArrowDown"); });
step(() => { got.typedDown = active(); window.addLate(); });
step(() => { got.lateJoined = { active: active(), options: [...document.querySelectorAll("[role=option]")].map((o) => o.textContent) }; typeIn(input(), "pr"); });
step(() => { got.newList = active(); got.ime = imeEnter(input()); got.logAtIme = log.length; });
step(() => { got.imeChose = log.length !== got.logAtIme; key(input(), "Enter"); });
step(() => { got.entered = log.slice(-1)[0]; typeIn(input(), "zz"); });
step(() => {
  got.none = { options: document.querySelectorAll("[role=option]").length, active: input().getAttribute("aria-activedescendant"), shown: $(".s1-command__empty")?.textContent, said: $(".s1-command__said").textContent };
  typeIn(input(), "");
});
step(() => {
  const opt = [...document.querySelectorAll("[role=option]")].find((o) => o.textContent === "ci-runner");
  const down = new PointerEvent("pointerdown", { bubbles: true, cancelable: true });
  opt.dispatchEvent(down);
  const mdown = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
  opt.dispatchEvent(mdown);
  got.press = { kept: down.defaultPrevented && mdown.defaultPrevented, focus: document.activeElement === input() };
  opt.dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
});
step(() => { got.hovered = active(); [...document.querySelectorAll("[role=option]")].find((o) => o.textContent === "ci-runner").click(); });
step(() => {
  got.clicked = log.slice(-1)[0];
  const chips = [...document.querySelectorAll(".s1-command__scope")];
  got.chips = chips.map((c) => ({ checked: c.getAttribute("aria-checked"), look: look(c) }));
  chips[2].click();
});
step(() => {
  got.keysScope = { checked: [...document.querySelectorAll(".s1-command__scope")].map((c) => c.getAttribute("aria-checked")), options: [...document.querySelectorAll("[role=option]")].map((o) => o.textContent), chosenLook: look(document.querySelectorAll(".s1-command__scope")[2]) };
  const group = $(".s1-command__scopes");
  document.querySelectorAll(".s1-command__scope")[2].focus();
  key(group, "ArrowRight");
});
step(() => {
  got.arrowed = { checked: [...document.querySelectorAll(".s1-command__scope")].map((c) => c.getAttribute("aria-checked")), focus: document.activeElement?.textContent };
  got.layout = { dialog: rect($("dialog.s1-command")), win: { width: innerWidth, height: innerHeight }, close: getComputedStyle($(".s1-command__close")).display, foot: getComputedStyle($(".s1-command__foot")).display };
  input().focus();
  // Esc as the browser sends it: a cancel event on the dialog
  $("dialog.s1-command").dispatchEvent(new Event("cancel", { cancelable: true }));
});
step(() => { got.escaped = { open: $("dialog.s1-command").open, focus: document.activeElement?.id, log: log.slice(-1)[0] }; });

let i = 0;
const next = () => {
  if (i < steps.length) { steps[i++](); setTimeout(next, 120); }
  else document.getElementById("out").textContent = JSON.stringify(got);
};
setTimeout(next, 120);
`;

test("Command in a browser: modal with focus in the box, the arrows wrap across groups, results arriving keep the chosen one, an IME's Enter chooses nothing, a new query chooses its first, the empty words, pointer and click, the chips, Esc and focus back; full screen on a phone", async (t) => {
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
  writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>${css} body { margin: 0; background: var(--s1-paper); color: var(--s1-ink); }</style></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);

  const run = (size: string) => {
    let dom: string;
    try {
      dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", `--window-size=${size}`, "--virtual-time-budget=15000", "--dump-dom", pathToFileURL(page).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
    } catch (e) {
      return t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
    }
    const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
    assert.ok(text, `${size}: the page printed nothing`);
    const got = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
    assert.equal(got.pageError, undefined, String(got.pageError));
    return got;
  };

  const got = run("1280,800");
  if (!got) return;
  assert.deepEqual(got.opened, { open: true, modal: true, focus: true, active: "Access keys", options: ["Access keys", "My orders", "Profile", "prod-backend", "ci-runner"] });
  assert.equal(got.down, "My orders");
  assert.equal(got.wrapped, "Access keys", "five steps from the second wrap round to the first");
  assert.equal(got.up, "ci-runner", "up from the first goes to the last, across the groups");
  // the result under the arrows in reverse: the ink's fill under the paper's words
  assert.equal(got.reverse.option.color, got.reverse.paper);
  assert.notEqual(got.reverse.option.bg, got.reverse.paper);
  assert.deepEqual(got.typed, { active: "Profile", options: ["Profile", "prod-backend"] });
  assert.equal(got.typedDown, "prod-backend");
  assert.deepEqual(got.lateJoined, { active: "prod-backend", options: ["Profile", "prod-backend", "prod-late"] }, "a result arriving below keeps the chosen one chosen");
  assert.equal(got.newList, "Profile", "a new query chooses its first result again");
  assert.deepEqual(got.ime, [true, true], "the IME's Enter is left to the IME");
  assert.equal(got.imeChose, false);
  assert.equal(got.entered, "choose:profile");
  assert.deepEqual(got.none, { options: 0, active: null, shown: "Nothing matches zz", said: "Nothing matches zz" });
  assert.deepEqual(got.press, { kept: true, focus: true }, "a press on a result keeps focus in the box");
  assert.equal(got.hovered, "ci-runner");
  assert.equal(got.clicked, "choose:ci");
  // the chips: no line, no ring, no shadow, at rest or chosen; the chosen one filled; a click and the arrows choose
  for (const c of got.chips) assert.deepEqual([c.look.border, c.look.outline, c.look.shadow], ["0px/0px", "none", "none"]);
  assert.deepEqual(got.chips.map((c: { checked: string }) => c.checked), ["true", "false", "false"]);
  assert.notEqual(got.chips[0].look.bg, got.chips[1].look.bg, "the chosen chip is filled, the others not");
  assert.deepEqual(got.keysScope.checked, ["false", "false", "true"]);
  assert.deepEqual(got.keysScope.options, ["prod-backend", "ci-runner", "prod-late"]);
  assert.deepEqual([got.keysScope.chosenLook.border, got.keysScope.chosenLook.shadow], ["0px/0px", "none"]);
  assert.deepEqual(got.arrowed, { checked: ["true", "false", "false"], focus: "All" }, "→ on the last chip wraps to the first and takes focus there");
  // a computer: a sheet narrower than the window, no close button, the foot shown
  assert.ok(got.layout.dialog.width <= 640 && got.layout.dialog.width < got.layout.win.width);
  assert.deepEqual([got.layout.close, got.layout.foot], ["none", "flex"]);
  // Esc: closed, onClose heard, focus back on the opener
  assert.deepEqual(got.escaped, { open: false, focus: "opener", log: "close" });

  // a phone: the whole screen, the close button, no foot
  const phone = run("390,780");
  if (!phone) return;
  assert.deepEqual(phone.layout.dialog, { top: 0, left: 0, width: phone.layout.win.width, height: phone.layout.win.height });
  assert.notEqual(phone.layout.close, "none", "the close button shows");
  assert.equal(phone.layout.foot, "none", "no keys' hints");
});
