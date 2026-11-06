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
 * The Table's sort (admin Services redesign §3.2, owner 2026-11-06: "no sorting"): a sortable header is a button in a
 * <th> with aria-sort; the first press on a column asks for its first direction (words and dates from the start,
 * figures from the biggest, `firstDir` for another), the next the other way, and no press ever asks for none, since a
 * list always has a sort; one column at a time. On a server (nextSort, the markup), then in Chrome with React running:
 * presses on the headers, what onSortChange heard, aria-sort on every header and the words a screen reader hears.
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
const out = mkdtempSync(path.join(tmpdir(), "s1lin-table-sort-"));
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

test("nextSort: a column's first press asks for its first direction (figures from the biggest, words and dates from the start, firstDir for another), the next press the other way, never none", async () => {
  const { nextSort } = await table();
  const name = { key: "name" };
  const spend = { key: "spend", numeric: true };
  const rank = { key: "rank", numeric: true, firstDir: "asc" };
  const created = { key: "created", firstDir: "desc" };
  assert.deepEqual(nextSort(name, null), { key: "name", dir: "asc" }, "words: from the start");
  assert.deepEqual(nextSort(spend, null), { key: "spend", dir: "desc" }, "figures: the biggest first");
  assert.deepEqual(nextSort(rank, undefined), { key: "rank", dir: "asc" }, "a figure column that says asc");
  assert.deepEqual(nextSort(created, { key: "name", dir: "asc" }), { key: "created", dir: "desc" }, "a words column that says desc");
  assert.deepEqual(nextSort(spend, { key: "name", dir: "desc" }), { key: "spend", dir: "desc" }, "another column's sort does not carry over its direction");
  let sort = nextSort(spend, { key: "name", dir: "asc" });
  const seen: string[] = [];
  for (let i = 0; i < 5; i++) {
    seen.push(sort.dir);
    sort = nextSort(spend, sort);
  }
  assert.deepEqual(seen, ["desc", "asc", "desc", "asc", "desc"], "press after press: the other way each time, never none");
});

test("on a server: a sortable header is a button in a <th> with aria-sort (ascending, descending, none), a plain header has none, and the hidden words say the sort", async () => {
  const { Table } = await table();
  const markup = html(
    h(Table, {
      caption: "Groups",
      columns: [
        { key: "name", header: "Group", sortable: true },
        { key: "spend", header: "Spend", numeric: true, sortable: true },
        { key: "note", header: "Note" },
      ],
      rows: [{ id: 1, name: "Qwen", spend: "$19.80", note: "composite" }],
      rowKey: "id",
      sort: { key: "spend", dir: "desc" },
      onSortChange: () => undefined,
    }),
  );
  const heads = [...markup.matchAll(/<th scope="col"([^>]*)>([\s\S]*?)<\/th>/g)].map((m) => ({ attrs: m[1], body: m[2] }));
  assert.equal(heads.length, 3);
  assert.match(heads[0].attrs, /aria-sort="none"/);
  assert.match(heads[0].body, /^<button type="button" class="s1-table__sort">Group<span class="s1-table__arrow" aria-hidden="true"><\/span><span class="s1-visually-hidden">, sort<\/span><\/button>$/);
  assert.match(heads[1].attrs, /aria-sort="descending"/);
  assert.match(heads[1].body, /data-dir="desc"/);
  assert.match(heads[1].body, /, sorted descending</);
  assert.doesNotMatch(heads[2].attrs, /aria-sort/);
  assert.doesNotMatch(heads[2].body, /<button/);
});

