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
 * The Table's row rule (owner, 2026-11-06: "the table should be vertically aligned for icon+text, and each rows";
 * admin Services redesign §3.6), in Chrome with React running, on stories of the rows a console lists: a name that
 * wraps over its tags beside a mark, figures in mono over their notes, words in mono capitals, badges, a switch and its
 * word, a shape and its label, a row's buttons and a menu's dots, a dense log, a 40px menu, and Chinese. For every row:
 * each cell's first line (its first text, or its first control when it has none) centred within 1px of the row's line,
 * the cell's top plus its padding plus half of --s1-table-line; inside every .s1-table__pair each child centred within
 * 1px of the pair's centre, and no child of a pair taller than the line unless it is a control (words in a pair keep
 * to one line). At 1440 and at 390 (where the tables scroll in their frames). It fails on the old table.css (cells
 * centred in the middle, the actions cell padded 4px). Skipped where there is no Chrome: set CHROME to one.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const UI = path.join(ROOT, "src/ui");

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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-table-align-"));
after(() => rmSync(out, { recursive: true, force: true }));
const part = (f: string) => JSON.stringify(path.join(UI, f));

/** The check, as the admin's test/table-align.test.ts runs it over its pages: every body row, every pair. */
export const CHECK = `
function checkRows(root, TOL) {
  const failures = [];
  let rows = 0, pairs = 0, cells = 0;
  const hidden = (el) => el.closest(".s1-visually-hidden, legend, [hidden], [popover]");
  const firstLine = (cell) => {
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() && n.parentElement.getClientRects().length && getComputedStyle(n.parentElement).position !== "absolute" && !hidden(n.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(t);
      const rect = range.getClientRects()[0];
      if (rect && rect.height > 2) return { y: (rect.top + rect.bottom) / 2, what: "text " + JSON.stringify(t.textContent.trim().slice(0, 16)) };
    }
    const control = [...cell.querySelectorAll("button, input:not([type=radio]):not([type=checkbox]), .s1-switch__control, .s1-radio, svg, .s1-glyph")].find((c) => c.getClientRects().length && !hidden(c));
    if (control) { const r = control.getBoundingClientRect(); return { y: (r.top + r.bottom) / 2, what: control.tagName.toLowerCase() + "." + String(control.className.baseVal ?? control.className).split(" ")[0] }; }
    return null;
  };
  for (const tr of root.querySelectorAll(".s1-table tbody tr")) {
    if (tr.matches(".s1-table__ghead, .s1-table__loading") || !tr.getClientRects().length) continue;
    const list = [...tr.children].filter((c) => c.matches("td, th") && !c.matches(".s1-table__empty"));
    if (list.length < 2) continue;
    rows++;
    const name = tr.textContent.trim().replace(/\\s+/g, " ").slice(0, 40);
    for (const cell of list) {
      const s = getComputedStyle(cell);
      const line = parseFloat(s.getPropertyValue("--s1-table-line")) || parseFloat(s.lineHeight);
      const expected = cell.getBoundingClientRect().top + parseFloat(s.borderTopWidth) + parseFloat(s.paddingTop) + line / 2;
      const got = firstLine(cell);
      if (!got) continue;
      cells++;
      if (Math.abs(got.y - expected) > TOL) failures.push("row \\"" + name + "\\": the first line of cell " + (list.indexOf(cell) + 1) + " (" + got.what + ") is " + (got.y - expected).toFixed(1) + "px off the row's line");
    }
    for (const pair of tr.querySelectorAll(".s1-table__pair")) {
      if (!pair.getClientRects().length) continue;
      pairs++;
      const pr = pair.getBoundingClientRect();
      const centre = (pr.top + pr.bottom) / 2;
      const line = parseFloat(getComputedStyle(pair).height);
      for (const child of pair.children) {
        const r = child.getBoundingClientRect();
        if (!r.height || hidden(child)) continue;
        const c = (r.top + r.bottom) / 2;
        const label = child.tagName.toLowerCase() + "." + String(child.className.baseVal ?? child.className).split(" ")[0];
        if (Math.abs(c - centre) > TOL) failures.push("pair \\"" + pair.textContent.trim().slice(0, 24) + "\\": " + label + " is " + (c - centre).toFixed(1) + "px off its centre");
        if (r.height > line + 1 && !child.matches("button, .s1-btn, .s1-menu, .s1-switch, .s1-radios, .s1-badge, label, input")) failures.push("pair \\"" + pair.textContent.trim().slice(0, 24) + "\\": " + label + " is " + r.height.toFixed(0) + "px tall, more than the line (its words wrap)");
      }
    }
  }
  return { failures, rows, pairs, cells };
}
`;

