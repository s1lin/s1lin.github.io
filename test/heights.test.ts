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
 * (30px); and an Input's action, after the box and as tall as it. Headless Chrome lays the parts out in their
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

test("every button is one height at a size: each variant, with and without an icon, in English and in Chinese; an Input's action is its box's height", async (t) => {
  const bin = chrome();
  if (!bin) return t.skip("no Chrome here: set CHROME to run it");
  const { Button } = await part("button");
  const { Input } = await part("input");

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
    }
  }

  const css = ["tokens.css", "button.css", "input.css"].map((f) => readFileSync(path.join(UI, f), "utf8")).join("\n");
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>@layer base, components;\n${css}\n.row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 8px; } .row > .s1-input, .row > .s1-input__row { width: 320px; }</style></head>
<body>${renderToStaticMarkup(h("main", null, cases))}
<pre id="out"></pre>
<script>
  const r = (el) => el.getBoundingClientRect();
  const got = [];
  for (const b of document.querySelectorAll("[data-m]")) {
    const row = b.closest(".row");
    const box = b.closest(".s1-input__row")?.querySelector(".s1-input");
    got.push({ m: b.dataset.m, size: row.dataset.size, lang: row.lang, h: r(b).height, w: r(b).width, square: b.hasAttribute("data-square"),
      box: box ? { h: r(box).height, right: r(box).right, left: r(b).left, inside: box.contains(b) } : null });
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
  type Got = { m: string; size: "md" | "sm"; lang: string; h: number; w: number; square: boolean; box: { h: number; right: number; left: number; inside: boolean } | null };
  const got = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&")) as Got[];
  assert.ok(got.length > 60, `measured ${got.length} buttons`);
  if (process.env.S1LIN_HEIGHTS) writeFileSync(process.env.S1LIN_HEIGHTS, JSON.stringify(got, null, 1)); // the measurements, for a report

  const wrong = got.filter((g) => g.h !== SIZES[g.size]).map((g) => `${g.size} ${g.lang} ${g.m}: ${g.h}px, not ${SIZES[g.size]}px`);
  assert.deepEqual(wrong, [], "a button off its size's height");
  const notSquare = got.filter((g) => g.square && g.w !== g.h).map((g) => `${g.size} ${g.lang} ${g.m}: ${g.w}×${g.h}`);
  assert.deepEqual(notSquare, [], "an icon alone is a square");
  for (const g of got.filter((x) => x.m.startsWith("input"))) {
    assert.ok(g.box, `${g.m}: in a row with its box`);
    assert.equal(g.box.inside, false, `${g.size} ${g.lang} ${g.m}: outside the box`);
    assert.ok(g.box.left >= g.box.right, `${g.size} ${g.lang} ${g.m}: after the box`);
    assert.equal(g.box.h, SIZES[g.size], `${g.size} ${g.lang} ${g.m}: the box keeps its height`);
  }
});
