import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createElement as h, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import react from "@vitejs/plugin-react";
import ts from "typescript";
import { build } from "vite";

/*
 * The Table's ID column (`rowId`; owner 2026-11-15: "For all tables in admin and console, we should break the id as its
 * own column, first column"): on a server, the ID column is the first of the row, after a first column keyed "select"
 * (a row's checkbox), "ID" over it, sortable under "id" (or a key of the page's) with `idSort`, its cells buttons named
 * "Copy ID 42", a row with no id "—", and no column at all without `rowId`. In Chrome with React running: the column as
 * wide as the longest id shown (two to eight figures of the mono, never narrower than its header), at both sizes, in a
 * table that fits and one that scrolls; an id longer than eight figures cut short with "…"; a press copies the whole
 * id and leaves the row's own click alone.
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

/* src/ui/ as plain ES modules in a scratch folder (stylesheets dropped), so node can import the parts as an app's bundler would. */
const out = mkdtempSync(path.join(tmpdir(), "s1lin-table-id-"));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");
writeFileSync(path.join(out, "package.json"), '{ "type": "module" }');
for (const f of readdirSync(UI).filter((x) => /\.tsx?$/.test(x))) {
  const js = ts.transpileModule(readFileSync(path.join(UI, f), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  writeFileSync(
    path.join(out, f.replace(/\.tsx?$/, ".js")),
    js
      .replace(/^import\s+["']\.\/[\w-]+\.css["'];?\s*$/gm, "")
      .replace(/import\(\s*["']\.\/[\w-]+\.css["']\s*\)/g, "Promise.resolve()")
      .replace(/from\s+["'](\.\/[\w-]+)["']/g, 'from "$1.js"'),
  );
}
after(() => rmSync(out, { recursive: true, force: true }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = async (): Promise<any> => import(pathToFileURL(path.join(out, "table.js")).href);
const html = (node: ReactNode) => renderToString(node as never).replaceAll("<!-- -->", "");

const ROWS = [
  { id: 42, name: "anthropic-apikey-03" },
  { id: 7, name: "kimi-apikey-08" },
  { id: null, name: "draft" },
];

test("on a server: the ID column first, after a row's checkbox, \"ID\" over it, each id a button that copies it, \"—\" for a row with none; none without rowId", async () => {
  const { Table } = await table();
  const columns = [
    { key: "select", header: h("input", { type: "checkbox", "aria-label": "Select all" }), cell: (r: { name: string }) => h("input", { type: "checkbox", "aria-label": `Select ${r.name}` }) },
    { key: "name", header: "Account", sortable: true },
  ];
  const markup = html(h(Table, { caption: "Accounts", columns, rows: ROWS, rowKey: "name", rowId: "id", idSort: true, rowHeader: "name", sort: { key: "id", dir: "desc" }, onSortChange: () => undefined }));
  const heads = [...markup.matchAll(/<th scope="col"([^>]*)>([\s\S]*?)<\/th>/g)].map((m) => ({ attrs: m[1], body: m[2] }));
  assert.equal(heads.length, 2 + 1, "the checkbox, the ID, the name");
  assert.match(heads[0].body, /aria-label="Select all"/, "the checkbox stays first");
  assert.match(heads[1].attrs, /class="s1-table__id"/);
  assert.match(heads[1].attrs, /aria-sort="descending"/, "the ID column is the sort");
  assert.match(heads[1].body, /^<button type="button" class="s1-table__sort" data-dir="desc">ID<span class="s1-table__arrow"/);
  assert.match(heads[2].body, /Account/);
  const rows = [...markup.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => m[1]).filter((r) => r.includes("<td"));
  assert.equal(rows.length, 3);
  assert.match(rows[0], /^<td><input type="checkbox" aria-label="Select anthropic-apikey-03"\/><\/td><td class="s1-table__id"><button type="button" class="s1-table__copy" aria-label="Copy ID 42" title="Copy ID 42">42<\/button>/);
  assert.match(rows[0], /<th scope="row">anthropic-apikey-03<\/th>/, "the name still names the row");
  assert.match(rows[2], /<td class="s1-table__id"><span class="s1-table__noid">—<\/span><\/td>/, "a row with no id");
  assert.match(markup, /style="--s1-table-id-chars:2"/, "the column as wide as its longest id, two figures");

  const plain = html(h(Table, { caption: "Accounts", columns: [{ key: "name", header: "Account" }], rows: ROWS, rowKey: "name", rowId: (r: { id: number | null }) => r.id }));
  assert.match(plain, /<thead><tr><th scope="col" class="s1-table__id">ID<\/th><th scope="col">Account<\/th>/, "first when there is no checkbox, a plain header without idSort");
  const none = html(h(Table, { caption: "Accounts", columns: [{ key: "name", header: "Account" }], rows: ROWS, rowKey: "name" }));
  assert.doesNotMatch(none, /s1-table__id|--s1-table-id-chars/, "no ID column without rowId");
  const keyed = html(h(Table, { caption: "Charges", columns: [{ key: "name", header: "Charge", sortable: true }], rows: ROWS, rowKey: "name", rowId: "id", idSort: "charge_id", sort: { key: "charge_id", dir: "asc" }, onSortChange: () => undefined }));
  assert.match(keyed, /<th scope="col" class="s1-table__id" aria-sort="ascending">/, "idSort names the key the list sorts its ids by");
});

const ENTRY = (tablePath: string) => `
window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Table } from ${JSON.stringify(tablePath)};

const copied = [];
Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
Object.defineProperty(navigator, "clipboard", { value: { writeText: async (text) => { copied.push(text); } }, configurable: true });
let opened = 0;
const SHORT = [{ id: 7, name: "seven" }, { id: 42, name: "forty-two" }];
const MID = [{ id: 1, name: "one" }, { id: 12345, name: "twelve thousand" }];
const LONG = [{ id: 12345678, name: "eight" }, { id: "a3f9c2e1-77b0-4d1e-9c55-0d2f1e9b8a10", name: "a uuid" }];
const cols = [{ key: "name", header: "Name" }, { key: "note", header: "Note", cell: () => "a note" }];
const one = (story, rows, more = {}) => (
  <section data-story={story}>
    <Table caption={story} columns={cols} rows={rows} rowKey="name" rowId="id" idSort sort={{ key: "name", dir: "asc" }} onSortChange={() => {}} rowProps={() => ({ onClick: () => { opened++; } })} {...more} />
  </section>
);
flushSync(() =>
  createRoot(document.getElementById("app")).render(
    <div style={{ width: 900 }}>
      {one("short", SHORT)}
      {one("short, fitted", SHORT, { fit: true })}
      {one("five figures", MID)}
      {one("long", LONG)}
      {one("long, dense", LONG, { dense: true })}
      <div lang="zh-CN">{one("short, Chinese", SHORT)}</div>
      <section data-story="a long figure header">
        <Table caption="Accounts" fit columns={[{ key: "name", header: "Groups" }, { key: "priority", header: "Priority", numeric: true, sortable: true, width: 40, cell: () => "3" }, { key: "load", header: "Load", numeric: true, width: 70, cell: () => "2/10" }]} rows={SHORT} rowKey="name" sort={{ key: "name", dir: "asc" }} onSortChange={() => {}} />
      </section>
      <section data-story="a long end header in Chinese" lang="zh-CN">
        <Table caption="账号" fit columns={[{ key: "name", header: "状态", sortable: true }, { key: "on", header: "参与调度", align: "end", sortable: true, width: 60, cell: () => "开" }, { key: "groups", header: "分组" }]} rows={SHORT} rowKey="name" sort={{ key: "name", dir: "asc" }} onSortChange={() => {}} />
      </section>
    </div>,
  ),
);
document.fonts.ready.then(async () => {
  const got = {};
  const long = document.querySelector('[data-story="a long figure header"]');
  const [, prio, load] = long.querySelectorAll("thead th");
  const words = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  const label = prio.querySelector(".s1-table__sort");
  const labelBox = { left: Math.min(words(label.firstChild).left, label.querySelector(".s1-table__arrow").getBoundingClientRect().left), right: Math.max(words(label.firstChild).right, label.querySelector(".s1-table__arrow").getBoundingClientRect().right) };
  const zh = document.querySelector('[data-story="a long end header in Chinese"] thead th:nth-child(2) .s1-table__sort');
  const zhRange = document.createRange();
  zhRange.selectNodeContents(zh.firstChild);
  got.endHeadLines = new Set([...zhRange.getClientRects()].map((r) => Math.round(r.top))).size;
  got.figureHead = { endGap: prio.getBoundingClientRect().right - parseFloat(getComputedStyle(prio).paddingRight) - labelBox.right, overflowsStart: labelBox.left < prio.getBoundingClientRect().left, toNext: words(load).left - labelBox.right };
  for (const s of document.querySelectorAll("[data-story]")) {
    if (!s.querySelector("th.s1-table__id")) continue;
    const th = s.querySelector("th.s1-table__id");
    got[s.dataset.story] = {
      width: th.getBoundingClientRect().width,
      headFits: th.querySelector(".s1-table__arrow").getBoundingClientRect().right <= th.getBoundingClientRect().right - parseFloat(getComputedStyle(th).paddingRight) + 0.5,
      ids: [...s.querySelectorAll("td.s1-table__id .s1-table__copy")].map((b) => ({ text: b.textContent, cut: b.scrollWidth > b.clientWidth + 0.5, inside: b.getBoundingClientRect().right <= b.closest("td").getBoundingClientRect().right + 0.5, byRule: parseFloat(getComputedStyle(b).marginRight) + parseFloat(getComputedStyle(b.closest("td")).paddingRight) >= 0 })),
    };
  }
  document.querySelector('[data-story="long"] td.s1-table__id .s1-table__copy').click();
  await new Promise((r) => setTimeout(r, 50));
  got.copied = copied;
  got.opened = opened;
  got.state = document.querySelector('[data-story="long"] td.s1-table__id .s1-table__copy').dataset.state ?? null;
  got.said = document.querySelector('[data-story="long"] td.s1-table__id [role="status"]').textContent;
  document.getElementById("out").textContent = JSON.stringify(got);
});
`;

test("in Chrome: the column as wide as its longest id (two to eight figures, never narrower than \"ID\" and its arrow), a longer id cut short, a press copies the whole id and not the row's click", async (t) => {
  const bin = chrome();
  if (!bin) return t.skip("no Chrome here: set CHROME to run it");
  writeFileSync(path.join(out, "entry.jsx"), ENTRY(path.join(UI, "table.tsx")));
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
  writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}\n*, *::before, *::after { box-sizing: border-box; }</style></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);
  let dom: string;
  try {
    dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--window-size=1200,1400", "--virtual-time-budget=5000", "--dump-dom", pathToFileURL(page).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === "ENOENT" || err.code === "EACCES") return t.skip(`Chrome would not start (${bin}): ${err.code}`);
    assert.fail(`Chrome failed on the page (${bin}): ${String(err.stderr ?? e).slice(0, 400)}`);
  }
  const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
  type Story = { width: number; headFits: boolean; ids: { text: string; cut: boolean; inside: boolean; byRule: boolean }[] };
  const got = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&amp;", "&")) as Record<string, Story> & { pageError?: string; copied: string[]; opened: number; state: string | null; said: string };
  assert.equal(got.pageError, undefined, `the page failed: ${got.pageError}`);
  const near = (a: number, b: number, what: string) => assert.ok(Math.abs(a - b) < 1, `${what}: ${a.toFixed(1)}px, not ${b.toFixed(1)}px`);
  near(got.short.width, 47, "two figures: as wide as the header ID and its arrow");
  near(got["short, fitted"].width, 47, "the same in a table that fits");
  near(got["short, Chinese"].width, 47, "and in Chinese");
  near(got["five figures"].width, 5 * 0.6 * 13 + 18, "five figures of the mono and the cell's padding (14px before, 4px after)");
  near(got.long.width, 8 * 0.6 * 13 + 18, "eight figures at most");
  near(got["long, dense"].width, 8 * 0.6 * 12 + 12, "eight figures of the dense table's 12px");
  for (const [story, s] of Object.entries(got).filter(([, v]) => typeof v === "object" && v && "ids" in v) as [string, Story][]) {
    assert.ok(s.headFits, `${story}: "ID" and its arrow fit the header`);
    for (const id of s.ids) assert.ok(id.inside, `${story}: ${id.text} stays inside its cell`);
    for (const id of s.ids) assert.ok(id.byRule, `${story}: ${id.text}'s press never reaches past its cell, whatever the font`);
  }
  assert.deepEqual(got.long.ids.map((i) => i.cut), [false, true], "eight figures whole, a uuid cut short");
  assert.deepEqual(got["five figures"].ids.map((i) => i.cut), [false, false]);
  assert.deepEqual(got.copied, ["12345678"], "the press copies the whole id");
  assert.equal(got.opened, 0, "and does not open the row");
  assert.equal(got.state, "copied");
  assert.equal(got.said, "Copied to the clipboard");
  // a sortable figure's header wider than its 40px column, in a table that fits: at its column's end, over its figures,
  // running back over the column before it, and clear of the next header's words
  const head = (got as unknown as { figureHead: { endGap: number; overflowsStart: boolean; toNext: number } }).figureHead;
  assert.ok(Math.abs(head.endGap) < 1, `the header's words end at its cell's padding (${head.endGap.toFixed(1)}px)`);
  assert.ok(head.overflowsStart, "a header too wide runs back over the column before it");
  assert.ok(head.toNext >= 10, `and stays clear of the next header (${head.toNext.toFixed(1)}px)`);
  // an end-aligned header too long for its column keeps its words on one line, not a character a line ("参与调度")
  assert.equal((got as unknown as { endHeadLines: number }).endHeadLines, 1, "参与调度 on one line in its 60px column");
});
