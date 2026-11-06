import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import react from "@vitejs/plugin-react";
import ts from "typescript";
import { build } from "vite";

/*
 * IconButton and the ghost Menu, a row's actions (admin Services redesign §3.4; owner, 2026-11-06: "status and delete
 * in the dropdown; bordered …"): a square with one icon, named by its aria-label, its tooltip the same; no line and no
 * paper at rest, the default in the second ink, `tone="danger"` in --s1-bad; under the pointer the ink fill (the
 * danger one the bad hue's), the icon AA (3:1) on its ground at rest and under the pointer; the keyboard's ring 2px in
 * the ink; 40px and 30px squares, the icon 16px and 14px. A ghost Menu's dots are the same square, without a line, in
 * the second ink. On a server, then in Chrome on paper, at night and in a brand theme that sets the status hues.
 * Skipped where there is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-icon-button-"));
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
const html = (node: unknown) => renderToString(node as never).replaceAll("<!-- -->", "");

test("on a server: a <button type=button> named by its aria-label, titled the same unless title says otherwise, its icon hidden, a ghost square; danger adds its tone", async () => {
  const { IconButton } = await part("icon-button");
  const { Menu } = await part("menu");
  const svg = h("svg", { viewBox: "0 0 24 24" });
  assert.equal(
    html(h(IconButton, { icon: svg, "aria-label": "Delete Qwen", tone: "danger", size: "sm" })),
    '<button type="button" class="s1-btn s1-btn--ghost s1-btn--sm s1-btn--with-icon s1-btn--icon-only s1-icon-btn s1-icon-btn--danger" title="Delete Qwen" aria-label="Delete Qwen"><span class="s1-btn__icon" aria-hidden="true"><svg viewBox="0 0 24 24"></svg></span></button>',
  );
  const titled = html(h(IconButton, { icon: svg, "aria-label": "Refresh the list", title: "Refresh (R)", disabled: true }));
  assert.match(titled, /title="Refresh \(R\)"/);
  assert.match(titled, / disabled=""/);
  assert.doesNotMatch(titled, /s1-icon-btn--danger|s1-btn--sm/);
  const menu = html(h(Menu, { variant: "ghost", size: "sm", label: "Actions for Qwen", items: [{ label: "Edit" }] }));
  assert.match(menu, /<button type="button" class="s1-btn s1-btn--ghost s1-btn--sm s1-menu__more" id="[^"]+" aria-label="Actions for Qwen" aria-haspopup="menu" aria-expanded="false"/);
  assert.doesNotMatch(html(h(Menu, { label: "Actions", items: [{ label: "Edit" }] }, "Actions ▾")), /s1-menu__more/, "a menu with words is not a square");
});

const ENTRY = `
window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { IconButton } from ${JSON.stringify(path.join(UI, "icon-button.tsx"))};
import { Menu } from ${JSON.stringify(path.join(UI, "menu.tsx"))};

const trash = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>;
function Set({ id, theme, style }) {
  return (
    <div id={id} data-theme={theme} style={{ background: "var(--s1-paper)", color: "var(--s1-ink)", padding: 8, display: "flex", alignItems: "flex-start", gap: 12, ...style }}>
      <IconButton data-k="default md" icon={trash} aria-label="Edit prod" />
      <IconButton data-k="danger md" tone="danger" icon={trash} aria-label="Delete prod" />
      <IconButton data-k="default sm" size="sm" icon={trash} aria-label="Edit Qwen" />
      <IconButton data-k="danger sm" size="sm" tone="danger" icon={trash} aria-label="Delete Qwen" />
      <span data-k="menu sm"><Menu variant="ghost" size="sm" label="Actions for Qwen" items={[{ label: "Edit" }]} /></span>
      <span data-k="menu md"><Menu variant="ghost" label="Actions for prod" items={[{ label: "Edit" }]} /></span>
    </div>
  );
}
flushSync(() =>
  createRoot(document.getElementById("app")).render(
    <>
      <Set id="light" theme="light" />
      <Set id="dark" theme="dark" />
      <Set id="brand" theme="light" style={{ "--s1-bad": "#b3261e", "--s1-on-status": "#fdfdfb" }} />
    </>,
  ),
);
const hoverize = (rules) => {
  for (let i = rules.length - 1; i >= 0; i--) {
    const r = rules[i];
    if (r instanceof CSSStyleRule) {
      if (r.selectorText.includes(":hover")) (r.parentRule ?? r.parentStyleSheet).insertRule(r.selectorText.replaceAll(":hover", ".s1-hover") + r.cssText.slice(r.selectorText.length), i + 1);
    } else if (r.cssRules) hoverize(r.cssRules);
  }
};
for (const sheet of document.styleSheets) hoverize(sheet.cssRules);
const settle = () => { for (const a of document.getAnimations()) a.finish(); };
const probe = document.createElement("span");
const rgb = (c, scope) => { scope.append(probe); probe.style.color = c; const v = getComputedStyle(probe).color; probe.remove(); return v; };
const token = (name, scope) => { const v = getComputedStyle(scope).getPropertyValue(name).trim(); return v ? rgb(v, scope) : null; };
const look = (b) => { const s = getComputedStyle(b); const svg = b.querySelector("svg").getBoundingClientRect(); const r = b.getBoundingClientRect();
  return { w: r.width, h: r.height, bg: s.backgroundColor, color: s.color, border: [s.borderTopWidth, s.borderTopColor].join(" "), icon: [svg.width, svg.height], title: b.title, label: b.getAttribute("aria-label") }; };
const got = { sets: {}, focus: null };
for (const id of ["light", "dark", "brand"]) {
  const set = document.getElementById(id);
  const tokens = { ink: token("--s1-ink", set), ink2: token("--s1-ink-2", set), paper: token("--s1-paper", set), bad: token("--s1-bad", set), onStatus: token("--s1-on-status", set) };
  const buttons = {};
  for (const el of set.querySelectorAll("[data-k]")) {
    const b = el.matches("button") ? el : el.querySelector("button");
    const rest = look(b);
    for (let e = b; e && e !== document.body; e = e.parentElement) e.classList.add("s1-hover");
    settle();
    const hovered = look(b);
    for (const e of [...document.querySelectorAll(".s1-hover")]) e.classList.remove("s1-hover");
    settle();
    buttons[el.dataset.k] = { rest, hovered };
  }
  got.sets[id] = { tokens, buttons };
}
const b = document.querySelector('#light [data-k="danger sm"]');
b.focus();
const f = getComputedStyle(b);
got.focus = { visible: b.matches(":focus-visible"), style: f.outlineStyle, width: f.outlineWidth, color: f.outlineColor, offset: f.outlineOffset };
document.getElementById("out").textContent = JSON.stringify(got);
`;

const channels = (c: string) => {
  const m = c.match(/^rgba?\(([^)]*)\)$/) ?? c.match(/^color\(srgb ([^)]*)\)$/);
  assert.ok(m, `a colour in sRGB: ${c}`);
  const n = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return c.startsWith("color(") ? n.slice(0, 3).map((x) => x * 255) : n.slice(0, 3);
};
const lum = (c: string) => {
  const v = channels(c);
  const lin = (x: number) => ((x /= 255) <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(v[0]) + 0.7152 * lin(v[1]) + 0.0722 * lin(v[2]);
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const CLEAR = "rgba(0, 0, 0, 0)";

test("in Chrome: squares of 40px and 30px, no line and no paper at rest, the second ink or the bad hue, the ink fill or the bad hue's under the pointer, AA for an icon, the keyboard's ring", async (t) => {
  const bin = chrome();
  if (!bin) return t.skip("no Chrome here: set CHROME to run it");
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
  writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css} body { margin: 0; }</style></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);
  let dom: string;
  try {
    dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--window-size=1200,800", "--virtual-time-budget=5000", "--dump-dom", pathToFileURL(page).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === "ENOENT" || err.code === "EACCES") return t.skip(`Chrome would not start (${bin}): ${err.code}`);
    assert.fail(`Chrome failed on the page (${bin}): ${String(err.stderr ?? e).slice(0, 400)}`);
  }
  const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
  type Look = { w: number; h: number; bg: string; color: string; border: string; icon: [number, number]; title: string; label: string | null };
  const got = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&")) as {
    pageError?: string;
    sets: Record<string, { tokens: Record<string, string | null>; buttons: Record<string, { rest: Look; hovered: Look }> }>;
    focus: { visible: boolean; style: string; width: string; color: string; offset: string };
  };
  assert.equal(got.pageError, undefined, `the page failed: ${got.pageError}`);
  for (const [set, { tokens, buttons }] of Object.entries(got.sets)) {
    const bad = tokens.bad ?? tokens.ink!;
    const onBad = tokens.onStatus ?? tokens.paper!;
    for (const [k, { rest, hovered }] of Object.entries(buttons)) {
      const where = `${set} ${k}`;
      const size = k.endsWith("sm") ? 30 : 40;
      assert.deepEqual([rest.w, rest.h], [size, size], `${where}: a ${size}px square`);
      // a Button's icon is 14px a size down; a Menu's three dots stay 16px at both sizes
      assert.deepEqual(rest.icon, k.endsWith("sm") && !k.startsWith("menu") ? [14, 14] : [16, 16], `${where}: the icon whole`);
      assert.equal(rest.bg, CLEAR, `${where}: no paper at rest`);
      assert.ok(rest.border.startsWith("1px rgba(0, 0, 0, 0)") || rest.border.startsWith("0px"), `${where}: no line to see at rest (${rest.border})`);
      if (!k.startsWith("menu")) assert.equal(rest.title, rest.label, `${where}: its tooltip is its name`);
      if (k.startsWith("danger")) {
        assert.equal(rest.color, bad, `${where}: the icon in the bad hue`);
        assert.ok(contrast(rest.color, tokens.paper!) >= 3, `${where}: the bad hue on the paper, ${contrast(rest.color, tokens.paper!).toFixed(2)}:1`);
        assert.deepEqual([hovered.bg, hovered.color], [bad, onBad], `${where}: under the pointer, filled with the bad hue`);
      } else {
        assert.equal(rest.color, tokens.ink2, `${where}: the icon in the second ink`);
        assert.ok(contrast(rest.color, tokens.paper!) >= 3, `${where}: the second ink on the paper, ${contrast(rest.color, tokens.paper!).toFixed(2)}:1`);
        assert.deepEqual([hovered.bg, hovered.color], [tokens.ink, tokens.paper], `${where}: under the pointer, filled with the ink`);
      }
      assert.ok(contrast(hovered.color, hovered.bg) >= 3, `${where}: the icon on its fill under the pointer, ${contrast(hovered.color, hovered.bg).toFixed(2)}:1`);
    }
  }
  assert.ok(got.focus.visible, "focus from script with no pointer before it is :focus-visible");
  assert.deepEqual([got.focus.style, got.focus.width, got.focus.color], ["solid", "2px", got.sets.light.tokens.ink], "the keyboard's ring");
});
