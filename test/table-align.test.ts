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
 * word, dots at a row's size, a shape and its label, a row's ghost dots and its trash, a dense log, a 40px menu, and
 * Chinese. For every row: each cell's first line (its first text, or its first control when it has none) centred
 * within 1px of the row's line, the cell's top plus its padding plus half of --s1-table-line; inside every
 * .s1-table__pair each child centred within 1px of the pair's centre, and no child of a pair taller than the line
 * unless it is a control (words in a pair keep to one line); dots on one line; a row's buttons inside their cell's
 * padding. At 1440 and at 390 (where the tables scroll in their frames), border-box everywhere as the apps set it. It
 * fails on the old table.css (cells centred in the middle, the actions cell padded 4px). Skipped where there is no
 * Chrome: set CHROME to one.
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
  const hidden = (el) => el.closest(".s1-visually-hidden, legend, [hidden], [popover], dialog");
  const shown = (el) => el.getClientRects().length && !hidden(el) && getComputedStyle(el).visibility !== "hidden";
  const label = (el) => el.tagName.toLowerCase() + "." + String(el.className.baseVal ?? el.className).split(" ")[0];
  const CONTROLS = "button, input:not([type=radio]):not([type=checkbox]), .s1-switch__control, .s1-radio, .s1-select__trigger, svg, .s1-glyph";
  // Everything on a cell's first line: each text whose first line box starts in it, each control whose box does.
  const firstLine = (cell, top, line) => {
    const found = [];
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() && shown(n.parentElement) && getComputedStyle(n.parentElement).position !== "absolute" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(t);
      const rect = [...range.getClientRects()].find((r) => r.height > 2);
      if (rect && rect.top < top + line - 1) found.push({ y: (rect.top + rect.bottom) / 2, what: "text " + JSON.stringify(t.textContent.trim().slice(0, 16)) });
    }
    for (const c of cell.querySelectorAll(CONTROLS)) {
      if (!shown(c) || c.closest("svg") !== c && c.closest("svg")) continue;
      const r = c.getBoundingClientRect();
      if (r.height > 2 && r.top < top + line - 1) found.push({ y: (r.top + r.bottom) / 2, what: label(c) });
    }
    return found;
  };
  // The first words of the cell, and of each box side by side at its top (a mark and the name beside it, a pair's
  // children), must start on the first line: words pushed below it would escape the line's check.
  const firstWords = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() && shown(n.parentElement) && getComputedStyle(n.parentElement).position !== "absolute" ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(t);
      const rect = [...range.getClientRects()].find((r) => r.height > 2);
      if (rect) return { top: rect.top, what: JSON.stringify(t.textContent.trim().slice(0, 16)) };
    }
    return null;
  };
  const leads = (cell, top, line) => {
    const out = [cell];
    for (const box of cell.querySelectorAll("*")) {
      const s = getComputedStyle(box);
      if (!/flex/.test(s.display) || s.flexDirection.startsWith("column") || !shown(box) || box.getBoundingClientRect().top >= top + line - 1) continue;
      // a flex line of its own holds every child; one that wraps, the children on its first line
      for (const child of box.children) if (shown(child) && (s.flexWrap === "nowrap" || child.getBoundingClientRect().top < top + line - 1)) out.push(child);
    }
    return out;
  };
  [...root.querySelectorAll(".s1-table tbody tr")].forEach((tr, at) => {
    if (tr.matches(".s1-table__ghead, .s1-table__loading") || !tr.getClientRects().length) return;
    const list = [...tr.children].filter((c) => c.matches("td, th") && !c.matches(".s1-table__empty"));
    if (list.length < 2) return;
    rows++;
    const name = tr.textContent.trim().replace(/\\s+/g, " ").slice(0, 40);
    const say = (text) => failures.push({ row: at, text: "row " + JSON.stringify(name) + ": " + text });
    // One line for the whole row: every cell's top padding the same, the target from the first cell's.
    const s0 = getComputedStyle(list[0]);
    const line = parseFloat(s0.getPropertyValue("--s1-table-line")) || parseFloat(s0.lineHeight);
    const pad = parseFloat(s0.borderTopWidth) + parseFloat(s0.paddingTop);
    const target = list[0].getBoundingClientRect().top + pad + line / 2;
    list.forEach((cell, i) => {
      const s = getComputedStyle(cell);
      const own = parseFloat(s.borderTopWidth) + parseFloat(s.paddingTop);
      if (Math.abs(own - pad) > 0.01) say("cell " + (i + 1) + "'s top padding is " + own + "px, the row's " + pad + "px");
      const top = cell.getBoundingClientRect().top + own;
      const items = firstLine(cell, top, line);
      if (items.length) cells++;
      for (const lead of leads(cell, top, line)) {
        const w = firstWords(lead);
        if (w && w.top >= top + line - 1) say("cell " + (i + 1) + "'s words " + w.what + " start " + (w.top - top).toFixed(1) + "px below its top, off the row's line");
      }
      for (const it of items) if (Math.abs(it.y - target) > TOL) say("cell " + (i + 1) + " (" + it.what + ") is " + (it.y - target).toFixed(1) + "px off the row's line");
    });
    for (const dots of tr.querySelectorAll(".s1-radios--dots")) {
      const opts = [...dots.querySelectorAll(".s1-radio")].filter((o) => o.getClientRects().length);
      if (opts.length > 1 && opts.some((o) => Math.abs(o.getBoundingClientRect().top - opts[0].getBoundingClientRect().top) > TOL)) say("dots " + JSON.stringify(dots.textContent.trim().slice(0, 24)) + ": its options wrap onto more than one line");
    }
    for (const pair of tr.querySelectorAll(".s1-table__pair")) {
      if (!shown(pair)) continue;
      pairs++;
      const pr = pair.getBoundingClientRect();
      const centre = (pr.top + pr.bottom) / 2;
      const height = parseFloat(getComputedStyle(pair).height);
      for (const child of pair.children) {
        const r = child.getBoundingClientRect();
        if (!r.height || hidden(child)) continue;
        const c = (r.top + r.bottom) / 2;
        if (Math.abs(c - centre) > TOL) say("pair " + JSON.stringify(pair.textContent.trim().slice(0, 24)) + ": " + label(child) + " is " + (c - centre).toFixed(1) + "px off its centre");
        if (r.height > height + 1 && !child.matches("button, .s1-btn, .s1-menu, .s1-switch, .s1-radios, .s1-badge, label, input")) say("pair " + JSON.stringify(pair.textContent.trim().slice(0, 24)) + ": " + label(child) + " is " + r.height.toFixed(0) + "px tall, more than the line (its words wrap)");
      }
    }
  });
  return { failures: failures.map((f) => f.text), failingRows: new Set(failures.map((f) => f.row)).size, rows, pairs, cells };
}
`;

const ENTRY = `
window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Badge } from ${part("badge.tsx")};
import { Button } from ${part("button.tsx")};
import { Glyph } from ${part("glyph.tsx")};
import { IconButton } from ${part("icon-button.tsx")};
import { Input } from ${part("input.tsx")};
import { Select } from ${part("select.tsx")};
import { RadioGroup } from ${part("radio-group.tsx")};
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
  { key: "stage", header: zh ? "上架" : "Listing", width: 200, cell: (g) => <RadioGroup legend={"Listing of " + g.name} hideLegend variant="dots" size="sm" defaultValue={g.on ? "live" : "draft"} options={[{ value: "draft", label: zh ? "草稿" : "Draft" }, { value: "live", label: zh ? "上架" : "Live" }, { value: "archived", label: zh ? "归档" : "Archived" }]} /> },
  { key: "spend", header: zh ? "今日消费" : "Spend today", numeric: true, cell: (g) => g.spend },
];
const actions = (g) => (
  <span className="s1-table__pair">
    <Menu variant="ghost" size="sm" align="end" label={"Actions for " + g.name} items={[{ label: "Edit", onSelect: () => {} }]} />
    <IconButton size="sm" tone="danger" icon={dots} aria-label={"Delete " + g.name} />
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
      <section data-story="fields in rows">
        <Table caption="Limits" columns={[{ key: "name", header: "Key" }, { key: "cap", header: "Daily cap", cell: (k) => <Input size="sm" aria-label={"Daily cap of " + k.name} defaultValue="20" /> }, { key: "plan", header: "Plan", cell: (k) => <Select size="sm" aria-label={"Plan of " + k.name} defaultValue="pro"><option value="pro">Pro</option><option value="simple">Simple</option></Select> }, { key: "spend", header: "Spend", numeric: true }]} rows={KEYS} rowKey="id" />
      </section>
      <section data-story="fields in dense rows">
        <Table caption="Limits" dense columns={[{ key: "name", header: "Key" }, { key: "cap", header: "Daily cap", cell: (k) => <Input size="sm" aria-label={"Daily cap of " + k.name} defaultValue="20" /> }, { key: "plan", header: "Plan", cell: (k) => <Select aria-label={"Plan of " + k.name} defaultValue="pro"><option value="pro">Pro</option></Select> }, { key: "spend", header: "Spend", numeric: true }]} rows={KEYS} rowKey="id" />
      </section>
      <section data-story="special rows">
        <Table caption="Groups" collapsible columns={[{ key: "name", header: "Name" }, { key: "spend", header: "Spend", numeric: true }]} groups={[{ key: "a", label: "Claude", heading: <span>Claude <Button size="sm">Add</Button></span>, rows: KEYS }, { key: "b", label: "Empty", heading: "Empty", rows: [], empty: <Button size="sm">Add a key</Button> }]} rowKey="id" />
        <Table caption="Keys" columns={[{ key: "name", header: "Name" }, { key: "spend", header: "Spend", numeric: true }]} rows={[]} rowKey="id" empty={<Button size="sm">Create a key</Button>} />
        <Table caption="Keys" loading={2} columns={[{ key: "name", header: "Name" }, { key: "spend", header: "Spend", numeric: true }]} rows={KEYS} rowKey="id" />
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
  for (const s of document.querySelectorAll("[data-story]")) {
    got[s.dataset.story] = checkRows(s, 1);
    // a row's buttons inside their cell's padding
    // the centring of a control alone in a cell leaves a group's heading and the empty row alone
    got[s.dataset.story].moved = [...s.querySelectorAll(".s1-table__ghead .s1-btn, .s1-table__empty .s1-btn")].filter((b) => parseFloat(getComputedStyle(b).marginTop) !== 0).length;
    got[s.dataset.story].outside = [...s.querySelectorAll(".s1-table__actions button")].filter((b) => b.getClientRects().length && !b.closest("[popover]")).filter((b) => {
      const r = b.getBoundingClientRect();
      const td = b.closest("td");
      const cell = td.getBoundingClientRect();
      const pad = getComputedStyle(td);
      return r.left < cell.left + parseFloat(pad.paddingLeft) - 0.5 || r.right > cell.right - parseFloat(pad.paddingRight) + 0.5;
    }).length;
  }
  document.getElementById("out").textContent = JSON.stringify(got);
});
`;

// The stories' own rules: border-box everywhere (as the apps and /ui/ set it), a name over a quieter line beside a mark
// (its first line 20px, the line under it 16px), a figure over its note, mono capitals, a page's mono time. The rest is
// the kit's.
const STORY_CSS = `
*, *::before, *::after { box-sizing: border-box; }
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