const ENTRY = `
window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Badge } from ${part("badge.tsx")};
import { Button } from ${part("button.tsx")};
import { Glyph } from ${part("glyph.tsx")};
import { Menu } from ${part("menu.tsx")};
import { Switch } from ${part("switch.tsx")};
import { Table } from ${part("table.tsx")};
${CHECK}

const dots = <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M3 4h10l-1 9H4z" /></svg>;
const Mark = ({ c }) => <span className="mark">{c}</span>;
const Who = ({ name, sub }) => (
  <span className="who"><span className="who__main">{name}</span><span className="who__sub">{sub}</span></span>
);
const Fig = ({ n, sub }) => (
  <span className="fig"><span>{n}</span>{sub && <span className="fig__sub">{sub}</span>}</span>
);
const GROUPS = [
  { id: 1, name: "Qwen", sub: "#2 · composite", rate: "×1", accounts: "6/6", note: "all healthy", spend: "$19.80", on: true, state: "Active", status: "ok", word: "Healthy" },
  { id: 2, name: "Kimi · Discount, a route with a name long enough to wrap onto a second line", sub: "#9 · moonshot · subscription · exclusive", rate: "×0.8", accounts: "3/4", note: "1 limited", spend: "$142.10", on: false, state: "Inactive", status: "warn", word: "Degraded" },
  { id: 3, name: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", sub: "#14 · composite", rate: "×1", accounts: "2/2", note: null, spend: "$3.40", on: true, state: "Active", status: "bad", word: "Down" },
];
const columns = (zh) => [
  { key: "name", header: zh ? "分组" : "Group", width: "34%", cell: (g) => <span className="name"><Mark c={g.name[0]} /><Who name={g.name} sub={g.sub} /></span> },
  { key: "rate", header: zh ? "倍率" : "Rate", numeric: true, cell: (g) => g.rate },
  { key: "accounts", header: zh ? "账号" : "Accounts", numeric: true, cell: (g) => <Fig n={g.accounts} sub={g.note} /> },
  { key: "health", header: zh ? "状况" : "Health", cell: (g) => <span className="s1-table__pair"><Glyph status={g.status} /><span className="caps">{g.word}</span></span> },
  { key: "kind", header: zh ? "类型" : "Kind", cell: (g) => <Badge status={g.on ? "ok" : "neutral"}>{g.on ? (zh ? "开" : "Live") : (zh ? "关" : "Off")}</Badge> },
  { key: "status", header: zh ? "状态" : "Status", cell: (g) => <span className="s1-table__pair"><Switch aria-label={(g.on ? "Turn off " : "Turn on ") + g.name} defaultChecked={g.on} /><span className="caps">{g.state}</span></span> },
  { key: "spend", header: zh ? "今日消费" : "Spend today", numeric: true, cell: (g) => g.spend },
];
const actions = (g) => (
  <span className="s1-table__pair">
    <Menu variant="ghost" size="sm" align="end" label={"Actions for " + g.name} items={[{ label: "Edit", onSelect: () => {} }]} />
    <Button variant="ghost" size="sm" icon={dots} aria-label={"Delete " + g.name} />
  </span>
);
const LOG = [
  { id: 1, at: "2026-11-06 16:04:11", model: "claude-sonnet-5", tokens: "12,480", cost: "$0.0412", code: "200" },
  { id: 2, at: "2026-11-06 16:04:09", model: "gpt-5.5", tokens: "3,102", cost: "$0.0060", code: "429" },
];
const logColumns = [
  { key: "at", header: "Time", cell: (r) => <span className="mono">{r.at}</span> },
  { key: "model", header: "Model", cell: (r) => r.model },
  { key: "tokens", header: "Tokens", numeric: true },
  { key: "cost", header: "Cost", numeric: true },
  { key: "code", header: "Status", cell: (r) => (r.code === "200" ? <span className="s1-table__pair"><Glyph status="ok" /><span className="caps">OK</span></span> : <Badge status="warn">{r.code}</Badge>) },
];
const KEYS = [
  { id: 1, name: "prod-backend", spend: "$41.20" },
  { id: 2, name: "nightly-batch", spend: "$88.04" },
];

function Stories() {
  return (
    <div className="stories">
      <section data-story="groups, fitted">
        <Table caption="Groups" fit columns={columns(false)} rows={GROUPS} rowKey="id" actions={actions} />
      </section>
      <section data-story="groups, scrolling">
        <Table caption="Groups" columns={columns(false)} rows={GROUPS} rowKey="id" actions={actions} />
      </section>
      <section data-story="a dense log" >
        <Table caption="Requests" dense columns={logColumns} rows={LOG} rowKey="id" />
      </section>
      <section data-story="a 40px menu and a button">
        <Table caption="Keys" columns={[{ key: "name", header: "Name" }, { key: "spend", header: "Spend", numeric: true }, { key: "go", header: "Open", cell: () => <Button size="sm">Open</Button> }]} rows={KEYS} rowKey="id" actions={(k) => <Menu label={"Actions for " + k.name} align="end" items={[{ label: "Rename", onSelect: () => {} }]} />} />
      </section>
      <section data-story="Chinese" lang="zh-CN">
        <Table caption="分组" fit columns={columns(true)} rows={GROUPS} rowKey="id" actions={actions} />
      </section>
    </div>
  );
}

flushSync(() => createRoot(document.getElementById("app")).render(<Stories />));
document.fonts.ready.then(() => {
  const got = {};
  for (const s of document.querySelectorAll("[data-story]")) got[s.dataset.story] = checkRows(s, 1);
  document.getElementById("out").textContent = JSON.stringify(got);
});
`;

