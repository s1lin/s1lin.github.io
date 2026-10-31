import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createElement as h, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import ts from "typescript";
import { ENTRIES } from "../src/components/uidocs/registry.ts";

/*
 * The library's parts against the house rules, and the console's parts against
 * what they promise a screen reader: every stylesheet stays in its layer, in s1-
 * classes and --s1- tokens, in no colour of its own; every part that draws in
 * the tokens brings them first; the console's parts stay off the issue's
 * stylesheet; and each console part, rendered on a server as an app would,
 * carries the roles, names and wiring its docs say.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const UI = path.join(ROOT, "src/ui");
const read = (f: string) => readFileSync(path.join(ROOT, f), "utf8");
type Item = { name: string; categories?: string[]; files: { path: string }[] };
const MANIFEST = JSON.parse(read("registry.json")) as { items: Item[] };

// ------------------------------------------------------------------ the house rules

const sheets = readdirSync(UI).filter((f) => f.endsWith(".css") && f !== "tokens.css" && f !== "tex.css");
const uncomment = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

test("every part's stylesheet is one @layer components block", () => {
  for (const f of sheets) {
    const css = uncomment(readFileSync(path.join(UI, f), "utf8")).trim();
    assert.match(css, /^@layer components \{[\s\S]*\}$/, `${f}: everything inside @layer components { … }`);
    assert.equal(css.match(/@layer /g)?.length, 1, `${f}: one layer block`);
  }
});

test("every part's classes begin s1- and every variable is a --s1- token", () => {
  for (const f of sheets) {
    const css = uncomment(readFileSync(path.join(UI, f), "utf8"));
    for (const [, prelude] of css.matchAll(/([^{};]+)\{/g)) {
      if (prelude.trim().startsWith("@")) continue;
      for (const [, cls] of prelude.matchAll(/\.([a-zA-Z_][\w-]*)/g)) assert.ok(cls.startsWith("s1-"), `${f}: .${cls} in "${prelude.trim()}" is not an s1- class`);
    }
    for (const [, v] of css.matchAll(/var\(\s*--([\w-]+)/g)) assert.ok(v.startsWith("s1-"), `${f}: var(--${v}) is not an --s1- token`);
  }
});

test("no part has a colour of its own: every colour comes from tokens.css", () => {
  for (const f of sheets) {
    const css = uncomment(readFileSync(path.join(UI, f), "utf8"));
    assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, `${f}: a hex colour; use a --s1- token`);
    assert.doesNotMatch(css, /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/, `${f}: a colour function; use a --s1- token`);
  }
});

test("a part that draws in the tokens imports tokens.css before its own stylesheet", () => {
  for (const f of readdirSync(UI).filter((x) => x.endsWith(".tsx"))) {
    const name = f.replace(/\.tsx$/, "");
    const own = path.join(UI, `${name}.css`);
    let css = "";
    try {
      css = readFileSync(own, "utf8");
    } catch {
      continue;
    }
    if (!css.includes("var(--s1-")) continue;
    const imports = [...readFileSync(path.join(UI, f), "utf8").matchAll(/^import\s+["'](\.\/[\w-]+\.css)["'];/gm)].map((m) => m[1]);
    assert.deepEqual(imports.slice(0, 1), ["./tokens.css"], `${f}: import "./tokens.css" first, so the base layer is declared before components`);
    assert.ok(imports.includes(`./${name}.css`), `${f}: import its own stylesheet`);
  }
});

test("a part or hook that uses React's hooks or handlers is marked \"use client\", for apps with server components", () => {
  for (const f of readdirSync(UI).filter((x) => /\.tsx?$/.test(x))) {
    const text = readFileSync(path.join(UI, f), "utf8");
    const client = /\buse[A-Z]\w*\(/.test(text) || /\son[A-Z]\w*=\{/.test(text) || /\bcreateContext\(/.test(text);
    if (client) assert.ok(text.startsWith('"use client";\n'), `${f}: begin with "use client";`);
  }
});

test("the console's parts are in the console category, and no page but /ui/ imports one", () => {
  const consoleGroups = new Set(["forms", "data", "overlays", "feedback", "text"]);
  const isConsole = new Map(MANIFEST.items.map((i) => [i.name, Boolean(i.categories?.includes("console"))]));
  for (const e of ENTRIES) {
    if (e.item && consoleGroups.has(e.group)) assert.ok(isConsole.get(e.item), `${e.item}: documented with the console's parts, so category "console" (vite.config.ts keeps it off the issue's stylesheet)`);
  }
  // the pages other than /ui/: a console part imported there would bring the issue a second stylesheet
  const walk = (dir: string): string[] =>
    readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((d) => {
      const p = path.join(dir, d.name);
      if (d.isDirectory()) return p === "src/ui" || p === "src/components/uidocs" ? [] : walk(p);
      return /\.tsx?$/.test(d.name) && p !== "src/ui.tsx" ? [p] : [];
    });
  for (const f of walk("src")) {
    for (const [, part] of read(f).matchAll(/from\s+["']@\/ui\/([\w-]+)["']/g)) assert.ok(!isConsole.get(part), `${f} imports @/ui/${part}, a console part: take it out of the console category first`);
  }
});

// ------------------------------------------------------------------ the console's parts, rendered on a server

/* src/ui/ as plain ES modules in a scratch folder (stylesheets dropped), so node can import the parts as an app's bundler would. */
const out = mkdtempSync(path.join(tmpdir(), "s1lin-ui-"));
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
const part = async (name: string): Promise<any> => import(pathToFileURL(path.join(out, `${name}.js`)).href);
/** Server HTML, without React's markers between adjacent texts. */
const html = (node: ReactNode) => renderToString(node as never).replaceAll("<!-- -->", "");
/** An attribute of the first element matching a tag and a class (or any element, by attribute). */
const attr = (markup: string, element: RegExp, name: string) => markup.match(element)?.[0].match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