type Result = { failures: string[]; failingRows: number; rows: number; pairs: number; cells: number; outside: number; moved: number };

async function page(t: { skip: (m: string) => void }, sheet: (f: string) => string, extra = ""): Promise<string | undefined> {
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
  writeFileSync(file, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}\n${STORY_CSS}\n${extra}</style></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);
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
    assert.deepEqual(Object.keys(got), ["groups, fitted", "groups, scrolling", "a dense log", "a 40px menu and a button", "fields in rows", "fields in dense rows", "special rows", "Chinese"]);
    for (const [story, r] of Object.entries(got)) {
      assert.deepEqual(r.failures, [], `${width}px, ${story}`);
      assert.equal(r.outside, 0, `${width}px, ${story}: a row's buttons stay inside their cell's padding`);
      assert.equal(r.moved, 0, `${width}px, ${story}: nothing in a group's heading or the empty row is moved`);
      assert.ok(r.rows >= 2, `${width}px, ${story}: ${r.rows} rows checked`);
    }
    assert.equal(got["groups, fitted"].pairs, 9, `${width}px: the health, the status and the actions of three rows`);
    assert.equal(got["groups, fitted"].cells, 27, `${width}px: nine cells a row, each with a first line`);
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
        .replace(/\n  \/\* A control alone in a row's cell[\s\S]*?21px\) \/ 2\); \}/, "");
    if (id.endsWith("switch.css")) css = css.replace(/\n  \.s1-table tbody :is\(td, th\)[^\n]*/g, "");
    return css;
  };
  const bin = await page(t, old);
  if (!bin) return;
  const got = open(bin, 1440);
  if (process.env.S1LIN_ALIGN) writeFileSync(process.env.S1LIN_ALIGN, JSON.stringify(got, null, 1)); // the findings, for a report
  const failing = Object.values(got).reduce((n, r) => n + r.failures.length, 0);
  assert.ok(failing >= 10, `the old rules fail the check (${failing} findings)`);
});

