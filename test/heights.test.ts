import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createElement as h, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

/*
 * One height for every button at a size, measured in a real browser: each variant of Button (and an <a> that is
 * one), with words, with an icon and words, and as an icon alone, in English and in Chinese, at md (40px) and sm
 * (30px); and an Input's action and a Secret's Show and Copy, after their box and as tall as it. Headless Chrome lays the parts out in their
 * own stylesheets alone (no reset, the system's fonts) and prints what it measured. Skipped where there is no
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

/* src/ui/ as plain ES modules in a scratch folder, so the parts render on a server as an app's would. */
const out = mkdtempSync(path.join(tmpdir(), "s1lin-heights-"));
after(() => rmSync(out, { recursive: true, force: true }));
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const part = async (name: string): Promise<any> => import(pathToFileURL(path.join(out, `${name}.js`)).href);

const icon = () => h("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor" }, h("path", { d: "M5 12h14M12 5v14" }));
const SIZES = { md: 40, sm: 30 } as const;
const WORDS = { en: "Save", "zh-CN": "新建用户" } as const;

test("every button is one height at a size: each variant, with and without an icon, in English and in Chinese; an Input's action and a Secret's buttons are their box's height, after it", async (t) => {
  const bin = chrome();
  if (!bin) return t.skip("no Chrome here: set CHROME to run it");
  const { Button } = await part("button");
  const { Input } = await part("input");
  const { Secret } = await part("secret");

  const cases: ReactNode[] = [];
  const mark = (key: string, node: ReactNode) => cases.push(h("div", { "data-case": key, key, className: "case" }, node));
  for (const size of ["md", "sm"] as const) {
    for (const lang of ["en", "zh-CN"] as const) {
      const word = WORDS[lang];
      const row: ReactNode[] = [];
      for (const variant of ["plain", "go", "ghost", "chip", "link"] as const) {
        row.push(h(Button, { key: `${variant}`, variant, size, "data-m": `${variant} words` }, word));
        row.push(h(Button, { key: `${variant}-i`, variant, size, icon: icon(), "data-m": `${variant} icon+words` }, word));
        row.push(h(Button, { key: `${variant}-e`, variant, size, iconEnd: icon(), "data-m": `${variant} words+iconEnd` }, word));
        if (variant !== "chip" && variant !== "link") row.push(h(Button, { key: `${variant}-o`, variant, size, icon: icon(), "aria-label": word, "data-m": `${variant} icon alone`, "data-square": "" }));
        if (variant !== "link") row.push(h(Button, { key: `${variant}-a`, variant, size, href: "#", icon: icon(), "data-m": `${variant} <a> icon+words` }, word));
      }
      row.push(h(Button, { key: "icon-o", variant: "icon", size, icon: icon(), "aria-label": word, "data-m": "icon icon alone", "data-square": "" }));
      row.push(h(Button, { key: "icon-c", variant: "icon", size, "aria-label": word, "data-m": "icon svg child", "data-square": "" }, icon()));
      mark(`${size} ${lang}`, h("div", { lang, className: "row", "data-size": size }, row));
      // an Input with an action, and with a Button handed in as its suffix: the button after the box, its height
      mark(
        `${size} ${lang} input`,
        h(
          "div",
          { lang, className: "row", "data-size": size },
          h(Input, { size, "aria-label": "Coupon", defaultValue: "SPRING26", action: h(Button, { variant: "ghost", icon: icon(), "data-m": "input action" }, word) }),
          h(Input, { size, "aria-label": "Amount", prefix: "$", suffix: h(Button, { size: "sm", "data-m": "input suffix Button" }, word) }),
        ),
      );
      // a Secret: its value's box, then Show and Copy after it, hidden and shown
      const words = lang === "en" ? undefined : { show: "显示", hide: "隐藏", hidden: "已隐藏" };
      mark(
        `${size} ${lang} secret`,
        h(
          "div",
          { lang, className: "row", "data-size": size },
          h(Secret, { size, value: "sk-tb-4f7c9e2a81d04b6f93a5c0e7d2b18f6a", label: lang === "en" ? "API key" : "API 密钥", keep: [6, 4], words }),
          h(Secret, { size, value: "whsec_b81f0c2d9e4a", label: "Webhook", defaultRevealed: true, words }),
        ),
      );
    }
  }

  const css = ["tokens.css", "button.css", "input.css", "copy.css", "secret.css", "visually-hidden.css"].map((f) => readFileSync(path.join(UI, f), "utf8")).join("\n");
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>@layer base, components;\n${css}\n.row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 8px; } .row > .s1-input, .row > .s1-input__row, .row > .s1-secret { width: 520px; }</style></head>
<body>${renderToStaticMarkup(h("main", null, cases))}
<pre id="out"></pre>
<script>
  const r = (el) => el.getBoundingClientRect();
  const got = [];
  for (const b of document.querySelectorAll(".s1-secret__actions .s1-btn")) b.dataset.m = "secret " + (b.closest(".s1-copy") ? "Copy" : "Show/Hide") + " (" + b.textContent.trim() + ")";
  for (const b of document.querySelectorAll("[data-m]")) {
    const row = b.closest(".row");
    const box = b.closest(".s1-input__row")?.querySelector(".s1-input") ?? b.closest(".s1-secret")?.querySelector(".s1-secret__value");
    got.push({ m: b.dataset.m, size: row.dataset.size, lang: row.lang, h: r(b).height, w: r(b).width, square: b.hasAttribute("data-square"),
      box: box ? { h: r(box).height, right: r(box).right, left: r(b).left, inside: box.contains(b), mid: r(box).top + r(box).height / 2, bmid: r(b).top + r(b).height / 2 } : null });
  }
  document.getElementById("out").textContent = JSON.stringify(got);
</script></body></html>`;
  const file = path.join(out, "heights.html");
  writeFileSync(file, page);
  let dom: string;
  try {
    dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1600,2000", "--dump-dom", pathToFileURL(file).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
  } catch (e) {
    return t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
  }
  const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
  type Got = { m: string; size: "md" | "sm"; lang: string; h: number; w: number; square: boolean; box: { h: number; right: number; left: number; inside: boolean; mid: number; bmid: number } | null };
  const got = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&")) as Got[];
  assert.ok(got.length > 60, `measured ${got.length} buttons`);
  if (process.env.S1LIN_HEIGHTS) writeFileSync(process.env.S1LIN_HEIGHTS, JSON.stringify(got, null, 1)); // the measurements, for a report

  const wrong = got.filter((g) => g.h !== SIZES[g.size]).map((g) => `${g.size} ${g.lang} ${g.m}: ${g.h}px, not ${SIZES[g.size]}px`);
  assert.deepEqual(wrong, [], "a button off its size's height");
  const notSquare = got.filter((g) => g.square && g.w !== g.h).map((g) => `${g.size} ${g.lang} ${g.m}: ${g.w}×${g.h}`);
  assert.deepEqual(notSquare, [], "an icon alone is a square");
  assert.equal(got.filter((x) => x.m.startsWith("secret")).length, 16, "Show and Copy of two Secrets (hidden, shown) in each of four rows");
  for (const g of got.filter((x) => x.m.startsWith("input") || x.m.startsWith("secret"))) {
    assert.ok(g.box, `${g.m}: in a row with its box`);
    assert.ok(Math.abs(g.box.mid - g.box.bmid) < 0.5, `${g.size} ${g.lang} ${g.m}: centred on the box's line`);
    assert.equal(g.box.inside, false, `${g.size} ${g.lang} ${g.m}: outside the box`);
    assert.ok(g.box.left >= g.box.right, `${g.size} ${g.lang} ${g.m}: after the box`);
    assert.equal(g.box.h, SIZES[g.size], `${g.size} ${g.lang} ${g.m}: the box keeps its height`);
  }
});