test("Field: the label points at the control, which is described by the error then the hint, invalid and required", async () => {
  const { Field } = await part("field");
  const { Input } = await part("input");
  const m = html(h(Field, { label: "Key name", hint: "Shown in your list.", error: "Give it a name.", required: true, id: "name" }, h(Input, {})));
  assert.equal(attr(m, /<label[^>]*>/, "for"), "name");
  const input = /<input[^>]*>/;
  assert.equal(attr(m, input, "id"), "name");
  assert.equal(attr(m, input, "aria-describedby"), "name-error name-hint");
  assert.equal(attr(m, input, "aria-invalid"), "true");
  assert.match(m.match(input)![0], /\srequired=""/);
  assert.match(m, /<p id="name-error"[^>]*>.*Give it a name\./);
  assert.match(m, /<p id="name-hint"[^>]*><span>Shown in your list\.<\/span><\/p>/);
  // the "*" is for the eye only: the control says required
  assert.match(m, /<span class="s1-field__req" aria-hidden="true">\*<\/span>/);
});

test("Input: words before and after are read with it; outside a Field it keeps its own wiring", async () => {
  const { Input } = await part("input");
  const m = html(h(Input, { prefix: "$", suffix: "USD", "aria-label": "Amount", "aria-describedby": "note", invalid: true }));
  const ids = attr(m, /<input[^>]*>/, "aria-describedby")!.split(" ");
  assert.equal(ids.length, 3);
  assert.equal(ids[2], "note");
  for (const id of ids.slice(0, 2)) assert.match(m, new RegExp(`id="${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>(\\$|USD)<`));
  assert.equal(attr(m, /<input[^>]*>/, "aria-invalid"), "true");
  assert.match(m, /class="s1-input s1-input--md"[^>]*data-invalid=""/);
});

test("Select: a placeholder shows until a choice, and cannot be chosen again when required", async () => {
  const { Select } = await part("select");
  const m = html(h(Select, { placeholder: "Choose a model", required: true, "aria-label": "Model" }, h("option", { value: "a" }, "a")));
  assert.match(m, /<option value="" disabled="" selected="">Choose a model<\/option>/);
});

