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
 * The running head, in a real browser with the site's own stylesheets and typefaces (owner, 2026-11-02: "The logo
 * and text is not vertically aligned. remove 设计, just slin, remove 2026 Autumn on that row as well. Change theme
 * switcher to icon + text with 夜 · icon"). The mark's box centred on the capitals of S1LIN (their middle measured
 * from the face's own glyph bounds, not the line box), the name alone on that line, no edition label, and the night
 * toggle: 夜 · and a moon, a toggle (aria-pressed) drawn as the filled switchers are, pressed and on the chosen fill
 * at night, words AA on paper, no line in any state, and a press that turns the page. At 1440px and at 390px.
 * Skipped where there is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-runhead-"));
after(() => rmSync(out, { recursive: true, force: true }));

const src = (f: string) => JSON.stringify(path.join(ROOT, "src", f));
const ENTRY = `
window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
import ${src("index.css")};
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Runhead } from ${src("components/Runhead.tsx")};

try { localStorage.removeItem("s1lin-theme"); } catch {}
document.documentElement.dataset.theme = "light";
const root = createRoot(document.getElementById("app"));
flushSync(() => root.render(<Runhead label="特集 · Architecture — nine lines, one proof" home="/" />));

// Each :hover rule again as a .s1-hover rule, in the same layer and @media, right after it.
const hoverize = (rules) => {
  for (let i = rules.length - 1; i >= 0; i--) {
    const r = rules[i];
    if (r instanceof CSSStyleRule) {
      if (r.selectorText.includes(":hover")) (r.parentRule ?? r.parentStyleSheet).insertRule(r.selectorText.replaceAll(":hover", ".s1-hover") + r.cssText.slice(r.selectorText.length), i + 1);
    } else if (r.cssRules) hoverize(r.cssRules);
  }
};
const settle = () => { for (const a of document.getAnimations()) a.finish(); };
const probe = document.createElement("span");
const rgb = (c) => { document.body.append(probe); probe.style.color = c; const v = getComputedStyle(probe).color; probe.style.color = ""; probe.remove(); return v; };
const token = (name) => rgb(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
const tick = () => new Promise((r) => setTimeout(r, 50));

function capitals(b) {
  // the baseline: an empty inline-block sits on it
  const base = document.createElement("span");
  base.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
  b.append(base);
  const y = base.getBoundingClientRect().bottom;
  base.remove();
  const s = getComputedStyle(b);
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = s.fontStyle + " " + s.fontWeight + " " + s.fontSize + " " + s.fontFamily;
  const m = ctx.measureText(b.textContent);
  return { top: y - m.actualBoundingBoxAscent, bottom: y + m.actualBoundingBoxDescent, family: s.fontFamily, loaded: document.fonts.check(ctx.font, b.textContent) };
}

function state() {
  settle();
  const head = document.querySelector(".runhead");
  const brand = head.querySelector(".runhead__brand");
  const mark = brand.querySelector(".runhead__mark").getBoundingClientRect();
  const caps = capitals(brand.querySelector("b"));
  const t = head.querySelector(".theme-toggle");
  const look = () => {
    const s = getComputedStyle(t);
    return { bg: s.backgroundColor, color: s.color, border: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth].join(" "), outline: s.outlineStyle, shadow: s.boxShadow, opacity: s.opacity };
  };
  const rest = look();
  for (let e = t; e && e !== document.body; e = e.parentElement) e.classList.add("s1-hover");
  settle();
  const hovered = look();
  for (const e of [...document.querySelectorAll(".s1-hover")]) e.classList.remove("s1-hover");
  settle();
  const tr = t.getBoundingClientRect();
  const hr = head.getBoundingClientRect();
  const kanji = t.querySelector('[lang="ja"]');
  const moon = t.querySelector("svg");
  const named = [...t.childNodes].filter((n) => !(n.nodeType === 1 && n.getAttribute("aria-hidden") === "true")).map((n) => n.textContent).join("|");
  return {
    brandText: brand.textContent, brandLang: brand.querySelectorAll("[lang]").length, headText: head.textContent,
    mark: { top: mark.top, bottom: mark.bottom }, caps,
    head: { top: hr.top, bottom: hr.bottom, scroll: head.scrollWidth - head.clientWidth, width: document.documentElement.clientWidth },
    toggle: {
      tag: t.tagName, pressed: t.getAttribute("aria-pressed"), label: t.getAttribute("aria-label"), named, rest, hovered,
      top: tr.top, bottom: tr.bottom, right: tr.right, h: tr.height,
      kanji: kanji && { text: kanji.textContent, lang: kanji.getAttribute("lang"), family: getComputedStyle(kanji).fontFamily, top: kanji.getBoundingClientRect().top, bottom: kanji.getBoundingClientRect().bottom },
      moon: moon && { cls: moon.getAttribute("class"), hidden: moon.closest("[aria-hidden]") !== null, top: moon.getBoundingClientRect().top, bottom: moon.getBoundingClientRect().bottom },
      dot: [...t.querySelectorAll('[aria-hidden="true"]')].map((n) => n.textContent).filter(Boolean),
    },
    tokens: { ink: token("--s1-ink"), ink2: token("--s1-ink-2"), paper: token("--s1-paper"), paper2: token("--s1-paper-2") },
    theme: document.documentElement.dataset.theme, stored: (() => { try { return localStorage.getItem("s1lin-theme"); } catch { return "n/a"; } })(),
  };
}

(async () => {
  await document.fonts.ready;
  for (const sheet of document.styleSheets) hoverize(sheet.cssRules);
  await tick();
  const paper = state();
  document.querySelector(".theme-toggle").click();
  await tick();
  await document.fonts.ready;
  const night = state();
  document.querySelector(".theme-toggle").click();
  await tick();
  const back = { pressed: document.querySelector(".theme-toggle").getAttribute("aria-pressed"), theme: document.documentElement.dataset.theme };
  // the page in another language (Life, with no [data-run] sections): the head says the new words at once
  flushSync(() => root.render(<Runhead label="生命 · The Game of Life" home="/" />));
  await tick();
  const relabelled = document.querySelector(".runhead__now").textContent;
  document.getElementById("out").textContent = JSON.stringify({ paper, night, back, relabelled });
})().catch((e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e?.stack ?? e) }); });
`;

