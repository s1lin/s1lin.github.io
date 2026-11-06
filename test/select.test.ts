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
 * Select: on a server, the box is a button with role combobox wired to a hidden listbox and to the Field around it,
 * the chosen option's words (and tags) in it or the placeholder, and a native select the form reads, its options
 * from <option>/<optgroup> children or from data. In a real browser, with React running: the select-only combobox's
 * keys (the arrows without wrapping, Home, End, PageDown, letters typed ahead, Enter, Esc, Tab), disabled options heard
 * but not chosen, groups under their headings, the filter (focus in it, typing narrows, every word typed, nothing
 * matching said as a status, Enter chooses), the list's place (under the box and as wide, above it at the window's foot,
 * capped by its room), its look (the option under the arrows in reverse, the chosen one ticked and heavier, a thin
 * scrollbar, headings that stay at the top, Chinese at night), a press outside, onChange as a native select's, the
 * form (required, FormData, reset), the Field's label, hint and error, Input's heights, and Esc inside a Dialog. Vite
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-select-"));
after(() => rmSync(out, { recursive: true, force: true }));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");

/**
 * The parts, bundled for node as an app's server would import them (their stylesheets left out), with React and its
 * server renderer imported after the build, which sets NODE_ENV: one React, in one mode.
 */
async function serverParts() {
  writeFileSync(path.join(out, "server.ts"), ["select", "field", "words"].map((p) => `export * from ${JSON.stringify(path.join(ROOT, `src/ui/${p}.tsx`))};`).join("\n"));
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

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("Select on a server: a combobox button wired to a hidden listbox and to its Field, the chosen words or the placeholder, a native select for the form", async () => {
  const { Select, NativeSelect, Field, h, renderToString } = await serverParts();
  // the children a native select takes, in a Field with a hint and an error
  const m = renderToString(
    h(
      Field,
      { label: "Model", hint: "Pick one.", error: "Choose a model.", required: true, id: "model" },
      h(Select, { name: "model", placeholder: "Choose a model" }, h("option", { value: "a" }, "Alpha"), h("optgroup", { label: "Images" }, h("option", { value: "b", disabled: true }, "Beta"), h("option", null, "Gamma"))),
    ),
  ).replaceAll("<!-- -->", "");
  const button = m.match(/<button[^>]*>/)![0];
  assert.match(m, /<label[^>]*for="model"/);
  assert.match(button, /type="button"/);
  assert.match(button, /role="combobox"/);
  assert.match(button, /\sid="model"/);
  assert.match(button, /aria-haspopup="listbox"/);
  assert.match(button, /aria-expanded="false"/);
  assert.match(button, /aria-describedby="model-error model-hint"/);
  assert.match(button, /aria-invalid="true"/);
  assert.match(button, /aria-required="true"/);
  assert.doesNotMatch(button, /aria-activedescendant/);
  const listId = button.match(/aria-controls="([^"]+)"/)![1];
  assert.match(m, new RegExp(`<div class="s1-select__panel" popover="manual" hidden=""><div id="${esc(listId)}" role="listbox"`));
  assert.doesNotMatch(m, /role="option"/, "the options wait until the list opens");
  assert.match(m, /<span class="s1-select__placeholder">Choose a model<\/span>/);
  assert.match(m, /class="s1-select s1-select--md" data-invalid=""/);
  // the form's select: the name, required, an empty first option, every option with its value (its words when it has none)
  assert.match(m, /<select class="s1-select__native" tabindex="-1" aria-hidden="true" name="model" required=""><option value="" selected=""><\/option><option value="a">Alpha<\/option><option value="b" disabled="">Beta<\/option><option value="Gamma">Gamma<\/option><\/select>/);

  // options as data: the chosen one's name and tags in the box; small; disabled
  const keys = [
    { label: "Official", options: [{ value: "k1", label: "prod-backend", meta: ["Pro", "Claude"] }, { value: "k2", label: "nightly", description: "At 02:00" }] },
    { value: "k3", label: "loose" },
  ];
  const d = renderToString(h(Select, { options: keys, defaultValue: "k1", size: "sm", disabled: true, "aria-label": "Key", name: "key" })).replaceAll("<!-- -->", "");
  assert.match(d, /class="s1-select s1-select--sm" data-disabled=""/);
  assert.match(d, /<button[^>]*aria-label="Key"[^>]*disabled=""/);
  assert.match(d, /<span class="s1-select__value"><span class="s1-select__shown"><span class="s1-select__name">prod-backend<\/span><span class="s1-select__meta"><span class="s1-select__tag">Pro<\/span><span class="s1-select__tag">Claude<\/span><\/span><\/span>/);
  assert.match(d, /role="listbox" aria-label="Key"/);
  assert.match(d, /<select[^>]*name="key" disabled=""><option value=""><\/option><option value="k1" selected="">prod-backend<\/option><option value="k2">nightly<\/option><option value="k3">loose<\/option><\/select>/);
  // without a value, a default or a placeholder, the first option that can be chosen, as a native select
  const first = renderToString(h(Select, { "aria-label": "X" }, h("option", { value: "a", disabled: true }, "A"), h("option", { value: "b" }, "B"))).replaceAll("<!-- -->", "");
  assert.match(first, /<span class="s1-select__name">B<\/span>/);
  // NativeSelect: the browser's select, as Select was
  const n = renderToString(h(NativeSelect, { size: "sm", "aria-label": "Rows", defaultValue: "20" }, h("option", { value: "20" }, "20"))).replaceAll("<!-- -->", "");
  assert.match(n, /^<span class="s1-native-select s1-native-select--sm"><select class="s1-native-select__control" aria-label="Rows">/);
});