test("the check sees one cell's padding moved, a name moved off its mark's line, and counts the rows, not the findings", async (t) => {
  const bin = await page(
    t,
    own,
    `[data-story="groups, fitted"] tbody tr:first-child > :nth-child(3) { padding-top: 13px; }
     [data-story="groups, scrolling"] tbody tr:nth-child(2) .who__main { position: relative; top: 3px; }
     [data-story="a dense log"] tbody td .caps { position: relative; top: 2px; }
     [data-story="Chinese"] tbody tr:first-child .who__main { margin-top: 22px; }`,
  );
  if (!bin) return;
  const got = open(bin, 1440);
  if (process.env.S1LIN_ALIGN) writeFileSync(process.env.S1LIN_ALIGN, JSON.stringify(got, null, 1)); // the findings, for a report
  const fitted = got["groups, fitted"].failures.join("\n");
  assert.match(fitted, /cell 3's top padding is 13px, the row's 10px/, "a cell padded otherwise than its row");
  assert.match(fitted, /cell 3 \(text "6\/6"\) is [23]\.\dpx off the row's line/, "its figure off the line by the padding's 3px");
  assert.equal(got["groups, fitted"].failingRows, 1, "one row off, however many findings it has");
  assert.match(got["groups, scrolling"].failures.join("\n"), /cell 1 \(text "Kimi · Discount,"\) is 3\.0px off the row's line/, "a name moved off its mark's line, the mark still on it");
  assert.doesNotMatch(got["groups, scrolling"].failures.join("\n"), /text "K"\)/, "the mark itself stays on the line");
  assert.equal(got["groups, scrolling"].failingRows, 1);
  assert.equal(got["a dense log"].failingRows, 1, "the OK word moved in the one row that has it");
  assert.match(got.Chinese.failures.join("\n"), /cell 1's words "Qwen" start 2\d\.\dpx below its top, off the row's line/, "a name pushed a whole line down beside its mark");
  assert.equal(got.Chinese.failingRows, 1);
  for (const story of ["a 40px menu and a button", "fields in rows", "fields in dense rows"]) assert.deepEqual(got[story].failures, [], story);
});
