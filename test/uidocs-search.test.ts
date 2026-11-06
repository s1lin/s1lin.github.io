import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { build } from "vite";
import { ENTRIES, GROUPS, LISTED, SITE } from "../src/components/uidocs/registry.ts";
import { PLACES, SECTIONS, find, siteRowId } from "../src/components/uidocs/search-index.ts";

/*
 * The search on /ui/ (owner, 2026-11-06: "Create a search bar in the ui page"). Its index against the inventory: every
 * group, item and site part the page sets is in it, in the page's order, each with a Chinese name, and each is found
 * first by its own names. Its matching: names, keywords and first lines, in English and Chinese, any case, at a start
 * or inside. On a server the page renders it in the index as a search landmark around the kit's Combobox. In a real
 * browser, the whole page as it is served: "/" brings focus to it (not from another field); typing shows the places
 * in the page's sections; Enter scrolls there, puts it in the address, gives its heading focus and marks it; Chinese;
 * nothing matching said in a status; Esc; reduced motion; night; and at a phone's width, the button at the end of the
 * index's bar, the box over the bar, and no sideways scroll. Skipped where there is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-uisearch-"));
after(() => rmSync(out, { recursive: true, force: true }));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");

const ids = (q: string) => find(q).flatMap((g) => g.places.map((p) => p.id));
const CJK = /[㐀-鿿]/;

// ------------------------------------------------------------------ the index

test("every documented section is in the search's index, in the page's order, with a Chinese name", () => {
  const byId = new Map(PLACES.map((p) => [p.id, p]));
  assert.equal(byId.size, PLACES.length, "an anchor is in the index twice");
  for (const g of GROUPS) {
    assert.deepEqual(byId.get(g.id) && [byId.get(g.id)!.kind, byId.get(g.id)!.heading, byId.get(g.id)!.name], ["section", `${g.id}-h`, g.name], `group ${g.id}`);
    assert.match(g.zh, CJK, `group ${g.id} has a Chinese name`);
  }
  for (const e of ENTRIES) {
    const p = byId.get(e.id);
    assert.deepEqual(p && [p.kind, p.heading, p.name, p.section, p.zh], ["part", `${e.id}-name`, e.name, e.group, e.zh], `entry ${e.id}`);
    assert.match(e.zh, CJK, `${e.id} has a Chinese name`);
    assert.ok(p!.line.length > 0 && !p!.line.includes("`"), `${e.id} has a plain first line`);
  }
  assert.equal(byId.get(SITE.id)?.kind, "section");
  for (const l of LISTED) assert.equal(byId.get(siteRowId(l.name))?.heading, `${siteRowId(l.name)}-name`, `site part ${l.name}`);
  // the page's order: each group, then its items (as the index nav lists them), then the site parts
  const page = [...GROUPS.flatMap((g) => [g.id, ...ENTRIES.filter((e) => e.group === g.id).map((e) => e.id)]), SITE.id, ...LISTED.map((l) => siteRowId(l.name))];
  assert.deepEqual(PLACES.map((p) => p.id), page);
  assert.deepEqual(SECTIONS.map((s) => s.id), [...GROUPS.map((g) => g.id), SITE.id]);
});

test("every place is found first by its own name, and every group and part by its Chinese name", () => {
  for (const p of PLACES) {
    assert.equal(find(p.name)[0]?.places[0]?.id, p.id, `"${p.name}"`);
    if (p.zh) assert.equal(find(p.zh)[0]?.places[0]?.id, p.id, `"${p.zh}"`);
  }
});

test("matching: names, keywords and first lines, in English and Chinese, any case, at a start or inside", () => {
  const has = (q: string, want: string[]) => {
    const got = ids(q);
    for (const w of want) assert.ok(got.includes(w), `"${q}" finds ${w}: ${got.join(", ")}`);
  };
  has("dropdown", ["select", "dropdown", "menu"]);
  has("drop", ["select", "dropdown", "menu"]);
  assert.equal(ids("dropdown")[0], "dropdown", "the part of that name first");
  assert.equal(ids("modal")[0], "dialog");
  assert.equal(ids("toast")[0], "toast");
  assert.equal(ids("snackbar")[0], "toast");
  for (const q of ["colours", "COLORS", "typography", "Fonts"]) assert.equal(ids(q)[0], "tokens", q);
  for (const q of ["install", "inst", "INSTALL"]) assert.equal(ids(q)[0], "install", q);
  for (const q of ["side nav", "sidenav", "side-nav", "SideNav", "sidebar"]) assert.equal(ids(q)[0], "side-nav", q);
  assert.equal(ids("ｍｏｄａｌ")[0], "dialog", "full-width letters from a Chinese keyboard");
  assert.equal(ids("ogress")[0], "meter", "inside a word");
  assert.equal(ids("forms")[0], "forms", "a section by its name");
  // Chinese: by names and keywords, whole or in part
  assert.equal(ids("对话框")[0], "dialog");
  assert.equal(ids("对话")[0], "dialog");
  assert.equal(ids("弹窗")[0], "dialog");
  has("下拉", ["select", "dropdown", "menu"]);
  assert.equal(ids("表单")[0], "forms");
  assert.equal(ids("颜色")[0], "tokens");
  // nothing
  assert.deepEqual(find("zzqx"), []);
  assert.deepEqual(find(""), []);
  assert.deepEqual(find("   "), []);
  // grouped by the page's sections, the section with the best place first, each place in its own section
  const drop = find("drop");
  assert.deepEqual(drop.slice(0, 2).map((g) => g.section.id), ["overlays", "forms"]);
  for (const g of find("s")) for (const p of g.places) assert.equal(p.section, g.section.id);
  // a two-word query needs both
  assert.deepEqual(ids("radio group"), ["radio-group"]);
});

// ------------------------------------------------------------------ on a server

test("the page on a server: the search in the index, a search landmark around the Combobox, its key named, its list shut", async () => {
  writeFileSync(path.join(out, "server.ts"), `export { UiPage } from ${JSON.stringify(path.join(ROOT, "src/components/uidocs/UiDocs.tsx"))};`);
  await build({
    configFile: false,
    root: out,
    logLevel: "silent",
    plugins: [{ name: "no-css", enforce: "pre", load: (id) => (id.endsWith(".css") ? "" : null) }, react()],
    resolve: { alias: { "@": path.join(ROOT, "src") } },
    build: { ssr: path.join(out, "server.ts"), outDir: path.join(out, "ssr"), emptyOutDir: true, rollupOptions: { output: { format: "es", entryFileNames: "page.mjs" } } },
  });
  const { UiPage } = await import(pathToFileURL(path.join(out, "ssr/page.mjs")).href);
  const { createElement } = await import("react");
  const { renderToString } = await import("react-dom/server");
  const html: string = renderToString(createElement(UiPage));
  const index = html.slice(html.indexOf('<div class="ud-index">'), html.indexOf('id="library"'));
  assert.ok(index.length > 0, "the index box");
  assert.ok(index.indexOf('role="search"') >= 0 && index.indexOf('role="search"') < index.search(/<nav class="s1-sidenav[^"]* ud-nav"/), "the search before the tree");
  assert.equal(html.match(/role="search"/g)?.length, 1);
  assert.match(index, /<div class="ud-search" role="search" aria-label="The parts and sections">/);
  const input = index.match(/<input[^>]*id="ud-search"[^>]*>/)?.[0] ?? "";
  for (const a of [/role="combobox"/, /aria-label="Search the parts and sections"/, /aria-keyshortcuts="\/"/, /placeholder="Search the parts"/, /aria-expanded="false"/, /value=""/]) assert.match(input, a);
  assert.doesNotMatch(index, /ud-search__key/, "no key's hint: the input is shown only once it is asked for");
  assert.match(index, /<div class="ud-search__head"><button type="button" class="ud-search__title" tabindex="-1" aria-hidden="true">Index<\/button>/, "shut, the index's title is where the search is, a pointer's way in");
  assert.match(index, /class="s1-input s1-input--md s1-combobox s1-combobox--line ud-search__box"/, "the input is a line, not a box");
  assert.match(index, /<span class="s1-combobox__status" role="status"><\/span>/, "the status, empty, in the page from the start");
  assert.doesNotMatch(index, /Show options/, "no open button: the list opens as one types");
  assert.match(index, /<button type="button" class="[^"]*ud-search__open[^"]*" aria-label="Search the parts" aria-keyshortcuts="\/" aria-expanded="false" aria-controls="ud-search-field"/, "the magnifier at the title row's end, the one control a keyboard meets");
  assert.equal(index.match(/<nav class="s1-sidenav[^"]* ud-nav"[\s\S]*?<\/nav>/)?.[0].includes("s1-sidenav__title"), false, "the tree has no title row of its own: the search's is it");
  assert.match(index, /popover="manual" hidden=""/, "the list shut");
  // every place the search can go to is on the page: its anchor and the heading that takes focus
  for (const p of PLACES) {
    assert.match(html, new RegExp(`id="${p.id}"`), `#${p.id} is on the page`);
    assert.match(html, new RegExp(`id="${p.heading}"`), `#${p.heading} is on the page`);
  }
});

// ------------------------------------------------------------------ in a browser

const ENTRY = `
// in a frame (a phone's width: a window is never narrower than 500px here), the page tells the frame around it
const report = (o) => { document.getElementById("out").textContent = JSON.stringify(o); if (parent !== window) parent.postMessage(JSON.stringify(o), "*"); };
window.addEventListener("error", (e) => report({ pageError: String(e.error?.stack ?? e.message) }));
import ${JSON.stringify(path.join(ROOT, "src/ui.tsx"))};

const mode = location.search.slice(1);
try { localStorage.removeItem("s1lin-theme"); } catch {}
document.documentElement.dataset.theme = mode === "night" ? "dark" : "light";

// how each scroll to a place was asked for: a headless window does not always run a smooth scroll's frames, so a
// glide is checked by what was asked, and where it lands under reduced motion, where it is at once
const scrolls = [];
const ownScroll = Element.prototype.scrollIntoView;
Element.prototype.scrollIntoView = function (o) {
  if (o && o.block === "start") scrolls.push({ id: this.id, behavior: o.behavior, block: o.block });
  return ownScroll.call(this, o);
};
const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const rect = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) }; };
const typeIn = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); };
const key = (el, k) => { const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e.defaultPrevented; };
const box = () => $("#ud-search");
const pop = () => document.getElementById(box().getAttribute("aria-controls")).parentElement;
const shown = (el) => !!el && getComputedStyle(el).display !== "none" && el.getClientRects().length > 0;
const list = () => {
  const p = pop();
  const groups = [...p.querySelectorAll("[role=group]")].map((g) => ({
    label: document.getElementById(g.getAttribute("aria-labelledby")).textContent,
    lang: document.getElementById(g.getAttribute("aria-labelledby")).querySelector("[lang]")?.getAttribute("lang") ?? null,
    options: [...g.querySelectorAll("[role=option]")].map((o) => o.getAttribute("aria-label")),
    shown: [...g.querySelectorAll("[role=option] .ud-hit__name")].map((n) => n.textContent),
  }));
  const act = box().getAttribute("aria-activedescendant");
  return { expanded: box().getAttribute("aria-expanded"), top: p.matches(":popover-open"), groups, active: act ? document.getElementById(act).getAttribute("aria-label") : null, rect: rect(p) };
};
const reopen = () => { if (!shown(box())) $(".ud-search__open").click(); };
const status = () => box().parentElement.querySelector("[role=status]");
const sideways = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;
const at = () => ({ hash: location.hash, focus: document.activeElement?.id || document.activeElement?.tagName, value: box().value, expanded: box().getAttribute("aria-expanded") });
const token = (name) => { const s = document.createElement("span"); document.body.append(s); s.style.color = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); const c = getComputedStyle(s).color; s.remove(); return c; };

async function desk() {
  const got = {};
  const first = status();
  got.start = { title: shown($(".ud-search__title")), titleText: $(".ud-search__title").textContent, open: shown($(".ud-search__open")), field: shown($(".ud-search__field")), input: shown(box()), head: rect($(".ud-search__head")), nav: rect($(".ud-nav")), sideways: sideways(), hash: location.hash, label: $(".ud-search__open").getAttribute("aria-label"), expanded: $(".ud-search__open").getAttribute("aria-expanded") };
  // the title opens it, as the magnifier does; the line is no box
  $(".ud-search__title").click();
  const cs = getComputedStyle(box().parentElement);
  got.title = { input: shown(box()), focus: document.activeElement === box(), head: shown($(".ud-search__head")), expanded: $(".ud-search__open").getAttribute("aria-expanded"), field: rect($(".ud-search__field")), line: rect(box().parentElement), look: [cs.borderTopWidth, cs.borderLeftWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.backgroundColor], close: shown($(".ud-search__close")), glass: shown(box().parentElement.querySelector(".ud-search__glass")) };
  // clicking away puts the title back and leaves focus where it went
  document.body.focus(); box().blur();
  await wait(50);
  got.away = { input: shown(box()), title: shown($(".ud-search__title")), focusInBox: document.activeElement === box() };
  // Close gives it back with focus on the magnifier
  $(".ud-search__open").click();
  $(".ud-search__close").click();
  await wait(50);
  got.closeBtn = { input: shown(box()), title: shown($(".ud-search__title")), focus: document.activeElement === $(".ud-search__open") };
  // "/" from the page: focus in the box, the key kept from the page
  got.slash = { prevented: key(document.body, "/"), focus: document.activeElement === box() };
  // "/" in another field is a character, not the search's
  const other = [...document.querySelectorAll(".ud-body input")].find((i) => !i.type || i.type === "text" || i.type === "search");
  other.focus();
  got.otherSlash = { prevented: key(other, "/"), focus: document.activeElement === other };
  await wait(50);
  reopen();
  typeIn(box(), "drop");
  await wait(150);
  got.drop = list();
  got.drop.box = rect(box().parentElement);
  got.drop.sideways = sideways();
  // Enter goes to the first: the address, the heading's focus, the mark; the box empties and shuts
  key(box(), "Enter");
  await wait(50);
  got.went = { ...at(), asked: scrolls.at(-1), marked: $("#dropdown .ud-item__head")?.hasAttribute("data-found") ?? false, mark: getComputedStyle($("#dropdown .ud-item__head")).animationName };
  got.went.top = rect(document.getElementById("dropdown")).top;
  await wait(1500);
  got.went.head = Math.round(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
  await wait(1200);
  got.went.after = $("#dropdown .ud-item__head").hasAttribute("data-found");
  got.went.shut = { input: shown(box()), title: shown($(".ud-search__title")) };
  // Chinese
  reopen();
  typeIn(box(), "对话框");
  await wait(150);
  got.zh = list();
  got.zh.hitLang = pop().querySelector("[role=option] .ud-hit__name [lang]")?.getAttribute("lang") ?? null;
  // Esc closes the list and keeps the words; a second puts the box back as it was
  got.esc1 = { prevented: key(box(), "Escape"), ...at() };
  await wait(100);
  got.esc1.after = at();
  key(box(), "Escape");
  await wait(100);
  got.esc2 = at();
  // a third Esc, with nothing left to undo, shuts it and puts focus on the magnifier
  key(box(), "Escape");
  await wait(100);
  got.esc3 = { input: shown(box()), title: shown($(".ud-search__title")), focus: document.activeElement === $(".ud-search__open"), expanded: $(".ud-search__open").getAttribute("aria-expanded") };
  reopen();
  // nothing matching: said in the status that was there all along
  typeIn(box(), "zzqx");
  await wait(150);
  got.nothing = { ...list(), status: status().textContent, same: status() === first, shown: pop().querySelector(".s1-combobox__empty")?.textContent ?? null };
  key(box(), "Escape");
  await wait(100);
  got.nothing.closed = { ...at(), status: status().textContent };
  // a click on an option goes too, at once under reduced motion
  reopen();
  typeIn(box(), "meter");
  await wait(150);
  const o = pop().querySelector("[role=option]");
  o.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
  o.click();
  got.clicked = { asked: scrolls.at(-1), top: rect(document.getElementById("meter")).top, still: matchMedia("(prefers-reduced-motion: reduce)").matches };
  await wait(50);
  Object.assign(got.clicked, at());
  return got;
}

async function night() {
  const got = {};
  reopen();
  typeIn(box(), "下拉");
  await wait(150);
  got.list = list();
  const p = pop();
  got.look = { list: getComputedStyle(p).backgroundColor, ink: getComputedStyle(p).color, paper: token("--s1-paper"), inkToken: token("--s1-ink"), theme: document.documentElement.dataset.theme };
  const active = p.querySelector("[role=option][data-active]");
  got.look.active = [getComputedStyle(active).backgroundColor, getComputedStyle(active).color, getComputedStyle(active.querySelector(".ud-hit__line")).color];
  got.boxLook = { line: getComputedStyle(box().parentElement).borderBottomColor, ink: token("--s1-ink"), border: getComputedStyle(box().parentElement).borderTopColor, outline: getComputedStyle(box().parentElement).outlineStyle };
  return got;
}

async function phone() {
  const got = {};
  // read into the parts, so the index's bar is held under the running head
  scrollTo({ top: document.getElementById("install").getBoundingClientRect().top + scrollY - 300, behavior: "instant" });
  await wait(200);
  const bar = $(".ud-nav .s1-sidenav__bar");
  const open = $(".ud-search__open");
  got.start = { sideways: sideways(), bar: rect(bar), open: rect(open), shownOpen: shown(open), field: shown($(".ud-search__field")), sign: rect(bar.querySelector(".s1-sidenav__sign")), here: rect(bar.querySelector(".s1-sidenav__here")), width: document.documentElement.clientWidth };
  open.click();
  await wait(100);
  got.opened = { field: shown($(".ud-search__field")), fieldRect: rect($(".ud-search__field")), box: rect(box().parentElement), close: rect($(".ud-search__close")), focus: document.activeElement === box(), expanded: open.getAttribute("aria-expanded"), shownOpen: shown(open), sideways: sideways(), line: (({ borderTopWidth: a, borderLeftWidth: b, borderRightWidth: c, borderBottomWidth: d }) => [a, b, c, d].map(parseFloat))(getComputedStyle(box().parentElement)) };
  typeIn(box(), "modal");
  await wait(150);
  got.modal = { ...list(), sideways: sideways() };
  key(box(), "Enter");
  got.went = { asked: scrolls.at(-1), top: rect(document.getElementById("dialog")).top };
  await wait(50);
  Object.assign(got.went, at(), { field: shown($(".ud-search__field")), shownOpen: shown(open) });
  await wait(1500);
  got.went.bar = rect(bar);
  got.went.head = Math.round(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
  got.went.sideways = sideways();
  // "/" from a keyboard on a narrow window opens it too; Esc closes it and gives focus back to its button
  got.slash = { prevented: key(document.body, "/"), field: shown($(".ud-search__field")), focus: document.activeElement === box() };
  key(box(), "Escape");
  await wait(100);
  got.esc = { field: shown($(".ud-search__field")), focus: document.activeElement === open, shownOpen: shown(open) };
  // the index's sheet holds focus: no search over it
  bar.click();
  await wait(100);
  got.sheet = { searchShown: shown($(".ud-search")), prevented: key(document.body, "/") };
  return got;
}

(async () => {
  await document.fonts.ready;
  for (let i = 0; i < 50 && !box(); i++) await wait(50);
  await wait(300);
  report(mode === "phone" ? await phone() : mode === "night" ? await night() : await desk());
})().catch((e) => report({ pageError: String(e?.stack ?? e) }));
`;

// what the page reports, as JSON
type Run = Record<string, any>;
const runs: Record<string, Run> = {};
/** The page in a window of this size, or (framed) in a 390 × 844 frame inside one. */
async function run(t: { skip: (m: string) => void }, mode: string, width: number, height: number, flags: string[] = [], framed = false): Promise<Run | undefined> {
  const name = `${mode}-${width}-${flags.join("")}-${framed}`;
  if (runs[name]) return runs[name];
  const bin = chrome();
  if (!bin) return void t.skip("no Chrome here: set CHROME to run it");
  const dist = path.join(out, "dist");
  if (!existsSync(path.join(dist, "page.html"))) {
    writeFileSync(path.join(out, "entry.jsx"), ENTRY);
    await build({
      configFile: false,
      root: out,
      // the typefaces by their file URL beside the stylesheet, so they load as the site's own do
      base: pathToFileURL(dist + "/").href,
      logLevel: "silent",
      plugins: [react()],
      resolve: { alias: { "@": path.join(ROOT, "src") } },
      define: { "process.env.NODE_ENV": '"production"' },
      build: { outDir: dist, emptyOutDir: true, minify: false, lib: { entry: path.join(out, "entry.jsx"), formats: ["iife"], name: "Harness", fileName: () => "harness.js", cssFileName: "harness" } },
    });
    const js = readFileSync(path.join(dist, "harness.js"), "utf8");
    // a phone's width: headless Chrome keeps a window at least 500px wide, so the page runs in a frame of that width
    writeFileSync(
      path.join(dist, "frame.html"),
      `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"><iframe id="f" style="display:block;border:0" width="${390}" height="${844}"></iframe><pre id="out" hidden></pre><script>addEventListener("message", (e) => { document.getElementById("out").textContent = e.data; }); document.getElementById("f").src = "page.html" + location.search;</script></body></html>`,
    );
    writeFileSync(
      path.join(dist, "page.html"),
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="harness.css"></head><body><div id="root"></div><pre id="out" hidden></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`,
    );
  }
  let dom: string;
  try {
    dom = execFileSync(
      bin,
      ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", ...flags, `--window-size=${width},${height}`, "--virtual-time-budget=30000", "--dump-dom", `${pathToFileURL(path.join(dist, framed ? "frame.html" : "page.html")).href}?${mode}`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120_000, maxBuffer: 64 * 1024 * 1024 },
    );
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === "ENOENT" || err.code === "EACCES") return void t.skip(`Chrome would not start (${bin}): ${err.code}`);
    assert.fail(`Chrome failed on the page (${bin}): ${String(err.stderr ?? e).slice(0, 400)}`);
  }
  const text = dom.match(/<pre id="out" hidden="">([\s\S]*?)<\/pre>/)?.[1] ?? "";
  assert.ok(text, `${mode}: the page printed nothing`);
  const parsed = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  assert.equal(parsed.pageError, undefined, `${mode}: the page failed: ${parsed.pageError}`);
  return (runs[name] = parsed);
}

test("in a browser: \"/\" focuses it (not from another field), typing shows the places by section, Enter goes there, Chinese, nothing matching, Esc", async (t) => {
  const got = await run(t, "desk", 1280, 800);
  if (!got) return;
  // at rest: no input, the index's title with a magnifier at its end, in the index column over the tree; nothing sideways
  assert.deepEqual([got.start.title, got.start.titleText, got.start.open, got.start.field, got.start.input, got.start.sideways, got.start.hash, got.start.label, got.start.expanded], [true, "Index", true, false, false, 0, "", "Search the parts", "false"]);
  assert.ok(got.start.head.bottom < got.start.nav.top && got.start.head.left === got.start.nav.left, `the title row over the tree: ${JSON.stringify([got.start.head, got.start.nav])}`);
  assert.equal(got.start.head.height, 40);
  // a click on the title opens a line input in its place, the same height, focus in it: no box, a bottom line, the magnifier before and Close after
  assert.deepEqual([got.title.input, got.title.focus, got.title.head, got.title.expanded, got.title.close, got.title.glass], [true, true, false, "true", true, true]);
  assert.deepEqual(got.title.look.slice(0, 4), ["0px", "0px", "0px", "1px"]);
  assert.equal(got.title.look[4], "rgba(0, 0, 0, 0)");
  assert.equal(got.title.field.height, 40, "the line is as tall as the row it stands in, so nothing under it moves");
  assert.equal(got.title.field.top, got.start.head.top);
  // a click elsewhere puts the title back and does not take focus back
  assert.deepEqual(got.away, { input: false, title: true, focusInBox: false });
  // Close puts the title back, focus on the magnifier
  assert.deepEqual(got.closeBtn, { input: false, title: true, focus: true });
  // "/"
  assert.deepEqual(got.slash, { prevented: true, focus: true });
  assert.deepEqual(got.otherSlash, { prevented: false, focus: true }, "typed in another field, \"/\" stays a character there");
  // typing: the places in the page's sections, the best first, the first under the arrows; in the top layer
  assert.deepEqual([got.drop.expanded, got.drop.top, got.drop.active, got.drop.sideways], ["true", true, "Dropdown", 0]);
  assert.deepEqual(got.drop.groups.slice(0, 2).map((g: Run) => [g.label, g.options]), [["Overlays", ["Dropdown", "Menu"]], ["Forms", ["Select"]]]);
  const [l, b] = [got.drop.rect, got.drop.box];
  assert.ok((l.top === b.bottom + 4 || l.bottom === b.top - 4) && l.left === b.left && l.width > b.width, `the list against the box, wider than the column: ${JSON.stringify([l, b])}`);
  // Enter: a glide there, the address, the heading's focus, the mark (and gone again); the box empty and shut
  assert.deepEqual([got.went.hash, got.went.focus, got.went.value, got.went.expanded, got.went.marked, got.went.mark], ["#dropdown", "dropdown-name", "", "false", true, "ud-found"]);
  assert.deepEqual(got.went.asked, { id: "dropdown", behavior: "smooth", block: "start" });
  assert.equal(got.went.after, false, "the mark lets go");
  assert.deepEqual(got.went.shut, { input: false, title: true }, "a choice puts the title row back");
  // Chinese: the sections and the names in Chinese first
  assert.deepEqual(got.zh.groups.map((g: Run) => [g.label, g.lang, g.options]), [["浮层", "zh-CN", ["Dialog"]]]);
  assert.equal(got.zh.groups[0].shown[0], "对话框Dialog");
  assert.equal(got.zh.hitLang, "zh-CN");
  // Esc: the list shuts, the words stay; a second Esc empties the box
  assert.deepEqual([got.esc1.prevented, got.esc1.after.expanded, got.esc1.after.value, got.esc1.after.focus], [true, "false", "对话框", "ud-search"]);
  assert.deepEqual([got.esc2.value, got.esc2.focus], ["", "ud-search"]);
  assert.deepEqual(got.esc3, { input: false, title: true, focus: true, expanded: "false" }, "a third Esc shuts it, focus on the magnifier");
  // nothing matching: the list says so, and the status that was in the page from the start says it to a screen reader
  assert.deepEqual([got.nothing.expanded, got.nothing.groups.length, got.nothing.status, got.nothing.same, got.nothing.shown], ["true", 0, "Nothing matches", true, "Nothing matches"]);
  assert.deepEqual([got.nothing.closed.expanded, got.nothing.closed.status], ["false", ""]);
  // a click goes too
  assert.deepEqual([got.clicked.hash, got.clicked.focus, got.clicked.value, got.clicked.still], ["#meter", "meter-name", "", false]);
  assert.deepEqual(got.clicked.asked, { id: "meter", behavior: "smooth", block: "start" });
});

test("in a browser, under reduced motion: a choice is there at once, the item's top at the scroll padding", async (t) => {
  const got = await run(t, "desk", 1280, 800, ["--force-prefers-reduced-motion"]);
  if (!got) return;
  assert.equal(got.clicked.still, true);
  assert.deepEqual(got.went.asked, { id: "dropdown", behavior: "instant", block: "start" });
  assert.ok(Math.abs(got.went.top - got.went.head) <= 2, `there at once: ${got.went.top} against ${got.went.head}`);
  assert.ok(Math.abs(got.clicked.top - got.went.head) <= 2, `a click too: ${got.clicked.top} against ${got.went.head}`);
  assert.equal(got.went.mark, "none", "the mark holds still");
  assert.equal(got.went.after, false, "and lets go");
});

test("in a browser, at night: the list on night paper, the option under the arrows in reverse, Chinese sections", async (t) => {
  const got = await run(t, "night", 1280, 800);
  if (!got) return;
  assert.equal(got.look.theme, "dark");
  assert.deepEqual([got.look.list, got.look.ink], [got.look.paper, got.look.inkToken]);
  assert.deepEqual(got.look.active, [got.look.inkToken, got.look.paper, got.look.paper], "reverse, its line too");
  assert.equal(got.boxLook.line, got.boxLook.ink, "the line in the night's ink while it has focus");
  assert.deepEqual(got.list.groups.map((g: Run) => g.label), ["浮层", "表单"]);
  assert.deepEqual(got.list.groups.map((g: Run) => g.options), [["Dropdown", "Menu"], ["Select"]]);
  assert.match(got.list.groups[0].shown[0], /^下拉菜单Dropdown/);
});

test("at 390px: a button at the end of the index's bar opens the box over the bar; Enter goes; \"/\" and Esc; nothing sideways", async (t) => {
  const got = await run(t, "phone", 1280, 900, [], true);
  if (!got) return;
  const still = await run(t, "phone", 1280, 900, ["--force-prefers-reduced-motion"], true);
  if (!still) return;
  const { start, opened, modal, went, slash, esc, sheet } = got;
  assert.equal(start.width, 390, "a phone's width");
  assert.equal(start.sideways, 0, "no sideways scroll");
  assert.deepEqual([start.shownOpen, start.field], [true, false]);
  assert.ok(start.open.right <= start.width && start.open.left > start.sign.right, `the button at the bar's end, after its chevron: ${JSON.stringify([start.open, start.sign])}`);
  assert.ok(start.here.right <= start.open.left, "where you are, never under the button");
  assert.ok(Math.abs((start.open.top + start.open.bottom) / 2 - (start.bar.top + start.bar.bottom) / 2) <= 1, "centred on the bar");
  // open: over the bar, the box and Close on its line, focus in the box, inside the screen
  assert.deepEqual([opened.field, opened.focus, opened.expanded, opened.shownOpen, opened.sideways, opened.line], [true, true, "true", false, 0, [0, 0, 0, 1]]);
  assert.deepEqual([opened.fieldRect.top, opened.fieldRect.height, opened.fieldRect.left, opened.fieldRect.right], [start.bar.top, 48, 0, 390]);
  assert.ok(opened.box.left >= 16 && opened.box.right < opened.close.left && opened.close.right <= 390, `the box and Close inside: ${JSON.stringify([opened.box, opened.close])}`);
  // typing: the list inside the screen
  assert.deepEqual([modal.expanded, modal.active, modal.sideways], ["true", "Dialog", 0]);
  assert.ok(modal.rect.left >= 8 && modal.rect.right <= 382, `the list 8px inside the screen: ${JSON.stringify(modal.rect)}`);
  // Enter: there, under the head and the bar; the box shut, the button back
  assert.deepEqual([went.hash, went.focus, went.value, went.field, went.shownOpen, went.sideways], ["#dialog", "dialog-name", "", false, true, 0]);
  assert.deepEqual(went.asked, { id: "dialog", behavior: "smooth", block: "start" });
  // where it lands (at once, under reduced motion): under the running head and the index's bar
  const w = still.went;
  assert.deepEqual([w.hash, w.asked.behavior], ["#dialog", "instant"]);
  assert.ok(Math.abs(w.top - w.head) <= 2 && w.top >= w.bar.bottom, `below the bar: ${w.top}, the bar ends at ${w.bar.bottom}`);
  assert.equal(w.bar.top, 44, "the bar held under the running head");
  // "/" opens it; Esc closes it and focus goes back to its button
  assert.deepEqual(slash, { prevented: true, field: true, focus: true });
  assert.deepEqual(esc, { field: false, focus: true, shownOpen: true });
  // the open sheet holds focus: the search steps aside
  assert.deepEqual(sheet, { searchShown: false, prevented: false });
});
