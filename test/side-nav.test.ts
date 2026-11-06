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
 * SideNav and EmptyState's mark in a real browser, with React running: the current item's 2px bar, the rail's
 * squares and hidden labels, the phone's bar and its sheet (it opens, focus goes in, Tab stays in it, Esc, a tap
 * outside and a choice close it), and the mark's size. Vite bundles a small page from src/ui/ as an app would;
 * headless Chrome runs it at a desktop's width and a phone's, its script presses the bar and the keys and prints
 * what it found. Skipped where there is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-sidenav-"));
after(() => rmSync(out, { recursive: true, force: true }));

const ENTRY = `
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { SideNav } from ${JSON.stringify(path.join(ROOT, "src/ui/side-nav.tsx"))};
import { EmptyState } from ${JSON.stringify(path.join(ROOT, "src/ui/empty-state.tsx"))};

const svg = <svg viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="12" height="12" /></svg>;
const sections = [
  { id: "ch", number: "01", title: "Parts", sections: [{ id: "fam", title: "Editorial", count: 2, items: [{ id: "a", label: "Button", href: "#a" }, { id: "b", label: "Kicker", href: "#b" }] }] },
  { id: "chats", title: "Chats", items: [{ id: "c1", label: "Video", icon: svg, meta: "2m", status: "info", statusLabel: "running", onSelect: () => {} }, { id: "c2", label: "Thesis", icon: svg, onSelect: () => {} }] },
];
const chosen = [];
// Two sidebars of 24 pages, at the last: one whose panel scrolls (the docs' index), one whose tree scrolls by itself
// with its footer held under it (an app's column: the console's and the admin's, 2026-11-06).
const many = [{ id: "all", title: "Pages", items: Array.from({ length: 24 }, (_, n) => ({ id: "p" + n, label: "Page " + n, href: "#p" + n })) }];
const sheet = document.createElement("style");
sheet.textContent = \`
  #by-panel .s1-sidenav__panel { max-height: 200px; overflow-y: auto; }
  #by-tree { height: 240px; }
  #by-tree .s1-sidenav, #by-tree .s1-sidenav__panel { height: 100%; }
  #by-tree .s1-sidenav__panel { display: flex; flex-direction: column; }
  #by-tree .s1-sidenav__tree { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
  #by-tree .s1-sidenav__foot { flex: none; margin-top: 0; }
\`;
document.head.append(sheet);
const root = createRoot(document.getElementById("app"));
flushSync(() =>
  root.render(
    <>
      <div id="desk" style={{ width: 280 }}><SideNav label="Desk" title="Index" sections={sections} current="b" /></div>
      <div id="rail" style={{ width: 56 }}><SideNav label="Rail" title="Aha" rail sections={sections} current="c1" /></div>
      <div id="phone"><SideNav label="Phone" title="Index" sheet={900} sections={sections} current="b" onNavigate={(t) => chosen.push(t.id)} /></div>
      <div id="fold" style={{ width: 280 }}><SideNav label="Fold" sections={[{ id: "shut", title: "Video", collapsible: true, action: <button type="button">+</button>, items: [{ id: "v1", label: "Clip", href: "#v1" }] }, { id: "open", title: "Tasks", collapsible: true, items: [{ id: "t1", label: "Trip", href: "#t1" }] }]} defaultExpanded={["open"]} /></div>
      <div id="em"><EmptyState mark={svg} title="No friends yet" /><EmptyState size="sm" mark={svg} title="None" /></div>
      <div id="by-panel" style={{ width: 280 }}><SideNav label="By panel" sections={many} current="p23" /></div>
      <div id="by-tree" style={{ width: 280 }}><SideNav label="By tree" sections={many} current="p23" footer={<p>Account</p>} /></div>
    </>,
  ),
);

const got = {};
const $ = (s) => document.querySelector(s);
const style = (s) => getComputedStyle($(s));
const box = (s) => { const r = $(s).getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
const ink = getComputedStyle(document.documentElement).getPropertyValue("--s1-ink").trim();
const probe = document.createElement("span");
document.body.append(probe);
const rgb = (c) => { probe.style.color = c; return getComputedStyle(probe).color; };
got.ink = rgb(ink);
const phone = location.search.includes("phone");
const steps = [];
const step = (f) => steps.push(f);

if (!phone) {
  step(() => {
    const cur = style('#desk [aria-current="page"]');
    const other = style('#desk a[href="#a"]');
    got.desk = { current: [cur.borderLeftWidth, cur.borderLeftStyle, cur.borderLeftColor, cur.color, cur.fontWeight, cur.backgroundColor], other: [other.borderLeftWidth, other.color], heads: $("#desk .s1-sidenav__heading[aria-current]") ? $("#desk .s1-sidenav__heading[aria-current]").textContent : null };
    got.deskSheet = { bar: style("#phone .s1-sidenav__bar").display, panel: style("#phone .s1-sidenav__panel").display };
    const items = [...document.querySelectorAll("#rail .s1-sidenav__item")];
    got.rail = {
      sizes: items.map((i) => { const r = i.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }),
      label: box("#rail .s1-sidenav__label"),
      titles: items.map((i) => i.getAttribute("title")),
      current: style('#rail [aria-current="page"]').boxShadow,
      heads: style("#rail .s1-sidenav__head").display,
    };
    // A folding head's sign is a hairline chevron (right folded, down open), never a "+" beside the family's own "+".
    const sign = (open) => { const el = $('#fold .s1-sidenav__heading[aria-expanded="' + open + '"] .s1-sidenav__sign'); const b = getComputedStyle(el, "::before"); return { bg: getComputedStyle(el).backgroundImage, lines: [b.borderRightWidth, b.borderBottomWidth, b.borderTopWidth, b.borderLeftWidth], turn: b.transform }; };
    got.fold = { shut: sign("false"), open: sign("true") };
    const top = (s) => $(s).getBoundingClientRect().top;
    const shown = (s, within) => { const a = $(s).getBoundingClientRect(), b = $(within).getBoundingClientRect(); return a.top >= b.top && a.bottom <= b.bottom; };
    const foot = top("#by-tree .s1-sidenav__foot");
    got.follow = {
      panel: { scrolled: $("#by-panel .s1-sidenav__panel").scrollTop > 0, shown: shown('#by-panel [aria-current="page"]', "#by-panel .s1-sidenav__panel") },
      tree: { scrolled: $("#by-tree .s1-sidenav__tree").scrollTop > 0, panel: $("#by-tree .s1-sidenav__panel").scrollTop, shown: shown('#by-tree [aria-current="page"]', "#by-tree .s1-sidenav__tree"), footEnd: Math.round($("#by-tree .s1-sidenav__foot").getBoundingClientRect().bottom - $("#by-tree").getBoundingClientRect().bottom) },
    };
    $("#by-tree .s1-sidenav__tree").scrollTop = 0;
    got.follow.tree.footMoved = top("#by-tree .s1-sidenav__foot") - foot;
    got.mark = { md: box("#em .s1-empty--md .s1-empty__own"), sm: box("#em .s1-empty--sm .s1-empty__own"), color: style("#em .s1-empty__own").color, ink2: rgb(getComputedStyle(document.documentElement).getPropertyValue("--s1-ink-2").trim()), frame: !!$("#em .s1-empty__mark") };
  });
} else {
  const bar = () => $("#phone .s1-sidenav__bar");
  const panel = () => $("#phone .s1-sidenav__panel");
  const state = () => ({ open: bar().getAttribute("aria-expanded"), panel: getComputedStyle(panel()).display, position: getComputedStyle(panel()).position, scrim: !!$("#phone .s1-sidenav__scrim"), focus: document.activeElement === bar() ? "bar" : panel().contains(document.activeElement) ? "sheet:" + (document.activeElement.getAttribute("aria-current") ?? document.activeElement.textContent.trim()) : document.activeElement.tagName });
  const key = (k, shift = false) => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: k, shiftKey: shift, bubbles: true, cancelable: true }));
  const focusables = () => [...panel().querySelectorAll("a[href], button:not([disabled])")];
  step(() => { got.closed = { bar: getComputedStyle(bar()).display, barTurn: getComputedStyle($("#phone .s1-sidenav__sign"), "::before").transform, ...state() }; bar().click(); });
  step(() => { got.opened = state(); const all = focusables(); all[all.length - 1].focus(); key("Tab"); });
  step(() => { got.tabFromLast = state().focus; key("Tab", true); });
  step(() => { got.shiftTabFromBar = state().focus === "bar" ? "bar" : document.activeElement === focusables().at(-1) ? "last" : state().focus; key("Escape"); });
  step(() => { got.escaped = state(); bar().click(); });
  step(() => { $("#phone .s1-sidenav__scrim").click(); });
  step(() => { got.scrim = state(); bar().click(); });
  step(() => { [...panel().querySelectorAll("button.s1-sidenav__item")].find((b) => b.textContent.includes("Thesis")).click(); });
  step(() => { got.chose = { ...state(), chosen: [...chosen] }; });
}
let i = 0;
const next = () => {
  if (i < steps.length) { steps[i++](); setTimeout(next, 120); }
  else document.getElementById("out").textContent = JSON.stringify(got);
};
setTimeout(next, 120);
`;