const ENTRY = `
import { useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Select } from ${JSON.stringify(path.join(ROOT, "src/ui/select.tsx"))};
import { Field } from ${JSON.stringify(path.join(ROOT, "src/ui/field.tsx"))};
import { Dialog } from ${JSON.stringify(path.join(ROOT, "src/ui/dialog.tsx"))};
import { S1Words } from ${JSON.stringify(path.join(ROOT, "src/ui/words.tsx"))};

const FAMILIES = ["Claude", "OpenAI", "Qwen", "GLM", "DeepSeek"];
const PLANS = ["Official", "Discount", "Own"];
const KEYS = Array.from({ length: 25 }, (_, i) => ({ value: "k" + i, label: ["prod", "batch", "probe", "eval", "web"][i % 5] + "-" + i, meta: [i % 2 ? "Pro" : "Basic", FAMILIES[i % 5]], plan: PLANS[Math.floor(i / 9)] }));
const GROUPS = PLANS.map((p) => ({ label: p, options: KEYS.filter((k) => k.plan === p).map(({ plan, ...k }) => k) }));
const ZH = PLANS.map((p, i) => ({ label: ["官方", "折扣", "自有"][i], options: KEYS.filter((k) => k.plan === p).map(({ plan, ...k }) => ({ ...k, meta: ["专业版", k.meta[1]] })) }));

const log = [];
function Short() {
  const [v, setV] = useState("");
  return (
    <form id="form" onSubmit={(e) => e.preventDefault()}>
      <div style={{ position: "absolute", top: 40, left: 40, width: 320 }}>
        <Field label="Model" hint="Pick one." required id="short">
          <Select name="model" placeholder="Choose a model" value={v} onChange={(e) => { log.push("change:" + e.target.tagName + ":" + e.target.value); setV(e.target.value); }} onValueChange={(x) => log.push("value:" + x)}>
            <option value="qwen">qwen-3.8</option>
            <option value="gpt" disabled>gpt-image-2</option>
            <option value="gemini">gemini-flash</option>
            <option value="glm">glm-4.6</option>
          </Select>
        </Field>
      </div>
      <div style={{ position: "absolute", top: 40, left: 420, width: 360 }}>
        <Field label="Key" id="long">
          <Select name="key" options={GROUPS} defaultValue="k5" filterLabel="Filter keys" />
        </Field>
      </div>
      <button type="reset" id="reset">Reset</button>
    </form>
  );
}
function InDialog() {
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onClose={() => setOpen(false)} title="Where">
      <Select id="dlg" aria-label="Region"><option>Nearest</option><option>Singapore</option></Select>
      <Select id="dlg-long" aria-label="Key" options={GROUPS} />
    </Dialog>
  );
}
const root = createRoot(document.getElementById("app"));
const mode = location.search.slice(1);
flushSync(() =>
  root.render(
    mode === "dialog" ? <InDialog /> : (
    <>
      <Short />
      <div style={{ position: "absolute", top: 40, left: 860, width: 200 }}><Select id="small" size="sm" aria-label="Rows" defaultValue="50"><option value="20">20</option><option value="50">50</option></Select></div>
      <div style={{ position: "absolute", top: 160, left: 40, width: 320 }}><Field label="Plan" error="Choose a plan." id="err"><Select placeholder="Choose"><option>Pro</option></Select></Field></div>
      <div style={{ position: "absolute", top: 160, left: 420, width: 200 }}><Select id="off" aria-label="Off" disabled><option>One</option></Select></div>
      <div lang="zh-CN" data-theme="dark" style={{ position: "absolute", top: 260, left: 40, width: 320 }}><S1Words words={{ filter: "筛选", noMatches: "没有匹配项" }}><Select id="zh" aria-label="密钥" options={ZH} defaultValue="k3" /></S1Words></div>
      <div style={{ position: "absolute", bottom: 10, left: 40, width: 320 }}><Select id="foot" aria-label="Foot" options={GROUPS} /></div>
      <span id="else" tabIndex={0}>else</span>
    </>),
  ),
);

const got = { log };
const $ = (s) => document.querySelector(s);
const box = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) }; };
const listOf = (id) => document.getElementById($("#" + id).getAttribute("aria-controls"));
const panelOf = (id) => listOf(id).parentElement;
const key = (el, k, o = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...o }));
const press = (el) => el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
const typeIn = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); };
const words = (el) => el ? el.querySelector(".s1-select__name").textContent : null;
const state = (id) => {
  const b = $("#" + id);
  const a = document.activeElement;
  const owner = a && a.classList.contains("s1-select__filter") ? a : b;
  const act = owner.getAttribute("aria-activedescendant");
  const v = b.querySelector(".s1-select__value > .s1-select__shown");
  return { shown: v ? words(v) : null, expanded: b.getAttribute("aria-expanded"), active: act ? words(document.getElementById(act)) : null, focus: a === b ? "button" : a && a.classList.contains("s1-select__filter") ? "filter" : a && a.id };
};
const steps = [];
const step = (f) => steps.push(f);

if (mode === "dialog") {
  step(() => { $("#dlg").focus(); key($("#dlg"), "ArrowDown"); });
  step(() => { got.dlgOpen = $("#dlg").getAttribute("aria-expanded"); key(document.activeElement, "Escape"); });
  step(() => {
    got.afterEsc = { list: $("#dlg").getAttribute("aria-expanded"), dialog: document.querySelector("dialog").open, focus: document.activeElement.id };
    press($("#dlg-long"));
  });
  step(() => { got.longOpen = { expanded: $("#dlg-long").getAttribute("aria-expanded"), filter: document.activeElement.classList.contains("s1-select__filter") }; key(document.activeElement, "Escape"); });
  step(() => { got.afterLongEsc = { list: $("#dlg-long").getAttribute("aria-expanded"), dialog: document.querySelector("dialog").open, focus: document.activeElement.id }; });
} else {
  step(() => {
    const b = $("#short");
    got.heights = { md: box(b).height, sm: box($("#small")).height };
    got.field = { label: b.labels.length && b.labels[0].textContent, describedBy: b.getAttribute("aria-describedby"), hint: document.getElementById(b.getAttribute("aria-describedby")).textContent, required: b.getAttribute("aria-required"), list: listOf("short").getAttribute("aria-labelledby") === b.labels[0].id };
    const e = $("#err");
    got.error = { invalid: e.getAttribute("aria-invalid"), describedBy: e.getAttribute("aria-describedby"), boxInvalid: e.parentElement.hasAttribute("data-invalid") };
    got.closed = { expanded: b.getAttribute("aria-expanded"), placeholder: b.querySelector(".s1-select__placeholder").textContent, options: listOf("short").children.length, valid: $("#form").checkValidity() };
    b.focus();
    key(b, "ArrowDown");
  });
  step(() => {
    const p = panelOf("short");
    const opt = p.querySelector("[data-active]");
    const s = getComputedStyle(opt);
    got.opened = { ...state("short"), top: p.matches(":popover-open"), box: box($("#short")), panel: box(p), filter: !!p.querySelector(".s1-select__filter"), options: [...p.querySelectorAll("[role=option]")].map(words), look: [s.backgroundColor, s.color, getComputedStyle(p).color, getComputedStyle(p).backgroundColor] };
    key($("#short"), "ArrowDown");
  });
  step(() => {
    const act = document.getElementById($("#short").getAttribute("aria-activedescendant"));
    got.disabled = { ...state("short"), aria: act.getAttribute("aria-disabled") };
    key($("#short"), "Enter");
  });
  step(() => {
    got.notChosen = state("short");
    key($("#short"), "End");
  });
  step(() => {
    got.end = state("short").active;
    key($("#short"), "ArrowDown");
  });
  step(() => {
    got.noWrap = state("short").active;
    key($("#short"), "Home");
  });
  step(() => {
    got.home = state("short").active;
    key($("#short"), "ArrowUp");
  });
  step(() => {
    got.noWrapUp = state("short").active;
    key($("#short"), "ArrowDown");
    key($("#short"), "ArrowDown");
  });
  step(() => {
    got.twice = state("short").active;
    key($("#short"), "Enter");
  });
  step(() => {
    got.chosen = { ...state("short"), native: $("#short").parentElement.querySelector("select").value, valid: $("#form").checkValidity(), data: new FormData($("#form")).get("model") };
    key($("#short"), "ArrowUp");
  });
  step(() => {
    const sel = panelOf("short").querySelector("[aria-selected=true]");
    got.reopened = { ...state("short"), chosen: words(sel), tick: !!sel.querySelector(".s1-select__tick svg"), weight: getComputedStyle(sel.querySelector(".s1-select__name")).fontWeight };
    key($("#short"), "Escape");
  });
  step(() => {
    got.esc = state("short");
    // type-ahead: a letter opens the list on the next option that starts with it; the same letter again goes round
    key($("#short"), "g");
  });
  step(() => {
    got.typed1 = state("short");
    key($("#short"), "g");
  });
  step(() => {
    got.typed2 = state("short");
    key($("#short"), "g");
  });
  step(() => {
    got.typed3 = state("short");
    key($("#short"), "Tab");
  });
  step(() => {
    got.tabbed = state("short").expanded;
    // the long list: a click opens it, focus in the filter, on the chosen option, in its groups with their tags
    press($("#long"));
  });
  step(() => {
    const p = panelOf("long");
    const l = listOf("long");
    const f = p.querySelector(".s1-select__filter");
    got.long = {
      ...state("long"),
      filterRole: f.getAttribute("role"), filterName: f.getAttribute("aria-label"), filterControls: f.getAttribute("aria-controls") === l.id,
      groups: [...l.querySelectorAll("[role=group]")].map((g) => document.getElementById(g.getAttribute("aria-labelledby")).textContent),
      options: l.querySelectorAll("[role=option]").length,
      tags: [...l.querySelectorAll("[role=option]")][0].querySelector(".s1-select__meta").textContent,
      sep: getComputedStyle([...l.querySelectorAll(".s1-select__tag")][1], "::before").content,
      scrolls: l.scrollHeight > l.clientHeight, scrollbar: getComputedStyle(l).scrollbarWidth, panelHeight: box(p).height,
      box: box($("#long")), panel: box(p),
    };
    key(f, "PageDown");
  });
  step(() => {
    got.pageDown = state("long").active;
    const l = listOf("long");
    l.scrollTop = 200;
    l.dispatchEvent(new Event("scroll"));
  });
  step(() => {
    const l = listOf("long");
    const top = l.getBoundingClientRect().top;
    const stuck = [...l.querySelectorAll(".s1-select__label")].map((h) => Math.round(h.getBoundingClientRect().top - top));
    got.sticky = stuck;
    typeIn(panelOf("long").querySelector(".s1-select__filter"), "GLM");
  });
  step(() => {
    const p = panelOf("long");
    got.glm = { ...state("long"), options: [...p.querySelectorAll("[role=option]")].map(words), count: p.querySelector(".s1-select__count").textContent };
    typeIn(p.querySelector(".s1-select__filter"), "discount glm");
  });
  step(() => {
    const p = panelOf("long");
    got.both = [...p.querySelectorAll("[role=option]")].map(words);
    typeIn(p.querySelector(".s1-select__filter"), "zzz");
  });
  step(() => {
    const p = panelOf("long");
    got.nothing = { ...state("long"), status: p.querySelector("[role=status]").textContent, options: p.querySelectorAll("[role=option]").length, list: getComputedStyle(listOf("long")).display };
    typeIn(p.querySelector(".s1-select__filter"), "probe");
  });
  step(() => {
    got.probe = [...panelOf("long").querySelectorAll("[role=option]")].map(words);
    key(document.activeElement, "ArrowDown");
  });
  step(() => {
    got.probeDown = state("long").active;
    key(document.activeElement, "Enter");
  });
  step(() => {
    got.filterChose = { ...state("long"), data: new FormData($("#form")).get("key") };
    // a letter on the box goes into the filter, which opens with it
    key($("#long"), "w");
  });
  step(() => {
    const f = panelOf("long").querySelector(".s1-select__filter");
    got.letter = { ...state("long"), text: f.value, caret: f.selectionStart, options: [...panelOf("long").querySelectorAll("[role=option]")].map(words) };
    key(f, "Escape");
  });
  step(() => {
    got.filterEsc = { ...state("long"), status: panelOf("long").querySelector("[role=status]").textContent };
    // a press outside closes it and leaves focus alone
    press($("#long"));
  });
  step(() => {
    got.reclicked = state("long").expanded;
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
  step(() => {
    got.outside = state("long").expanded;
    // a click on an option chooses it
    press($("#short"));
  });
  step(() => {
    const o = [...panelOf("short").querySelectorAll("[role=option]")].find((x) => words(x) === "glm-4.6");
    o.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    o.click();
  });
  step(() => {
    got.clicked = state("short");
    // a click on a disabled option chooses nothing and leaves it open
    press($("#short"));
  });
  step(() => {
    const o = [...panelOf("short").querySelectorAll("[role=option]")].find((x) => words(x) === "gpt-image-2");
    o.click();
  });
  step(() => {
    got.clickedOff = state("short");
    key($("#short"), "Escape");
    // the form's reset: the Select that keeps its own goes back to its first choice
    $("#reset").click();
  });
  step(() => {
    got.reset = { shown: state("long").shown, native: $("#long").parentElement.querySelector("select").value };
    // disabled: nothing opens
    press($("#off"));
    key($("#off"), "ArrowDown");
  });
  step(() => {
    got.off = { expanded: $("#off").getAttribute("aria-expanded"), disabled: $("#off").disabled };
    // at the window's foot: above the box, capped by its room
    $("#foot").focus();
    key($("#foot"), "ArrowDown");
  });
  step(() => {
    const p = panelOf("foot");
    got.foot = { box: box($("#foot")), panel: box(p), room: p.style.getPropertyValue("--s1-select-room"), side: p.dataset.side, max: getComputedStyle(p).maxHeight };
    key(document.activeElement, "Escape");
    // Chinese at night
    press($("#zh"));
  });
  step(() => {
    const p = panelOf("zh");
    const h = p.querySelector(".s1-select__label");
    const hs = getComputedStyle(h);
    const tag = getComputedStyle(p.querySelector(".s1-select__meta"));
    const f = p.querySelector(".s1-select__filter");
    const flat = (v) => (v === "normal" ? "0px" : v);
    got.zh = { bg: getComputedStyle(p).backgroundColor, ink: getComputedStyle(p).color, head: [hs.fontSize, flat(hs.letterSpacing), hs.textTransform, h.textContent], tag: [tag.fontSize, flat(tag.letterSpacing)], filter: f.getAttribute("aria-label") };
    typeIn(f, "无");
  });
  step(() => {
    got.zhEmpty = panelOf("zh").querySelector("[role=status]").textContent;
    key(document.activeElement, "Escape");
  });
}

let i = 0;
const next = () => {
  if (i < steps.length) { steps[i++](); setTimeout(next, 120); }
  else document.getElementById("out").textContent = JSON.stringify(got);
};
setTimeout(next, 120);
`;