const ENTRY = (tablePath: string) => `
window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
import { useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Table } from ${JSON.stringify(tablePath)};

const ROWS = [
  { id: 1, name: "Qwen", created: "2026-09-02", spend: 19.8, rank: 2 },
  { id: 2, name: "Claude · Official", created: "2026-08-17", spend: 142.1, rank: 1 },
  { id: 3, name: "Draw", created: "2026-10-20", spend: 3.4, rank: 3 },
];
const heard = [];
let setOuter;
function Groups() {
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  setOuter = setSort;
  return (
    <Table
      caption="Groups"
      columns={[
        { key: "name", header: "Group", sortable: true },
        { key: "created", header: "Created", sortable: true, firstDir: "desc" },
        { key: "spend", header: "Spend", numeric: true, sortable: true },
        { key: "rank", header: "Rank", numeric: true, sortable: true, firstDir: "asc" },
        { key: "note", header: "Note", cell: () => "x" },
      ]}
      rows={ROWS}
      rowKey="id"
      sort={sort}
      onSortChange={(s) => { heard.push(s); setSort(s); }}
    />
  );
}
flushSync(() => createRoot(document.getElementById("app")).render(<Groups />));
const state = () => [...document.querySelectorAll("thead th")].map((th) => ({ head: th.textContent.split(",")[0], sort: th.getAttribute("aria-sort"), said: th.querySelector(".s1-visually-hidden")?.textContent ?? null, button: !!th.querySelector("button.s1-table__sort") }));
const press = (name) => flushSync(() => [...document.querySelectorAll("thead th button")].find((b) => b.textContent.startsWith(name)).click());
const steps = [{ step: "at first", state: state() }];
for (const name of ["Spend", "Spend", "Spend", "Group", "Group", "Created", "Rank", "Rank"]) {
  press(name);
  steps.push({ step: name, state: state() });
}
document.getElementById("out").textContent = JSON.stringify({ steps, heard });
`;

test("in Chrome: presses on the headers ask for each column's first direction, then the other way, one column at a time, never none; aria-sort and the hidden words follow", async (t) => {
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
  const page = path.join(out, "page.html");
  writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);
  let dom: string;
  try {
    dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--window-size=1200,800", "--virtual-time-budget=5000", "--dump-dom", pathToFileURL(page).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === "ENOENT" || err.code === "EACCES") return t.skip(`Chrome would not start (${bin}): ${err.code}`);
    assert.fail(`Chrome failed on the page (${bin}): ${String(err.stderr ?? e).slice(0, 400)}`);
  }
  const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
  const got = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&")) as {
    pageError?: string;
    steps: { step: string; state: { head: string; sort: string | null; said: string | null; button: boolean }[] }[];
    heard: { key: string; dir: string }[];
  };
  assert.equal(got.pageError, undefined, `the page failed: ${got.pageError}`);
  assert.deepEqual(
    got.heard,
    [
      { key: "spend", dir: "desc" },
      { key: "spend", dir: "asc" },
      { key: "spend", dir: "desc" },
      { key: "name", dir: "asc" },
      { key: "name", dir: "desc" },
      { key: "created", dir: "desc" },
      { key: "rank", dir: "asc" },
      { key: "rank", dir: "desc" },
    ],
    "what onSortChange heard, press by press",
  );
  const WORD = { ascending: "sorted ascending", descending: "sorted descending", none: "sort" } as Record<string, string>;
  for (const { step, state } of got.steps) {
    const sorted = state.filter((s) => s.sort === "ascending" || s.sort === "descending");
    assert.equal(sorted.length, 1, `${step}: one column is the sort, always`);
    for (const s of state) {
      if (s.head === "Note") {
        assert.equal(s.sort, null, `${step}: a header that does not sort has no aria-sort`);
        assert.equal(s.button, false, `${step}: and no button`);
      } else {
        assert.ok(s.button, `${step}: ${s.head} is a button`);
        assert.equal(s.said, `, ${WORD[s.sort!]}`, `${step}: ${s.head}'s hidden words say its sort`);
      }
    }
  }
  assert.equal(got.steps[1].state.find((s) => s.head === "Spend")!.sort, "descending", "the first press on figures: the biggest first");
  assert.equal(got.steps[1].state.find((s) => s.head === "Group")!.sort, "none", "the name is no longer the sort");
});