/*
 * Fields in a row (owner, 2026-11-06: "inputs in a row differ in size when one field has no hint"). A row of Fields is
 * one grid or flex row that stretches its items to the tallest; each Field keeps its label, box and hint at its top
 * (field.css: align-content: start), so the boxes share one line and one height whenever the labels do, and a hint
 * hangs under its own box with nothing held for one that is not there. The row here is left to stretch, as a page's
 * would be: the kit holds without the page's align-items. A Switch in such a row follows the docs' recipe (its track
 * on the boxes' line: kept at the top, margin-top the label's line and the gap, 40px tall, centred).
 */
test("fields in one row keep their boxes on one line and one height: a hint under one, none under the next, a Select and a Switch beside them, in a grid row and a flex row, in English and in Chinese", async (t) => {
  const bin = chrome();
  if (!bin) return t.skip("no Chrome here: set CHROME to run it");
  const { Field } = await part("field");
  const { Input } = await part("input");
  const { Select } = await part("select");
  const { Switch } = await part("switch");
  const WORDS = {
    en: { priority: "Priority", lower: "Lower goes first", concurrency: "Concurrency", cost: "Cost multiplier", free: "0 counts it as free", every: "Every", range: "15 – 3600", proxy: "Proxy", none: "None", on: "On" },
    "zh-CN": { priority: "优先级", lower: "数字小的先用", concurrency: "并发数", cost: "成本倍率", free: "0 表示免费", every: "间隔", range: "15 – 3600", proxy: "代理", none: "不用", on: "开启" },
  } as const;
  const rows: ReactNode[] = [];
  for (const lang of ["en", "zh-CN"] as const) {
    const w = WORDS[lang];
    for (const kind of ["grid", "flex"] as const) {
      rows.push(
        h(
          "div",
          { key: `${lang}-${kind}-three`, lang, className: `frow frow--${kind}`, "data-row": `${lang} ${kind}: hint, none, hint` },
          h(Field, { label: w.priority, hint: w.lower }, h(Input, { type: "number", defaultValue: "1" })),
          h(Field, { label: w.concurrency }, h(Input, { type: "number", defaultValue: "20" })),
          h(Field, { label: w.cost, hint: w.free }, h(Input, { type: "number", defaultValue: "0.5" })),
        ),
        h(
          "div",
          { key: `${lang}-${kind}-mixed`, lang, className: `frow frow--${kind}`, "data-row": `${lang} ${kind}: hint, a Select, a Switch` },
          h(Field, { label: w.every, hint: w.range }, h(Input, { inputMode: "numeric", defaultValue: "60", suffix: "s" })),
          h(Field, { label: w.proxy }, h(Select, { defaultValue: "" }, h("option", { value: "" }, w.none), h("option", { value: "jp" }, "jp-relay-1"))),
          h(Switch, { defaultChecked: true }, w.on),
        ),
      );
    }
  }
  const css = ["tokens.css", "field.css", "input.css", "select.css", "switch.css", "glyph.css", "visually-hidden.css"].map((f) => readFileSync(path.join(UI, f), "utf8")).join("\n");
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>@layer base, components;\n${css}
.frow { width: 900px; margin: 16px; gap: 16px; }
.frow--grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.frow--flex { display: flex; }
.frow--flex > * { flex: 1 1 0; }
/* the docs' recipe for a Switch in a row of fields: below the labels' line (11px at 1.4; 12px in Chinese) and the gap,
   as tall as a box, its track centred in it */
.frow > .s1-switch { align-self: start; margin-top: calc(11px * 1.4 + 6px); min-height: 40px; align-content: center; }
.frow > .s1-switch:lang(zh) { margin-top: calc(12px * 1.4 + 6px); }
.frow > .s1-switch .s1-switch__row { align-items: center; }
.frow > .s1-switch .s1-switch__control { margin-top: 0; }
</style></head>
<body>${renderToStaticMarkup(h("main", null, rows))}
<pre id="out"></pre>
<script>
  const r = (el) => el.getBoundingClientRect();
  const got = [];
  for (const row of document.querySelectorAll("[data-row]")) {
    const boxes = [...row.querySelectorAll(".s1-input, .s1-select__trigger")].map((b) => ({ kind: b.matches(".s1-input") ? "input" : "select", top: r(b).top, h: r(b).height, mid: r(b).top + r(b).height / 2 }));
    const track = row.querySelector(".s1-switch__track");
    const fields = [...row.querySelectorAll(".s1-field")].map((f) => ({ h: r(f).height, hint: !!f.querySelector(".s1-field__hint") }));
    got.push({ row: row.dataset.row, boxes, track: track ? { mid: r(track).top + r(track).height / 2 } : null, fields });
  }
  document.getElementById("out").textContent = JSON.stringify(got);
</script></body></html>`;
  const file = path.join(out, "field-rows.html");
  writeFileSync(file, page);
  let dom: string;
  try {
    dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1200,1400", "--dump-dom", pathToFileURL(file).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
  } catch (e) {
    // only a browser that cannot start here at all is a skip; a crash or a hang on the page is a failure
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === "ENOENT" || err.code === "EACCES") return t.skip(`Chrome would not start (${bin}): ${err.code}`);
    assert.fail(`Chrome failed on the page (${bin}): ${String(err.stderr ?? e).slice(0, 400)}`);
  }
  const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
  type Row = { row: string; boxes: { kind: string; top: number; h: number; mid: number }[]; track: { mid: number } | null; fields: { h: number; hint: boolean }[] };
  const got = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&")) as Row[];
  if (process.env.S1LIN_FIELD_ROWS) writeFileSync(process.env.S1LIN_FIELD_ROWS, JSON.stringify(got, null, 1)); // the measurements, for a report
  assert.equal(got.length, 8, "two rows, in a grid and a flex row, in two languages");
  for (const row of got) {
    assert.equal(row.boxes.length, row.track ? 2 : 3, `${row.row}: every box measured`);
    const [first, ...rest] = row.boxes;
    for (const b of rest) {
      assert.ok(Math.abs(b.top - first.top) < 0.5, `${row.row}: the ${b.kind} box starts at ${b.top}px, the first at ${first.top}px`);
      assert.ok(Math.abs(b.h - first.h) < 0.5, `${row.row}: the ${b.kind} box is ${b.h}px tall, the first ${first.h}px`);
    }
    assert.equal(first.h, 40, `${row.row}: a box keeps its 40px`);
    // a Field stretched by the row is as tall as the row, yet its box is where it would be alone
    assert.ok(row.fields.some((f) => !f.hint), `${row.row}: a field with no hint is in the row`);
    if (row.track) assert.ok(Math.abs(row.track.mid - first.mid) < 0.5, `${row.row}: the switch's track sits on the boxes' line (${row.track.mid} against ${first.mid})`);
  }
});