// The stories' own rules: a name over a quieter line beside a mark (its first line 20px, the line under it 16px), a
// figure over its note, mono capitals, a page's mono time. The rest is the kit's.
const STORY_CSS = `
body { margin: 0; background: var(--s1-paper); color: var(--s1-ink); font-family: var(--s1-font-sans); }
.stories { display: grid; gap: 32px; max-width: 1100px; padding: 16px; }
.name { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
.mark { display: grid; place-items: center; flex: none; width: 20px; height: 20px; font: 700 10px/1 var(--s1-font-mono); background: var(--s1-paper-2); }
.who { display: grid; min-width: 0; }
.who__main { font-weight: 500; overflow-wrap: anywhere; white-space: normal; }
.who__sub { margin-top: 2px; font-size: 12.5px; line-height: 16px; color: var(--s1-ink-3); overflow-wrap: anywhere; white-space: normal; }
.fig { display: grid; }
.fig__sub { font: 400 11px/16px var(--s1-font-mono); color: var(--s1-ink-3); }
.caps { font: 500 10.5px/1 var(--s1-font-mono); letter-spacing: 0.06em; text-transform: uppercase; color: var(--s1-ink-2); }
.mono { font-family: var(--s1-font-mono); font-size: 12px; }
`;

type Result = { failures: string[]; rows: number; pairs: number; cells: number };