test("Select in a browser: the select-only combobox's keys, groups, the filter, a click, the list's place and look, onChange, the form, the Field, heights, Chinese at night, inside a Dialog", async (t) => {
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
      dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,700", "--virtual-time-budget=20000", "--dump-dom", `${pathToFileURL(page).href}?${mode}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
    } catch (e) {
      return t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
    }
    const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
    assert.ok(text, `${mode}: the page printed nothing`);
    return JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  };

  const got = run("page");
  if (!got) return;
  // Input's heights; the Field's label names it, its hint and error describe it
  assert.deepEqual(got.heights, { md: 40, sm: 30 });
  assert.deepEqual(got.field, { label: "Model*", describedBy: "short-hint", hint: "Pick one.", required: "true", list: true });
  assert.deepEqual(got.error, { invalid: "true", describedBy: "err-error", boxInvalid: true });
  assert.deepEqual(got.closed, { expanded: "false", placeholder: "Choose a model", options: 0, valid: false });
  // ↓ opens it, in the top layer under the box and at least as wide, on the first option (nothing chosen); a short list has no filter
  assert.deepEqual([got.opened.expanded, got.opened.active, got.opened.focus, got.opened.top, got.opened.filter], ["true", "qwen-3.8", "button", true, false]);
  assert.deepEqual(got.opened.options, ["qwen-3.8", "gpt-image-2", "gemini-flash", "glm-4.6"]);
  assert.equal(got.opened.panel.top, got.opened.box.bottom + 4);
  assert.equal(got.opened.panel.left, got.opened.box.left);
  assert.ok(got.opened.panel.width >= got.opened.box.width);
  // the option under the arrows in reverse
  assert.equal(got.opened.look[0], got.opened.look[2]);
  assert.equal(got.opened.look[1], got.opened.look[3]);
  // a disabled option is reached and heard, and Enter does not choose it
  assert.deepEqual([got.disabled.active, got.disabled.aria], ["gpt-image-2", "true"]);
  assert.deepEqual([got.notChosen.expanded, got.notChosen.shown], ["true", null]);
  // End, Home; the arrows stop at the ends
  assert.equal(got.end, "glm-4.6");
  assert.equal(got.noWrap, "glm-4.6");
  assert.equal(got.home, "qwen-3.8");
  assert.equal(got.noWrapUp, "qwen-3.8");
  assert.equal(got.twice, "gemini-flash");
  // Enter chooses: the words in the box, closed, focus on it; onChange is the native select's, the form has the value
  assert.deepEqual(got.chosen, { shown: "gemini-flash", expanded: "false", active: null, focus: "button", native: "gemini", valid: true, data: "gemini" });
  assert.ok(got.log.includes("change:SELECT:gemini") && got.log.includes("value:gemini"), JSON.stringify(got.log));
  // ↑ opens it on the chosen option, ticked and heavier; Esc closes and keeps focus
  assert.deepEqual([got.reopened.expanded, got.reopened.active, got.reopened.chosen, got.reopened.tick, got.reopened.weight], ["true", "gemini-flash", "gemini-flash", true, "600"]);
  assert.deepEqual(got.esc, { shown: "gemini-flash", expanded: "false", active: null, focus: "button" });
  // letters: the next option that starts with them, opening the list; the same letter again goes round
  assert.deepEqual([got.typed1.expanded, got.typed1.active], ["true", "glm-4.6"]);
  assert.equal(got.typed2.active, "gpt-image-2");
  assert.equal(got.typed3.active, "gemini-flash");
  assert.equal(got.tabbed, "false");
  // a click opens the long list with focus in its filter (itself a combobox for the list), on the chosen option, in groups with tags
  assert.deepEqual([got.long.expanded, got.long.focus, got.long.active, got.long.filterRole, got.long.filterName, got.long.filterControls], ["true", "filter", "prod-5", "combobox", "Filter keys", true]);
  assert.deepEqual(got.long.groups, ["Official", "Discount", "Own"]);
  assert.equal(got.long.options, 25);
  assert.equal(got.long.tags, "BasicClaude");
  assert.match(got.long.sep, /·/);
  // never taller than 360px; it scrolls inside, on a thin bar
  assert.ok(got.long.panelHeight <= 360, `panel ${got.long.panelHeight}px`);
  assert.deepEqual([got.long.scrolls, got.long.scrollbar], [true, "thin"]);
  assert.equal(got.long.panel.top, got.long.box.bottom + 4);
  // PageDown: ten on
  assert.equal(got.pageDown, "prod-15");
  // a group's heading stays at the top as its options scroll under it
  assert.ok(got.sticky.some((top: number) => top >= -1 && top <= 1), `headings at ${got.sticky}`);
  // the filter: by tag, every word typed, nothing matching said as a status, then a choice with Enter
  assert.deepEqual(got.glm.options, ["eval-3", "eval-8", "eval-13", "eval-18", "eval-23"]);
  assert.deepEqual([got.glm.active, got.glm.count, got.glm.focus], ["eval-3", "5/25", "filter"]);
  assert.deepEqual(got.both, ["eval-13"]);
  assert.deepEqual([got.nothing.status, got.nothing.options, got.nothing.list, got.nothing.active], ["Nothing matches", 0, "none", null]);
  assert.deepEqual(got.probe, ["probe-2", "probe-7", "probe-12", "probe-17", "probe-22"]);
  assert.equal(got.probeDown, "probe-7");
  assert.deepEqual(got.filterChose, { shown: "probe-7", expanded: "false", active: null, focus: "button", data: "k7" });
  // a letter on the box opens the filter with it, the caret after it
  assert.deepEqual([got.letter.expanded, got.letter.focus, got.letter.text, got.letter.caret], ["true", "filter", "w", 1]);
  assert.ok(got.letter.options.includes("web-4") && !got.letter.options.includes("prod-0"), JSON.stringify(got.letter.options));
  // Esc in the filter: closed, focus back on the box, nothing said
  assert.deepEqual([got.filterEsc.expanded, got.filterEsc.focus, got.filterEsc.status], ["false", "button", ""]);
  // a press outside closes it
  assert.deepEqual([got.reclicked, got.outside], ["true", "false"]);
  // a click chooses; a click on a disabled option does not
  assert.deepEqual([got.clicked.shown, got.clicked.expanded, got.clicked.focus], ["glm-4.6", "false", "button"]);
  assert.deepEqual([got.clickedOff.shown, got.clickedOff.expanded], ["glm-4.6", "true"]);
  // a form's reset puts the Select that keeps its own back on its first choice
  assert.deepEqual(got.reset, { shown: "prod-5", native: "k5" });
  assert.deepEqual(got.off, { expanded: "false", disabled: true });
  // at the window's foot: above the box, capped by its room
  assert.equal(got.foot.panel.bottom, got.foot.box.top - 4);
  assert.equal(got.foot.side, "top");
  assert.match(got.foot.room, /^\d+px$/);
  // Chinese at night: the night's paper and ink, headings and tags at 12px and never tracked or cased, words from S1Words
  assert.deepEqual([got.zh.bg, got.zh.ink], ["rgb(15, 15, 15)", "rgb(237, 237, 237)"]);
  assert.deepEqual(got.zh.head.slice(0, 3), ["12px", "0px", "none"]);
  assert.equal(got.zh.head[3], "官方");
  assert.deepEqual(got.zh.tag, ["12px", "0px"]);
  assert.equal(got.zh.filter, "筛选");
  assert.equal(got.zhEmpty, "没有匹配项");

  // in a Dialog: Esc closes the list (from the box, and from the filter) and keeps the dialog open, focus on the box
  const dialog = run("dialog");
  if (!dialog) return;
  assert.equal(dialog.dlgOpen, "true");
  assert.deepEqual(dialog.afterEsc, { list: "false", dialog: true, focus: "dlg" });
  assert.deepEqual(dialog.longOpen, { expanded: "true", filter: true });
  assert.deepEqual(dialog.afterLongEsc, { list: "false", dialog: true, focus: "dlg-long" });
});