const channels = (c: string) => {
  const m = c.match(/^rgba?\(([^)]*)\)$/) ?? c.match(/^color\(srgb ([^)]*)\)$/);
  assert.ok(m, `a colour in sRGB: ${c}`);
  const n = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  assert.ok(n.length === 3 || n[3] === 1, `an opaque colour: ${c}`);
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

type Look = { bg: string; color: string; border: string; outline: string; shadow: string; opacity: string };
type State = {
  brandText: string; brandLang: number; headText: string;
  mark: { top: number; bottom: number }; caps: { top: number; bottom: number; family: string; loaded: boolean };
  head: { top: number; bottom: number; scroll: number; width: number };
  toggle: {
    tag: string; pressed: string | null; label: string | null; named: string; rest: Look; hovered: Look; top: number; bottom: number; right: number; h: number;
    kanji: { text: string; lang: string; family: string; top: number; bottom: number } | null;
    moon: { cls: string; hidden: boolean; top: number; bottom: number } | null; dot: string[];
  };
  tokens: { ink: string; ink2: string; paper: string; paper2: string };
  theme: string; stored: string | null;
};
type Got = { paper: State; night: State; back: { pressed: string; theme: string }; relabelled: string };

const shared: Record<number, Got> = {};
async function run(t: { skip: (m: string) => void }, width: number): Promise<Got | undefined> {
  if (shared[width]) return shared[width];
  const bin = chrome();
  if (!bin) return void t.skip("no Chrome here: set CHROME to run it");
  const dist = path.join(out, "dist");
  if (!existsSync(dist)) {
    if (!existsSync(path.join(out, "node_modules"))) symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");
    writeFileSync(path.join(out, "entry.jsx"), ENTRY);
    await build({
      configFile: false,
      root: out,
      // the typefaces by their file URL beside the stylesheet, so they load as the site's own do
      base: pathToFileURL(dist + "/").href,
      logLevel: "silent",
      plugins: [react()],
      resolve: { alias: { "@": path.join(ROOT, "src") } },
      define: { "process.env.NODE_ENV": '"production"' },
      build: { outDir: dist, emptyOutDir: true, minify: false, lib: { entry: path.join(out, "entry.jsx"), formats: ["iife"], name: "Harness", fileName: () => "harness.js", cssFileName: "harness" } },
    });
    const js = readFileSync(path.join(dist, "harness.js"), "utf8");
    // the stylesheet stays a file beside the page, so its typefaces load from beside it
    writeFileSync(path.join(dist, "page.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="harness.css"></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);
  }
  let dom: string;
  try {
    dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=${width},900`, "--virtual-time-budget=15000", "--dump-dom", pathToFileURL(path.join(dist, "page.html")).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === "ENOENT" || err.code === "EACCES") return void t.skip(`Chrome would not start (${bin}): ${err.code}`);
    assert.fail(`Chrome failed on the page (${bin}): ${String(err.stderr ?? e).slice(0, 400)}`);
  }
  const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
  assert.ok(text, "the page printed nothing");
  const parsed = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  assert.equal(parsed.pageError, undefined, `the page failed: ${parsed.pageError}`);
  return (shared[width] = parsed as Got);
}

const NONE = ["0px 0px 0px 0px", "none", "none"];
const lines = (l: Look) => [l.border, l.outline, l.shadow];

for (const width of [1440, 390]) {
  test(`${width}px: the mark centred on the capitals of S1LIN, the name alone on its line, no edition label`, async (t) => {
    const got = await run(t, width);
    if (!got) return;
    for (const [when, s] of Object.entries({ paper: got.paper, night: got.night })) {
      assert.ok(s.caps.loaded, `${when}: the name is set in its own face (${s.caps.family}), loaded`);
      assert.equal(s.brandText, "S1LIN", `${when}: the brand is the name alone`);
      assert.equal(s.brandLang, 0, `${when}: no word in another language beside it (設計 is gone)`);
      assert.doesNotMatch(s.headText, /Autumn|Vol\.|設計|设计/, `${when}: no edition or season on the head`);
      const markMid = (s.mark.top + s.mark.bottom) / 2;
      const capMid = (s.caps.top + s.caps.bottom) / 2;
      assert.ok(Math.abs(markMid - capMid) <= 0.5, `${when}: the mark's middle ${markMid.toFixed(2)} and the capitals' ${capMid.toFixed(2)} are ${Math.abs(markMid - capMid).toFixed(2)}px apart`);
      const headMid = (s.head.top + s.head.bottom) / 2;
      assert.ok(Math.abs(markMid - headMid) <= 1, `${when}: the brand sits in the middle of the head (${markMid.toFixed(2)} against ${headMid.toFixed(2)})`);
      assert.equal(s.head.scroll, 0, `${when}: nothing in the head scrolls sideways`);
      assert.ok(s.toggle.right <= s.head.width, `${when}: the toggle is on the page (${s.toggle.right} of ${s.head.width})`);
    }
  });

  test(`${width}px: night is a toggle, 夜 · and a moon, pressed and filled at night, words AA on paper, no line in any state, and it turns the page`, async (t) => {
    const got = await run(t, width);
    if (!got) return;
    const { paper, night, back } = got;
    for (const [when, s] of Object.entries({ paper, night })) {
      const tg = s.toggle;
      assert.equal(tg.tag, "BUTTON", `${when}: a button`);
      assert.deepEqual([tg.kanji?.text, tg.kanji?.lang], ["夜", "ja"], `${when}: 夜, in Japanese`);
      assert.match(tg.kanji!.family, /Shippori Mincho/, `${when}: 夜 in the mincho`);
      assert.deepEqual(tg.dot, ["·"], `${when}: the middle dot between, hidden from a screen reader`);
      assert.ok(tg.moon && /lucide-moon/.test(tg.moon.cls) && tg.moon.hidden, `${when}: the moon after them, hidden from a screen reader`);
      assert.equal(tg.label, null, `${when}: named by its words, not an aria-label that hides them`);
      assert.equal(tg.named, "夜|Night", `${when}: its name, 夜 and Night`);
      assert.ok(Math.abs(tg.h - 30) < 0.5, `${when}: the kit's small height, ${tg.h}px`);
      const mid = (tg.top + tg.bottom) / 2;
      assert.ok(Math.abs(mid - (s.head.top + s.head.bottom) / 2) <= 1, `${when}: centred in the head`);
      assert.ok(Math.abs((tg.kanji!.top + tg.kanji!.bottom) / 2 - (tg.moon!.top + tg.moon!.bottom) / 2) <= 1, `${when}: 夜 and the moon on one line`);
      for (const l of [tg.rest, tg.hovered]) assert.deepEqual(lines(l), NONE, `${when}: no border, outline or ring`);
      for (const l of [tg.rest, tg.hovered]) assert.equal(l.opacity, "1", `${when}: not faded`);
    }
    assert.deepEqual([paper.toggle.pressed, paper.theme], ["false", "light"], "on paper: not pressed");
    assert.equal(paper.toggle.rest.bg, CLEAR, "on paper: no fill");
    assert.ok(contrast(paper.toggle.rest.color, paper.tokens.paper) >= 4.5, `on paper: its words AA, ${contrast(paper.toggle.rest.color, paper.tokens.paper).toFixed(2)}:1`);
    assert.deepEqual([paper.toggle.hovered.bg, paper.toggle.hovered.color], [paper.tokens.paper2, paper.tokens.ink], "on paper, under the pointer: the switchers' tint, the words in the ink");
    assert.deepEqual([night.toggle.pressed, night.theme, night.stored], ["true", "dark", "dark"], "a press turns the page to night, remembered, and the toggle is pressed");
    for (const l of [night.toggle.rest, night.toggle.hovered]) {
      assert.deepEqual([l.bg, l.color], [night.tokens.ink, night.tokens.paper], "at night: on the chosen fill (the ink), its words in the paper, under the pointer too");
      assert.ok(contrast(l.color, l.bg) >= 4.5, `at night: its words AA on the fill, ${contrast(l.color, l.bg).toFixed(2)}:1`);
    }
    assert.deepEqual(back, { pressed: "false", theme: "light" }, "a second press brings the paper back");
  });

  test(`${width}px: a new label from the page (another language) is shown at once`, async (t) => {
    const got = await run(t, width);
    if (!got) return;
    assert.match(got.relabelled, /生命/);
    assert.match(got.relabelled, /The Game of Life/);
    assert.doesNotMatch(got.relabelled, /Architecture/);
  });
}