test("Checkbox and Switch: native inputs, the hint as the description, the switch a switch", async () => {
  const { Checkbox } = await part("checkbox");
  const { Switch } = await part("switch");
  const c = html(h(Checkbox, { hint: "Each invoice by email." }, "Email invoices"));
  assert.match(c, /<input type="checkbox"/);
  const hint = attr(c, /<input[^>]*>/, "aria-describedby")!;
  assert.match(c, new RegExp(`<span class="s1-check__hint" id="${hint}">Each invoice by email\\.</span>`));
  assert.match(c, /<label class="s1-check__row">/);
  const s = html(h(Switch, { defaultChecked: true }, "Email me"));
  assert.match(s, /<input type="checkbox" role="switch"/);
  // phrasing content only, so either may sit in a paragraph
  assert.doesNotMatch(c + s, /<(div|p)[\s>]/);
});

test("RadioGroup: a radiogroup fieldset; one name; each radio named by its label alone and described by its hint", async () => {
  const { RadioGroup } = await part("radio-group");
  const m = html(
    h(RadioGroup, {
      legend: "Amount",
      required: true,
      error: "Choose one.",
      name: "amount",
      options: [
        { value: "5", label: "$5", hint: "the least" },
        { value: "20", label: "$20" },
      ],
    }),
  );
  const fs = /<fieldset[^>]*>/;
  assert.equal(attr(m, fs, "role"), "radiogroup");
  assert.equal(attr(m, fs, "aria-required"), "true");
  assert.equal(attr(m, fs, "aria-invalid"), "true");
  assert.match(m, /<legend[^>]*>Amount/);
  const radios = [...m.matchAll(/<input[^>]*type="radio"[^>]*>/g)].map((r) => r[0]);
  assert.equal(radios.length, 2);
  for (const r of radios) assert.match(r, /name="amount"/);
  const label = attr(radios[0], /.*/, "aria-labelledby")!;
  assert.match(m, new RegExp(`id="${label}">\\$5</span>`));
  const desc = attr(radios[0], /.*/, "aria-describedby")!;
  assert.match(m, new RegExp(`id="${desc}">the least</span>`));
  assert.equal(attr(radios[1], /.*/, "aria-describedby"), undefined);
});

test("Table: caption, column and row headers, aria-sort, an empty row across, rows of bars and aria-busy while loading", async () => {
  const { Table } = await part("table");
  const columns = [
    { key: "name", header: "Name", sortable: true },
    { key: "spend", header: "Spend", numeric: true, sortable: true },
    { key: "note", header: "Note" },
  ];
  const rows = [
    { id: 1, name: "prod", spend: "$4", note: "a" },
    { id: 2, name: "dev", spend: "$1", note: "b" },
  ];
  const actions = () => h("button", null, "⋯");
  const m = html(h(Table, { caption: "API keys", columns, rows, rowKey: "id", sort: { key: "spend", dir: "desc" }, actions }));
  assert.match(m, /<caption id="[^"]+"[^>]*>API keys<\/caption>/);
  assert.equal([...m.matchAll(/<th scope="col"/g)].length, 4);
  assert.deepEqual([...m.matchAll(/aria-sort="(\w+)"/g)].map((x) => x[1]), ["none", "descending"]);
  assert.deepEqual([...m.matchAll(/<th scope="row"[^>]*>(\w+)<\/th>/g)].map((x) => x[1]), ["prod", "dev"]);
  assert.match(m, /<span class="s1-visually-hidden">Actions<\/span>/);
  assert.match(m, /class="s1-table__num"[^>]*>\$4</);
  // a frame that does not scroll (as on the server) is no landmark and no tab stop
  assert.doesNotMatch(m.match(/<div class="s1-table__frame"[^>]*>/)![0], /role=|tabindex/);
  const empty = html(h(Table, { caption: "API keys", columns, rows: [], rowKey: "id", actions, empty: "No keys yet." }));
  assert.match(empty, /<td colSpan="4" class="s1-table__empty">No keys yet\.<\/td>/);
  const loading = html(h(Table, { caption: "API keys", columns, rows, rowKey: "id", loading: 3 }));
  assert.match(loading, /<table aria-busy="true">/);
  assert.equal([...loading.matchAll(/class="s1-table__loading"/g)].length, 3);
  assert.doesNotMatch(loading, />prod</);
});