test("SideNav in a browser: the current bar, the rail, the phone's sheet (opens, holds focus, closes on Esc, a tap outside, a choice); EmptyState's mark", async (t) => {
  const bin = chrome();
  if (!bin) return t.skip("no Chrome here: set CHROME to run it");
  symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");
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
  writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);

  const run = (mode: "desk" | "phone", size: string) => {
    let dom: string;
    try {
      dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", `--window-size=${size}`, "--virtual-time-budget=10000", "--dump-dom", `${pathToFileURL(page).href}?${mode}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
    } catch (e) {
      return t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
    }
    const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
    assert.ok(text, `${mode}: the page printed nothing`);
    return JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  };

  const desk = run("desk", "1280,900");
  if (!desk) return;
  // the current item: a 2px bar in the ink, the ink, 500, no ground; the others on the 1px rail
  assert.deepEqual(desk.desk.current.slice(0, 2), ["2px", "solid"]);
  assert.equal(desk.desk.current[2], desk.ink);
  assert.equal(desk.desk.current[3], desk.ink);
  assert.equal(desk.desk.current[4], "500");
  assert.equal(desk.desk.current[5], "rgba(0, 0, 0, 0)", "no tinted ground");
  assert.equal(desk.desk.other[0], "1px");
  // at a desktop's width the sheet's bar is away and the tree is in the page
  assert.deepEqual(desk.deskSheet, { bar: "none", panel: "block" });
  // the rail: 40px squares, the labels for screen readers and as tooltips, the current one barred, no heads
  for (const s of desk.rail.sizes) assert.deepEqual(s, [40, 40]);
  assert.deepEqual(desk.rail.label, [1, 1]);
  assert.deepEqual(desk.rail.titles.slice(0, 2), ["Button", "Kicker"]);
  assert.match(desk.rail.current, /2px 0px 0px 0px inset/);
  assert.equal(desk.rail.heads, "none");
  // EmptyState's mark: 56px, 40px at sm, in the second ink, and no frame
  // rotate(-45deg) points right, rotate(45deg) down: the matrices Chrome reports for them
  const turn = (deg) => { const r = (deg * Math.PI) / 180, c = Math.cos(r).toFixed(6), n = Math.sin(r).toFixed(6), m = (-Math.sin(r)).toFixed(6); return `matrix(${c}, ${n}, ${m}, ${c}, 0, 0)`.replace(/-0\.000000/g, "0.000000"); };
  for (const [k, deg] of [["shut", -45], ["open", 45]]) {
    assert.equal(desk.fold[k].bg, "none", `${k}: no "+" or "−" drawn on the sign`);
    assert.deepEqual(desk.fold[k].lines, ["1px", "1px", "0px", "0px"], `${k}: two hairlines`);
    assert.equal(desk.fold[k].turn.replace(/(\d\.\d{6})\d*/g, "$1"), turn(deg), `${k}: the chevron points ${deg < 0 ? "right" : "down"}`);
  }
  // the current item kept in view by scrolling the box that scrolls: the panel, or the tree under which the footer holds
  assert.deepEqual(desk.follow.panel, { scrolled: true, shown: true }, "a panel that scrolls is scrolled to the current item");
  assert.deepEqual(desk.follow.tree, { scrolled: true, panel: 0, shown: true, footEnd: 0, footMoved: 0 }, "a tree that scrolls by itself is scrolled, the footer held at the foot");
  assert.deepEqual(desk.mark.md, [56, 56]);
  assert.deepEqual(desk.mark.sm, [40, 40]);
  assert.equal(desk.mark.color, desk.mark.ink2);
  assert.equal(desk.mark.frame, false);

  const phone = run("phone", "390,844");
  if (!phone) return;
  assert.equal(phone.closed.bar, "flex", "a phone: the bar");
  assert.equal(phone.closed.panel, "none", "the tree behind it");
  assert.equal(phone.closed.open, "false");
  assert.equal(phone.closed.barTurn, "matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)", "the bar's chevron points down while the sheet is shut");
  assert.deepEqual([phone.opened.open, phone.opened.panel, phone.opened.position, phone.opened.scrim], ["true", "block", "absolute", true], "pressed: the sheet over the page, the scrim behind it");
  assert.equal(phone.opened.focus, "sheet:page", "focus goes to the current item");
  assert.equal(phone.tabFromLast, "bar", "Tab from the last goes round to the bar");
  assert.equal(phone.shiftTabFromBar, "last", "Shift+Tab from the bar goes round to the last");
  assert.deepEqual([phone.escaped.open, phone.escaped.panel, phone.escaped.focus], ["false", "none", "bar"], "Esc closes it and gives focus back to the bar");
  assert.deepEqual([phone.scrim.open, phone.scrim.panel, phone.scrim.scrim], ["false", "none", false], "a tap outside closes it");
  assert.deepEqual([phone.chose.open, phone.chose.panel], ["false", "none"], "a choice closes it");
  assert.deepEqual(phone.chose.chosen, ["c2"]);
});
