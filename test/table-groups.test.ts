import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createElement as h, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import ts from "typescript";

/*
 * The Table's row groups and its fit mode, rendered on a server as an app would: each group a <tbody> named by
 * its heading row, a toggle with aria-expanded, closed groups without their rows, "Expand all" above, the
 * open-groups helpers, a cell across columns, clamped cells with their title, row attributes.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const UI = path.join(ROOT, "src/ui");
const out = mkdtempSync(path.join(tmpdir(), "s1lin-table-"));
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

const columns = [
  { key: "name", header: "Model" },
  { key: "price", header: "Price", numeric: true, title: (r: { price: string }) => `Price ${r.price}` },
  { key: "note", header: "Note", clamp: 2 },
];
const groups = [
  { key: "a", heading: "Claude", label: "Claude", meta: (open: boolean) => (open ? "2 models" : "2 models · $3–$15"), rows: [
    { id: 1, name: "opus", price: "$15", note: "long words" },
    { id: 2, name: "sonnet", price: "$3", note: "more words" },
  ] },
  { key: "b", heading: h("b", null, "GPT"), rows: [{ id: 3, name: "gpt", price: "$2", note: "x" }] },
  { key: "c", heading: "Empty", rows: [], empty: "No models" },
];

test("Table groups: a <tbody> each, named by its heading row across the table, every row shown when not collapsible", async () => {
  const { Table } = await table();
  const m = html(h(Table, { caption: "Models", columns, groups, rowKey: "id" }));
  assert.equal([...m.matchAll(/<tbody class="s1-table__group"/g)].length, 3);
  assert.equal([...m.matchAll(/<th colSpan="3" scope="rowgroup">/g)].length, 3);
  const named = [...m.matchAll(/<tbody[^>]*aria-labelledby="([^"]+)"/g)].map((x) => x[1]);
  for (const id of named) assert.match(m, new RegExp(`<div id="${id}" class="s1-table__gheading">`));
  assert.deepEqual([...m.matchAll(/<th scope="row"[^>]*>(\w+)<\/th>/g)].map((x) => x[1]), ["opus", "sonnet", "gpt"]);
  assert.match(m, /<td colSpan="3" class="s1-table__empty">No models<\/td>/);
  assert.match(m, /<div class="s1-table__gmeta">2 models<\/div>/);
  assert.doesNotMatch(m, /s1-table__toggle|s1-table__all/);
  // a column's title on its cells, a clamped cell in its box
  assert.match(m, /<td class="s1-table__num" title="Price \$15">\$15<\/td>/);
  assert.match(m, /<td class="s1-table__clamped"><span class="s1-table__clamp" style="-webkit-line-clamp:2">long words<\/span><\/td>/);
});

test("Table groups, collapsible: a toggle with aria-expanded, closed groups keep only their heading row, Expand all above", async () => {
  const { Table, ALL_GROUPS_CLOSED } = await table();
  const shut = { all: false, except: ["b"] };
  const m = html(h(Table, { caption: "Models", columns, groups, rowKey: "id", collapsible: true, expandAll: true, openGroups: shut }));
  const toggles = [...m.matchAll(/<button type="button" class="s1-table__toggle"[^>]*>/g)].map((x) => x[0]);
  assert.equal(toggles.length, 3);
  assert.match(toggles[0], /aria-expanded="false"/);
  assert.match(toggles[0], /aria-label="Claude"/);
  assert.match(toggles[1], /aria-expanded="true"/);
  assert.match(toggles[1], /aria-labelledby="[^"]+"/);
  assert.doesNotMatch(m, />opus</);
  assert.match(m, />gpt</);
  assert.match(m, /<div class="s1-table__gmeta">2 models · \$3–\$15<\/div>/);
  assert.match(m, /<tbody class="s1-table__group" data-open=""/);
  assert.match(m, /<button type="button" class="s1-table__all" aria-expanded="false">[\s\S]*?Expand all<\/button>/);
  const all = html(h(Table, { caption: "Models", columns, groups, rowKey: "id", collapsible: true, expandAll: true, defaultOpenGroups: { all: true, except: [] }, groupWords: { expandAll: "全部展开", collapseAll: "全部收起" } }));
  assert.match(all, /aria-expanded="true">[\s\S]*?全部收起<\/button>/);
  const none = html(h(Table, { caption: "Models", columns, groups, rowKey: "id", collapsible: true, defaultOpenGroups: ALL_GROUPS_CLOSED }));
  assert.doesNotMatch(none, /<th scope="row"/);
  assert.doesNotMatch(none, /No models/);
});

test("the open-groups helpers: every group but the exceptions, or only them; later groups follow `all`", async () => {
  const { isGroupOpen, withGroupOpen, allGroupsOpen, ALL_GROUPS_OPEN } = await table();
  const o = { all: false, except: ["a"] };
  assert.equal(isGroupOpen(o, "a"), true);
  assert.equal(isGroupOpen(o, "new"), false);
  assert.deepEqual(withGroupOpen(o, "a", false), { all: false, except: [] });
  assert.deepEqual(withGroupOpen(o, "b", true), { all: false, except: ["a", "b"] });
  assert.equal(withGroupOpen(o, "a", true), o);
  assert.equal(isGroupOpen(withGroupOpen(ALL_GROUPS_OPEN, "x", false), "x"), false);
  assert.equal(allGroupsOpen(ALL_GROUPS_OPEN, ["a", "b"]), true);
  assert.equal(allGroupsOpen(o, ["a", "b"]), false);
  assert.equal(allGroupsOpen(o, []), false);
});

test("Table rows: a cell across columns skips the ones it covers; row attributes reach the <tr>; fit adds its class", async () => {
  const { Table } = await table();
  const cols = [
    { key: "name", header: "Model" },
    { key: "in", header: "In", span: (r: { voice?: boolean }) => (r.voice ? 2 : undefined) },
    { key: "out", header: "Out" },
    { key: "rate", header: "Rate" },
  ];
  const rows = [
    { id: 1, name: "tts", in: "Text in $1 · out $2", out: "never", rate: "1x", voice: true },
    { id: 2, name: "chat", in: "$1", out: "$2", rate: "1x" },
  ];
  const m = html(h(Table, { caption: "Prices", columns: cols, rows, rowKey: "id", fit: true, rowProps: (r: { id: number }) => ({ className: "row", "data-id": r.id }) }));
  assert.match(m, /<div class="s1-table s1-table--fit"/);
  assert.match(m, /<tr class="row" data-id="1"><th scope="row">tts<\/th><td colSpan="2">Text in \$1 · out \$2<\/td><td>1x<\/td><\/tr>/);
  assert.doesNotMatch(m, /never/);
  assert.match(m, /<tr class="row" data-id="2"><th scope="row">chat<\/th><td>\$1<\/td><td>\$2<\/td><td>1x<\/td><\/tr>/);
});
