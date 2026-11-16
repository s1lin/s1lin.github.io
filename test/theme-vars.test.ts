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
 * The variables a theme may set on three parts, in a real browser, each read with today's look as its fallback
 * (owner, 2026-11-16, for the admin console: "checked status should have color, right now all colors are grey" and "All
 * tables columns rows should be left aligned"):
 *   StatusSwitch: --s1-status-on, --s1-status-off (the current word), --s1-status-on-dot, --s1-status-off-dot (its dot);
 *   Checkbox: --s1-check-on (a ticked or mixed box's fill and line), --s1-check-tick (its tick or bar);
 *   Table: --s1-table-num-align, --s1-table-num-sort, --s1-table-num-wrap (a figure's cells and header at the start).
 * Unset, the parts look as before: the on word in the ok hue (the ink without one), the off word in the ink, both dots in
 * --s1-here; a ticked box in the ink with a paper tick; figures at the column's end, a figure's sort arrow before its
 * words. Set, each follows. And two things every table keeps, themed or not: a sortable header that wraps keeps its lines
 * at the column's side (a button's own centre was showing), and a short first word of a status in a cell ("On", 开)
 * starts at the column's edge, not centred in its 24px. Skipped where there is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-theme-vars-"));
after(() => rmSync(out, { recursive: true, force: true }));

const part = (f: string) => JSON.stringify(path.join(ROOT, "src/ui", f));
const ENTRY = `
window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { StatusSwitch } from ${part("status-switch.tsx")};
import { Checkbox } from ${part("checkbox.tsx")};
import { Table } from ${part("table.tsx")};

// a theme, as the admin's sets it by day (#00782f, its bad red #c0261b, its cyan #0891b2 with a white tick)
const THEME = {
  "--s1-ok": "#1d733b",
  "--s1-status-on": "#00782f", "--s1-status-on-dot": "#00782f", "--s1-status-off": "#c0261b", "--s1-status-off-dot": "#c0261b",
  "--s1-check-on": "#0891b2", "--s1-check-tick": "#ffffff",
  "--s1-table-num-align": "start", "--s1-table-num-sort": "row", "--s1-table-num-wrap": "normal",
};
const ROWS = [{ id: 1, name: "Claude Standard", n: "12", on: true }, { id: 2, name: "Grok", n: "1,204", on: false }];
const sort = { sort: { key: "name", dir: "asc" }, onSortChange: () => {} };
const columns = [
  { key: "name", header: "Name", sortable: true },
  { key: "n", header: "Requests", numeric: true, sortable: true },
  { key: "on", header: "Status", width: 120, cell: (r) => <StatusSwitch label={"Status of " + r.name} words={{ on: "On", off: "Off" }} value={r.on} /> },
];
const fitted = [
  { key: "name", header: "Name", sortable: true },
  { key: "last", header: "Last active", sortable: true, width: 96, cell: () => "3h ago" },
  { key: "spend", header: "Spend today", numeric: true, sortable: true, width: 76, cell: () => "$3.70" },
  { key: "x", header: "Note", cell: () => "—" },
];
const block = (id, style) => (
  <div id={id} style={style}>
    <StatusSwitch className="on" label="on" words={{ on: "Active", off: "Inactive" }} value={true} />
    <StatusSwitch className="off" label="off" words={{ on: "Active", off: "Inactive" }} value={false} />
    <Checkbox className="ticked" aria-label="ticked" defaultChecked />
    <Checkbox className="mixed" aria-label="mixed" indeterminate readOnly />
    <div style={{ width: 640 }}><Table caption={id + " table"} rows={ROWS} rowKey="id" columns={columns} {...sort} /></div>
    <div style={{ width: 360 }}><Table caption={id + " fitted"} fit rows={ROWS} rowKey="id" columns={fitted} {...sort} /></div>
    <div lang="zh-CN" style={{ width: 640 }}><Table caption={id + " zh"} rows={ROWS} rowKey="id" columns={[columns[0], { ...columns[2], cell: (r) => <StatusSwitch label={"状态"} words={{ on: "开", off: "关" }} value={r.on} /> }]} {...sort} /></div>
  </div>
);
flushSync(() => createRoot(document.getElementById("app")).render(<>{block("plain", {})}{block("themed", THEME)}</>));
document.querySelectorAll(".mixed input").forEach((i) => { i.indeterminate = true; });

const probe = document.createElement("span");
const rgb = (c, scope) => { scope.append(probe); probe.style.color = c; const v = getComputedStyle(probe).color; probe.style.color = ""; probe.remove(); return v; };
const token = (name, scope) => rgb(getComputedStyle(scope).getPropertyValue(name).trim(), scope);
const words = (el) => { const r = document.createRange(); r.selectNodeContents(el); return [...r.getClientRects()].filter((b) => b.width > 0.5); };
const edge = (cell) => cell.getBoundingClientRect().left + parseFloat(getComputedStyle(cell).paddingLeft);
const end = (cell) => cell.getBoundingClientRect().right - parseFloat(getComputedStyle(cell).paddingRight);
const textOf = (el) => [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
document.fonts.ready.then(() => {
  const got = {};
  for (const id of ["plain", "themed"]) {
    const b = document.getElementById(id);
    const item = (sel) => { const el = b.querySelector(sel); const s = getComputedStyle(el); const dot = getComputedStyle(el.querySelector(".s1-status__label"), "::after"); return { color: s.color, dot: dot.backgroundColor, dotShown: dot.opacity }; };
    const box = (sel) => { const el = b.querySelector(sel + " .s1-check__box"); const s = getComputedStyle(el); const tick = getComputedStyle(el, "::after"); return { bg: s.backgroundColor, line: s.borderTopColor, tick: tick.backgroundColor, tickShown: tick.opacity }; };
    const [table, fit, zh] = b.querySelectorAll(".s1-table");
    const head = table.querySelector("thead th:nth-child(2)");
    const headWords = words(textOf(head.querySelector(".s1-table__sort")))[0];
    const arrow = head.querySelector(".s1-table__arrow").getBoundingClientRect();
    const figures = [...table.querySelectorAll("tbody td:nth-child(2)")].map((td) => { const w = words(textOf(td))[0]; return { start: w.left - edge(td), end: end(td) - w.right }; });
    const status = (t) => [...t.querySelectorAll("tbody tr")].map((tr) => { const td = tr.lastElementChild; return td.querySelector(".s1-status__item--on .s1-status__label").getBoundingClientRect().left - edge(td); });
    const fitHead = (n) => { const th = fit.querySelector("thead th:nth-child(" + n + ")"); const lines = words(textOf(th.querySelector(".s1-table__sort"))); return { lines: lines.length, starts: lines.map((l) => l.left - edge(th)), past: Math.max(...lines.map((l) => l.right)) - th.getBoundingClientRect().right }; };
    got[id] = {
      ink: token("--s1-ink", b), paper: token("--s1-paper", b), here: token("--s1-here", b),
      ok: getComputedStyle(b).getPropertyValue("--s1-ok").trim() ? token("--s1-ok", b) : null,
      on: { current: item(".on .s1-status__item--on"), other: item(".on .s1-status__item--off") },
      off: { current: item(".off .s1-status__item--off"), other: item(".off .s1-status__item--on") },
      ticked: box(".ticked"), mixed: box(".mixed"),
      head: { start: headWords.left - edge(head), end: end(head) - headWords.right, arrowAfter: arrow.left > headWords.right, align: getComputedStyle(head).textAlign },
      figures,
      status: status(table), statusZh: status(zh),
      fitLast: fitHead(2), fitSpend: fitHead(3),
    };
  }
  document.getElementById("out").textContent = JSON.stringify(got);
});
`;

test("theme variables in a browser: StatusSwitch's current words and dots, Checkbox's ticked box and tick, Table's figures at the start; unset, the look before; a wrapped sortable header and a short status word at the column's start either way", async (t) => {
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
  writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css} *, *::before, *::after { box-sizing: border-box; } body { margin: 0; background: var(--s1-paper); color: var(--s1-ink); }</style></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);
  let dom: string;
  try {
    dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,1400", "--virtual-time-budget=10000", "--dump-dom", pathToFileURL(page).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
  } catch (e) {
    return t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
  }
  const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
  assert.ok(text, "the page printed nothing");
  const got = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  assert.equal(got.pageError, undefined, got.pageError);
  const { plain, themed } = got;
  const near = (a: number, b: number, what: string) => assert.ok(Math.abs(a - b) <= 0.5, `${what}: ${a.toFixed(2)}px, not ${b.toFixed(2)}px`);

  // unset: the look before
  assert.equal(plain.ok, null);
  assert.deepEqual([plain.on.current.color, plain.on.current.dot, plain.on.current.dotShown], [plain.ink, plain.here, "1"], "the on word in the ink (no ok hue), its dot in --s1-here");
  assert.deepEqual([plain.off.current.color, plain.off.current.dot, plain.off.current.dotShown], [plain.ink, plain.here, "1"], "the off word in the ink, its dot in --s1-here");
  assert.equal(plain.on.other.dotShown, "0");
  assert.deepEqual([plain.ticked.bg, plain.ticked.line, plain.ticked.tick, plain.ticked.tickShown], [plain.ink, plain.ink, plain.paper, "1"], "a ticked box in the ink, its tick in the paper");
  assert.deepEqual([plain.mixed.bg, plain.mixed.tick], [plain.ink, plain.paper]);
  assert.equal(plain.head.align, "end");
  near(plain.head.end, 0, "a figure's header ends at its cell's end");
  assert.equal(plain.head.arrowAfter, false, "a figure's sort arrow before its words");
  for (const f of plain.figures) near(f.end, 0, "a figure at its cell's end");

  // set: each follows; the word not chosen stays dim
  assert.deepEqual([themed.on.current.color, themed.on.current.dot], ["rgb(0, 120, 47)", "rgb(0, 120, 47)"], "the on word and its dot in --s1-status-on, -dot (over the theme's ok)");
  assert.deepEqual([themed.off.current.color, themed.off.current.dot], ["rgb(192, 38, 27)", "rgb(192, 38, 27)"], "the off word and its dot in --s1-status-off, -dot");
  assert.equal(themed.on.other.color, plain.on.other.color, "the word not chosen keeps the kit's dim");
  assert.equal(themed.off.other.color, plain.off.other.color);
  assert.deepEqual([themed.ticked.bg, themed.ticked.line, themed.ticked.tick], ["rgb(8, 145, 178)", "rgb(8, 145, 178)", "rgb(255, 255, 255)"], "a ticked box in --s1-check-on, its tick in --s1-check-tick");
  assert.deepEqual([themed.mixed.bg, themed.mixed.tick], ["rgb(8, 145, 178)", "rgb(255, 255, 255)"], "a mixed box too");
  assert.equal(themed.head.align, "start");
  near(themed.head.start, 0, "a figure's header starts at its cell's start");
  assert.equal(themed.head.arrowAfter, true, "its sort arrow after its words");
  for (const f of themed.figures) near(f.start, 0, "a figure at its cell's start");
  // a fitted figure's header that wraps: between its words, each line at the column's start, never past its cell
  assert.equal(themed.fitSpend.lines, 2, "Spend today on two lines in its 76px column");
  for (const s of themed.fitSpend.starts) near(s, 0, "each line of a wrapped figure header at the column's start");
  assert.ok(themed.fitSpend.past <= 0.5, `the header stays in its cell (${themed.fitSpend.past.toFixed(1)}px past)`);
  assert.equal(plain.fitSpend.lines, 1, "unset, a fitted figure's header keeps to one line");

  // either way: a sortable header that wraps keeps its lines at the column's start, and a short first status word starts
  // at the column's edge
  for (const b of [plain, themed]) {
    assert.equal(b.fitLast.lines, 2, "Last active on two lines in its 96px column");
    for (const s of b.fitLast.starts) near(s, 0, "each line of a wrapped header at the column's start");
    for (const s of [...b.status, ...b.statusZh]) near(s, 0, "a status's first word (On, 开) at the column's edge");
  }
});