async function page(t: { skip: (m: string) => void }, sheet: (f: string) => string): Promise<string | undefined> {
  const bin = chrome();
  if (!bin) return void t.skip("no Chrome here: set CHROME to run it");
  if (!existsSync(path.join(out, "node_modules"))) symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");
  writeFileSync(path.join(out, "entry.jsx"), ENTRY);
  await build({
    configFile: false,
    root: out,
    logLevel: "silent",
    plugins: [react(), { name: "kit-css", enforce: "pre", load: (id) => (id.startsWith(UI) && id.endsWith(".css") ? sheet(id) : undefined) }],
    define: { "process.env.NODE_ENV": '"production"' },
    build: { outDir: path.join(out, "dist"), emptyOutDir: true, minify: false, lib: { entry: path.join(out, "entry.jsx"), formats: ["iife"], name: "Harness", fileName: () => "harness.js", cssFileName: "harness" } },
  });
  const js = readFileSync(path.join(out, "dist/harness.js"), "utf8");
  const css = readFileSync(path.join(out, "dist", readdirSync(path.join(out, "dist")).find((f) => f.endsWith(".css"))!), "utf8");
  const file = path.join(out, "page.html");
  writeFileSync(file, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}\n${STORY_CSS}</style></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);
  return bin;
}

function open(bin: string, width: number): Record<string, Result> {
  let dom: string;
  try {
    dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", `--window-size=${width},1600`, "--virtual-time-budget=10000", "--dump-dom", pathToFileURL(path.join(out, "page.html")).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    assert.fail(`Chrome failed on the page (${bin}): ${String(err.stderr ?? e).slice(0, 400)}`);
  }
  const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
  assert.ok(text, "the page printed nothing");
  const got = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&amp;", "&"));
  assert.equal(got.pageError, undefined, `the page failed: ${got.pageError}`);
  return got;
}

const own = (id: string) => readFileSync(id, "utf8");

test("every row's first lines lie on one line, and every icon and its words are centred on each other, at 1440 and at 390: a wrapping name, mixed fonts, badges, a switch, a row's buttons, a dense log, a 40px menu, Chinese", async (t) => {
  const bin = await page(t, own);
  if (!bin) return;
  for (const width of [1440, 390]) {
    const got = open(bin, width);
    assert.deepEqual(Object.keys(got), ["groups, fitted", "groups, scrolling", "a dense log", "a 40px menu and a button", "Chinese"]);
    for (const [story, r] of Object.entries(got)) {
      assert.deepEqual(r.failures, [], `${width}px, ${story}`);
      assert.ok(r.rows >= 2, `${width}px, ${story}: ${r.rows} rows checked`);
    }
    assert.equal(got["groups, fitted"].pairs, 9, `${width}px: the health, the status and the actions of three rows`);
    assert.equal(got["groups, fitted"].cells, 24, `${width}px: eight cells a row, each with a first line`);
    assert.equal(got["a dense log"].pairs, 1, `${width}px: the one OK`);
  }
});

test("the check fails on the old table.css: cells centred in the middle, the actions cell padded 4px, no pair", async (t) => {
  // table.css as it was before the row rule (s1lin 79b51fa): vertical-align: middle, line-height from the table's
  // font, the actions cell's 4px; the pair unknown. switch.css without its rules for a cell.
  const old = (id: string) => {
    let css = own(id);
    if (id.endsWith("table.css"))
      css = css
        .replace("vertical-align: top; line-height: var(--s1-table-line);", "vertical-align: middle;")
        .replace(".s1-table__actions { width: 1%; text-align: end !important; }", ".s1-table__actions { width: 1%; padding-block: 4px !important; text-align: end !important; }")
        .replace(/\n  \.s1-table__pair \{[\s\S]*?\n  \}\n/, "\n")
        .replace(/\n  \.s1-table tbody tr > :is\(td, th\)[^\n]*/g, "");
    if (id.endsWith("switch.css")) css = css.replace(/\n  \.s1-table :is\(td, th\)[^\n]*/g, "");
    return css;
  };
  const bin = await page(t, old);
  if (!bin) return;
  const got = open(bin, 1440);
  if (process.env.S1LIN_ALIGN) writeFileSync(process.env.S1LIN_ALIGN, JSON.stringify(got, null, 1)); // the findings, for a report
  const failing = Object.values(got).reduce((n, r) => n + r.failures.length, 0);
  assert.ok(failing >= 10, `the old rules fail the check (${failing} findings)`);
});
