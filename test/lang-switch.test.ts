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
 * LangSwitch in a real browser, with React running: no line, box, fill or shadow on the group or on any language;
 * the dot under the one in force alone, in --s1-here (light by day, the night's at night); the others in the dimmer
 * ink, AA on the paper, and lighter in weight; the heights of the three sizes; 中文 in the Chinese sans at 12px,
 * never tracked; the roles, names and states; a press moving the dot; the dot growing in where motion is welcome and
 * simply there where it is not. Vite bundles a small page from src/ui/ as an app would; headless Chrome runs it, its
 * script presses and prints what it found. Skipped where there is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-lang-"));
after(() => rmSync(out, { recursive: true, force: true }));

const ENTRY = `
import { useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { LangSwitch } from ${JSON.stringify(path.join(ROOT, "src/ui/lang-switch.tsx"))};

const LANGS = [{ value: "en", label: "EN", name: "English", lang: "en" }, { value: "zh", label: "中文", lang: "zh-CN" }];
const chosen = [];
function Stateful({ id, size }) {
  const [lang, setLang] = useState("en");
  return <LangSwitch id={id} label="Language" options={LANGS} value={lang} size={size} onValueChange={(v) => { chosen.push(v); setLang(v); }} />;
}
const root = createRoot(document.getElementById("app"));
flushSync(() =>
  root.render(
    <>
      <div id="paper"><Stateful id="sm" /></div>
      <div id="sizes"><Stateful id="md" size="md" /><Stateful id="xs" size="xs" /></div>
      <div id="links"><LangSwitch id="ln" label="语言" options={LANGS.map((l) => ({ ...l, href: "#" + l.value }))} value="zh" /></div>
      <div id="night" data-theme="dark" style={{ background: "var(--s1-paper)", color: "var(--s1-ink)" }}><Stateful id="nt" /></div>
    </>,
  ),
);

const got = {};
const $ = (s) => document.querySelector(s);
const css = (el, pseudo) => getComputedStyle(el, pseudo ?? null);
const probe = document.createElement("span");
document.body.append(probe);
const rgb = (c, scope = document.documentElement) => { scope.append(probe); probe.style.color = c; const v = getComputedStyle(probe).color; probe.style.color = ""; return v; };
const token = (name, scope = document.documentElement) => rgb(getComputedStyle(scope).getPropertyValue(name).trim(), scope);
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
// rgb(…) in 0–255, or color(srgb …) in 0–1 (what a color-mix() computes to)
const channels = (c) => { const n = c.match(/[\\d.]+/g).map(Number).slice(0, 3); return c.startsWith("color(") ? n.map((v) => v * 255) : n; };
const lum = (c) => { const [r, g, b] = channels(c); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const lines = (el) => { const s = css(el); return [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth, s.outlineStyle, s.boxShadow, s.backgroundColor, s.backgroundImage]; };
const item = (sw) => {
  const s = css(sw);
  const dot = css(sw.querySelector(".s1-lang__label"), "::after");
  const r = sw.getBoundingClientRect();
  return { tag: sw.tagName, lang: sw.getAttribute("lang"), hreflang: sw.getAttribute("hreflang"), label: sw.getAttribute("aria-label"), pressed: sw.getAttribute("aria-pressed"), current: sw.getAttribute("aria-current"), text: sw.textContent, color: s.color, weight: s.fontWeight, size: s.fontSize, spacing: s.letterSpacing, transform: s.textTransform, family: s.fontFamily, w: Math.round(r.width), h: Math.round(r.height), lines: lines(sw), dot: { opacity: dot.opacity, bg: dot.backgroundColor, w: dot.width, transition: dot.transitionDuration } };
};
const group = (id) => { const g = document.getElementById(id); return { role: g.getAttribute("role"), label: g.getAttribute("aria-label"), lines: lines(g), items: [...g.children].map(item) }; };
const steps = [];
const step = (f) => steps.push(f);

step(() => {
  got.ink = token("--s1-ink");
  got.paper = token("--s1-paper");
  got.here = token("--s1-here");
  got.nightHere = token("--s1-here", $("#night"));
  got.nightPaper = token("--s1-paper", $("#night"));
  got.dim = rgb(getComputedStyle($("#sm")).getPropertyValue("--s1-lang-dim").trim());
  got.before = { sm: group("sm"), md: group("md"), xs: group("xs"), ln: group("ln"), nt: group("nt") };
  got.contrast = { day: contrast(got.before.sm.items[1].color, got.paper), night: contrast(got.before.nt.items[1].color, got.nightPaper) };
  const zh = $("#sm [lang='zh-CN']");
  zh.focus();
  got.focus = { visible: zh.matches(":focus-visible"), outline: [css(zh).outlineStyle, css(zh).outlineWidth, css(zh).outlineColor] };
  zh.click();
});
step(() => {
  // headless Chrome's virtual clock does not run transitions on: take each to its end, then read
  got.running = document.getAnimations().length;
  for (const a of document.getAnimations()) a.finish();
  got.after = group("sm");
  $("#sm [lang='zh-CN']").click();
});
step(() => {
  got.chosen = [...chosen];
});

let i = 0;
const next = () => {
  if (i < steps.length) { steps[i++](); setTimeout(next, 250); }
  else document.getElementById("out").textContent = JSON.stringify(got);
};
setTimeout(next, 120);
`;

test("LangSwitch in a browser: no line round the group or a language, the dot under the one in force alone, the others dimmer (AA), the sizes, Chinese, aria, a press, reduced motion", async (t) => {
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
  writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css} body { margin: 0; background: var(--s1-paper); color: var(--s1-ink); }</style></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);

  const run = (flags: string[]) => {
    let dom: string;
    try {
      dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,900", "--virtual-time-budget=10000", ...flags, "--dump-dom", pathToFileURL(page).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
    } catch (e) {
      return t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
    }
    const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
    assert.ok(text, "the page printed nothing");
    return JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  };

  const got = run([]);
  if (!got) return;
  const none = ["0px", "0px", "0px", "0px", "none", "none", "rgba(0, 0, 0, 0)", "none"];
  for (const [name, g] of Object.entries(got.before) as [string, { lines: string[]; items: { lines: string[] }[] }][]) {
    assert.deepEqual(g.lines, none, `${name}: the group has no line, box, fill or shadow`);
    for (const it of g.items) assert.deepEqual(it.lines, none, `${name}: a language has no line, box, fill or shadow`);
  }

  // buttons: a named group, each language its own lang, the one in force pressed; EN named in full
  const [en, zh] = got.before.sm.items;
  assert.deepEqual([got.before.sm.role, got.before.sm.label], ["group", "Language"]);
  assert.deepEqual([en.tag, en.lang, en.label, en.pressed, en.text], ["BUTTON", "en", "English", "true", "EN"]);
  assert.deepEqual([zh.tag, zh.lang, zh.label, zh.pressed, zh.text], ["BUTTON", "zh-CN", null, "false", "中文"]);
  // links: aria-current="page" on the one in force, hreflang on each, no aria-pressed
  const [lnEn, lnZh] = got.before.ln.items;
  assert.deepEqual([lnEn.tag, lnEn.hreflang, lnEn.current, lnEn.pressed], ["A", "en", null, null]);
  assert.deepEqual([lnZh.tag, lnZh.hreflang, lnZh.current, lnZh.pressed], ["A", "zh-CN", "page", null]);

  // the dot: under the one in force alone, 4px, in --s1-here, a light blue by day and the night's blue at night
  assert.equal(got.here, "rgb(55, 128, 230)");
  assert.equal(got.nightHere, "rgb(127, 178, 255)");
  assert.deepEqual([en.dot.opacity, en.dot.bg, en.dot.w], ["1", got.here, "4px"]);
  assert.equal(zh.dot.opacity, "0", "no dot under a language not in force");
  assert.deepEqual([lnZh.dot.opacity, lnEn.dot.opacity], ["1", "0"]);
  assert.deepEqual([got.before.nt.items[0].dot.opacity, got.before.nt.items[0].dot.bg], ["1", got.nightHere]);

  // the inks: the one in force in the ink and heavier; the others dimmer, and still AA on the paper
  assert.equal(en.color, got.ink);
  assert.equal(zh.color, got.dim);
  assert.notEqual(got.dim, got.ink);
  assert.ok(Number(en.weight) > Number(zh.weight), `the one in force is heavier (${en.weight} over ${zh.weight})`);
  assert.ok(got.contrast.day >= 4.5, `the dim ink on paper: ${got.contrast.day.toFixed(2)}:1`);
  assert.ok(got.contrast.night >= 4.5, `the dim ink at night: ${got.contrast.night.toFixed(2)}:1`);

  // one height at each size, every target 24px square at least
  for (const [name, h] of [["sm", 30], ["md", 40], ["xs", 24]] as const) {
    for (const it of got.before[name].items) {
      assert.equal(it.h, h, `${name}: ${it.text} is ${it.h}px tall`);
      assert.ok(it.w >= 24, `${name}: ${it.text} is ${it.w}px wide`);
    }
  }
  assert.equal(got.before.xs.items[0].dot.w, "3px");

  // Latin in mono capitals; Chinese in the Chinese sans at 12px, not tracked, not in capitals
  assert.equal(en.transform, "uppercase");
  assert.notEqual(en.spacing, "normal");
  assert.match(zh.family, /^"?PingFang SC"?, .*Microsoft YaHei/);
  assert.deepEqual([zh.size, zh.transform], ["12px", "none"]);
  assert.ok(["normal", "0px"].includes(zh.spacing), `中文 is not tracked (${zh.spacing})`);

  // focus: a 2px ring in the ink
  if (got.focus.visible) assert.deepEqual(got.focus.outline, ["solid", "2px", got.ink]);

  // a press moves the dot and the ink; pressing the one in force says nothing
  const [enAfter, zhAfter] = got.after.items;
  assert.deepEqual([enAfter.pressed, zhAfter.pressed], ["false", "true"]);
  assert.deepEqual([enAfter.dot.opacity, zhAfter.dot.opacity], ["0", "1"]);
  assert.deepEqual([enAfter.color, zhAfter.color], [got.dim, got.ink]);
  assert.deepEqual(got.chosen, ["zh"]);

  // where motion is welcome the dot grows in; under reduced motion it is simply there
  assert.equal(en.dot.transition, "0.16s, 0.16s");
  assert.ok(got.running > 0, "the press started the dot's and the ink's transitions");
  const still = run(["--force-prefers-reduced-motion"]);
  if (!still) return;
  assert.equal(still.before.sm.items[0].dot.transition, "0s");
  assert.equal(still.running, 0, "under reduced motion nothing moves");
  assert.deepEqual([still.after.items[1].dot.opacity, still.after.items[0].dot.opacity], ["1", "0"]);
});