test("Pagination: the pages shown, the current one marked, Previous disabled on the first", async () => {
  const { Pagination, pageList } = await part("pagination");
  assert.deepEqual(pageList(6, 12), [1, "gap", 5, 6, 7, "gap", 12]);
  assert.deepEqual(pageList(1, 12), [1, 2, "gap", 12]);
  assert.deepEqual(pageList(3, 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(pageList(1, 1), [1]);
  const m = html(h(Pagination, { page: 1, pageCount: 12 }));
  assert.match(m, /<nav class="s1-pages" aria-label="Pagination">/);
  assert.match(m, /aria-label="Page 1" aria-current="page"/);
  // aria-disabled, not disabled: a step pressed onto the end keeps its focus
  assert.match(m, /<button type="button" class="s1-pages__step" aria-label="Previous" aria-disabled="true">/);
  assert.match(m, /Page 1 of 12/);
  const links = html(h(Pagination, { page: 12, pageCount: 12, href: (p: number) => `?page=${p}` }));
  assert.match(links, /<a class="s1-pages__step" aria-label="Next" role="link" aria-disabled="true">/);
  assert.match(links, /href="\?page=11"/);
});

test("Badge, Glyph, Notice, Stat: shapes are hidden, words say the status", async () => {
  const { Badge } = await part("badge");
  const { Notice } = await part("notice");
  const { Stat } = await part("stat");
  assert.match(html(h(Badge, { status: "bad" }, "Revoked")), /<span class="s1-badge s1-badge--bad"><span class="s1-glyph s1-glyph--bad" aria-hidden="true"><\/span>Revoked<\/span>/);
  const n = html(h(Notice, { status: "warn", title: "Balance low" }, "Top up soon."));
  assert.match(n, /<p class="s1-notice__title"><span class="s1-visually-hidden">Warning: <\/span>Balance low<\/p>/);
  assert.match(html(h(Notice, { status: "bad", statusLabel: "" }, "x")), /<div class="s1-notice__text">x<\/div>/);
  const s = html(h(Stat, { label: "Spend", value: "$41.20", delta: "+12.5%", trend: "up" }));
  const label = attr(s, /<div[^>]*role="group"[^>]*>/, "aria-labelledby")!;
  assert.match(s, new RegExp(`<p class="s1-stat__label" id="${label}">Spend</p>`));
  assert.match(s, /aria-hidden="true"><\/span><span class="s1-visually-hidden">Up <\/span><span>\+12\.5%/);
  assert.match(html(h(Stat, { label: "Balance", value: "$8", loading: true })), /aria-busy="true"/);
});

test("Meter: a meter named by its label, the value held inside the range, the words as its value", async () => {
  const { Meter } = await part("meter");
  const m = html(h(Meter, { label: "Video seconds", value: 312, max: 300, valueText: "312 s of 300 s" }));
  const meter = /<div class="s1-meter__track"[^>]*>/;
  assert.equal(attr(m, meter, "role"), "meter");
  assert.equal(attr(m, meter, "aria-valuenow"), "300");
  assert.equal(attr(m, meter, "aria-valuetext"), "312 s of 300 s");
  assert.match(m, /class="s1-meter s1-meter--over"/);
  assert.match(m, new RegExp(`id="${attr(m, meter, "aria-labelledby")}">Video seconds<`));
});

test("Dialog, Menu, Tabs, Toaster: closed overlays are in the server HTML, wired and hidden", async () => {
  const { Dialog } = await part("dialog");
  const { Menu } = await part("menu");
  const { Tabs } = await part("tabs");
  const { Toaster } = await part("toast");
  const d = html(h(Dialog, { open: false, onClose() {}, title: "Create a key" }, "body"));
  assert.match(d, /^<dialog class="s1-dialog s1-dialog--md" aria-labelledby="[^"]+"><\/dialog>$/);

  const m = html(h(Menu, { label: "Actions for prod", items: [{ label: "Rename" }, "separator", { label: "Revoke", danger: true }] }));
  const button = /<button[^>]*aria-haspopup[^>]*>/;
  assert.equal(attr(m, button, "aria-expanded"), "false");
  assert.equal(attr(m, button, "aria-label"), "Actions for prod");
  const list = /<span[^>]*role="menu"[^>]*>/;
  assert.equal(attr(m, list, "id"), attr(m, button, "aria-controls"));
  assert.equal(attr(m, list, "aria-labelledby"), attr(m, button, "id"));
  assert.equal(attr(m, list, "popover"), "manual");
  assert.match(m.match(list)![0], /\shidden=""/);
  assert.equal([...m.matchAll(/role="menuitem" tabindex="-1"/g)].length, 2);
  assert.match(m, /role="separator"/);
  assert.doesNotMatch(m, /<(div|p)[\s>]/, "phrasing content only");

  const t = html(
    h(Tabs, {
      label: "Usage",
      tabs: [
        { id: "a", label: "Overview", content: "A" },
        { id: "b", label: "Models", content: "B" },
        { id: "c", label: "Exports", content: "C", disabled: true },
      ],
    }),
  );
  assert.match(t, /role="tablist" aria-label="Usage"/);
  assert.deepEqual([...t.matchAll(/tabindex="(-?\d)"[^>]*role="tab"|role="tab"[^>]*tabindex="(-?\d)"/g)].map((x) => x[1] ?? x[2]), ["0", "-1", "-1"]);
  for (const [, controls] of t.matchAll(/aria-controls="([^"]+)"/g)) assert.match(t, new RegExp(`role="tabpanel" id="${controls}"`));
  assert.equal([...t.matchAll(/role="tabpanel"[^>]*hidden=""/g)].length, 2);
  assert.match(t, /tabindex="0">A<\/div>/);
  assert.doesNotMatch(t, />B</, "only the open panel is mounted");

  assert.equal(html(h(Toaster, {})), '<section class="s1-toaster s1-toaster--bottom-end" aria-label="Notifications"><ol aria-live="polite"></ol></section>');
});

test("Secret: hidden, the page holds only the dots and the ends; the buttons are named for what they do", async () => {
  const { Secret } = await part("secret");
  const key = "sk-tb-4f7c9e2a81d04b6f93a5c0e7d2b18f6a";
  const m = html(h(Secret, { value: key, label: "API key", keep: [3, 4] }));
  assert.ok(!m.includes(key.slice(3, -4)), "the hidden middle is not in the HTML");
  assert.match(m, /role="group" aria-label="API key"/);
  assert.match(m, /<span aria-hidden="true">sk-<span class="s1-secret__dots">•+<\/span>8f6a<\/span><span class="s1-visually-hidden">API key, hidden<\/span>/);
  assert.match(m, /aria-label="Show API key"[^>]*>Show</);
  assert.match(m, /aria-label="Copy API key"[^>]*>Copy</);
  assert.ok(html(h(Secret, { value: key, defaultRevealed: true })).includes(key));
});

test("Copy, Code, Spinner, VisuallyHidden: the result is said in a status beside the button, not in its name", async () => {
  const { Copy } = await part("copy");
  const { Code } = await part("code");
  const { Spinner } = await part("spinner");
  const c = html(h(Copy, { value: "x", label: "Copy the base URL" }));
  assert.match(c, /<button type="button" class="s1-btn s1-btn--plain s1-btn--sm" aria-label="Copy the base URL">Copy<\/button><span class="s1-visually-hidden" role="status"><\/span>/);
  const b = html(h(Code, { block: true, copy: true, label: "curl" }, "curl https://…"));
  assert.match(b, /aria-label="Copy curl"/);
  assert.match(b, /<pre class="s1-code-block__pre"><code>curl https:\/\/…<\/code><\/pre>/, "no tab stop until it overflows");
  assert.equal(html(h(Code, null, "qwen-3.8")), '<code class="s1-code">qwen-3.8</code>');
  assert.match(html(h(Spinner, {})), /<span class="s1-spinner" role="status">.*<span class="s1-visually-hidden">Loading<\/span><\/span>$/);
  assert.match(html(h(Spinner, { decorative: true })), /^<span class="s1-spinner" aria-hidden="true">/);
});
