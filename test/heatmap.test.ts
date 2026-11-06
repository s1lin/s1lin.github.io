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
 * The GitHub heatmap under the contents, stood on end (owner, 2026-11-06: "we should make the heatmap vertical, not
 * horizontal"): a week to a row, Sunday to Saturday across, the weeks downwards, and the year set in two columns, the
 * first half down the left and the second down the right. Its grid on its own (every day once, in its weekday's
 * column, the next week under it, the pointer's day under every point of a square and none between the columns), the
 * month names (where a month begins, never two in rows next to each other), and on a server the figure a screen
 * reader is given (an image named by its title and described by the year in two sentences) with a tooltip on every
 * square. In a real browser, with the site's stylesheets, at 1440px and in a 390px frame, on paper and at night:
 * taller than wide, no wider than 22rem and inside a phone's page with nothing to scroll sideways, squares of at least
 * 14px, GitHub's greens for each theme, and the line under it reading out the day under the pointer, with the outline
 * round that day's square. Skipped where there is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-heatmap-"));
after(() => rmSync(out, { recursive: true, force: true }));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");

// ------------------------------------------------------------------ the grid and the figure, on a server

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mod = { cal: any; GitHubHeatmap: () => unknown };
let mod: Mod | undefined;
async function server(): Promise<Mod> {
  if (mod) return mod;
  writeFileSync(
    path.join(out, "server.ts"),
    `export * as cal from ${JSON.stringify(path.join(ROOT, "src/lib/calendar.ts"))};\nexport { GitHubHeatmap } from ${JSON.stringify(path.join(ROOT, "src/components/GitHubHeatmap.tsx"))};`,
  );
  await build({
    configFile: false,
    root: out,
    logLevel: "silent",
    plugins: [{ name: "no-css", enforce: "pre", load: (id) => (id.endsWith(".css") ? "" : null) }, react()],
    resolve: { alias: { "@": path.join(ROOT, "src") } },
    build: { ssr: path.join(out, "server.ts"), outDir: path.join(out, "ssr"), emptyOutDir: true, rollupOptions: { output: { format: "es", entryFileNames: "heatmap.mjs" } } },
  });
  return (mod = (await import(pathToFileURL(path.join(out, "ssr/heatmap.mjs")).href)) as Mod);
}

test("the grid: every day once, in its weekday's column, the next week under it, the year in two columns down the page", async () => {
  const { cal } = await server();
  const { DAYS, WEEKS, ROWS, OFFSET, CELL, STEP, LEFT, TOP, SHIFT, W, H, squareAt, weekOf, dayOf } = cal;
  assert.equal(WEEKS, Math.ceil((OFFSET + DAYS) / 7));
  assert.ok(WEEKS >= 52 && WEEKS <= 54, `a year of weeks: ${WEEKS}`);
  assert.equal(ROWS, Math.ceil(WEEKS / 2), "two columns, the first with the odd week");
  assert.ok(H > W, `taller than wide: ${W} × ${H}`);
  const seen = new Set<string>();
  for (let i = 0; i < DAYS; i++) {
    const { x, y } = squareAt(i);
    const key = `${x},${y}`;
    assert.ok(!seen.has(key), `day ${i} has a square of its own`);
    seen.add(key);
    assert.ok(x >= 0 && y >= TOP && x + CELL <= W && y + CELL <= H, `day ${i} is inside the drawing`);
    const col = weekOf(i) < ROWS ? 0 : 1;
    assert.equal(x, col * SHIFT + LEFT + dayOf(i).getUTCDay() * STEP, `day ${i} stands in its weekday's column`);
    if (i + 7 < DAYS && weekOf(i + 7) !== ROWS) {
      assert.deepEqual(squareAt(i + 7), { x, y: y + STEP }, `the week after day ${i} is the row under it`);
    }
    if (i + 1 < DAYS && dayOf(i).getUTCDay() < 6) assert.deepEqual(squareAt(i + 1), { x: x + STEP, y }, `the day after ${i} is beside it`);
  }
  assert.deepEqual(squareAt(0).y, TOP, "the year starts at the top of the first column");
  assert.ok(squareAt(0).x < SHIFT && squareAt(DAYS - 1).x >= SHIFT, "and ends in the second");
  assert.equal(squareAt(DAYS - 1).y, TOP + (WEEKS - 1 - ROWS) * STEP, "on its last row");
  assert.deepEqual(squareAt(ROWS * 7 - OFFSET), { x: SHIFT + LEFT, y: TOP }, "the second column's first Sunday at its top");
});

test("the pointer: every point of a square, and the gap after it, is that day; between the columns and over the names, none", async () => {
  const { cal } = await server();
  const { DAYS, CELL, STEP, LEFT, TOP, SHIFT, BLOCK, H, squareAt, dayAt } = cal;
  for (let i = 0; i < DAYS; i++) {
    const { x, y } = squareAt(i);
    for (const [dx, dy] of [[0, 0], [CELL / 2, CELL / 2], [CELL - 0.01, CELL - 0.01], [STEP - 0.01, STEP - 0.01]]) {
      assert.equal(dayAt(x + dx, y + dy), i, `(${dx}, ${dy}) into day ${i}'s square`);
    }
  }
  for (const [x, y, what] of [
    [LEFT / 2, H / 2, "the first column's month names"],
    [BLOCK + 1, H / 2, "the gap between the columns"],
    [SHIFT + LEFT / 2, H / 2, "the second column's month names"],
    [LEFT + 2, TOP / 2, "the weekday letters"],
    [-1, H / 2, "left of the drawing"],
    [LEFT + 2, H + 1, "under it"],
  ] as const) {
    assert.equal(dayAt(x, y), null, what);
  }
});

test("the month names: one where each month begins, at its row's left; one at a column's head when its month began above; never two in rows next to each other", async () => {
  const { cal } = await server();
  const { WEEKS, ROWS, monthRows, monthOf } = cal;
  const names: { week: number; month: number }[] = monthRows();
  const at = new Map(names.map((n) => [n.week, n.month]));
  for (let week = 1; week < WEEKS; week++) {
    if (monthOf(week) !== monthOf(week - 1)) assert.equal(at.get(week), monthOf(week), `a month begins in week ${week}: named there`);
  }
  for (const n of names) {
    const head = n.week === 0 || n.week === ROWS;
    assert.ok(head || monthOf(n.week) !== monthOf(n.week - 1), `week ${n.week} is named only where its month begins or at a column's head`);
    assert.equal(n.month, monthOf(n.week));
  }
  for (let i = 1; i < names.length; i++) {
    const [a, b] = [names[i - 1].week, names[i].week];
    if ((a < ROWS) === (b < ROWS)) assert.ok(b - a >= 2, `names in weeks ${a} and ${b} are a row apart at least`);
  }
});

test("on a server: an image named by its title and described by the year, a tooltip on every square, the weekdays over both columns, the legend", async () => {
  const { cal, GitHubHeatmap } = await server();
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const html: string = renderToStaticMarkup(createElement(GitHubHeatmap as () => null));
  const svg = html.match(/<svg[^>]*>/)?.[0] ?? "";
  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-labelledby="hm-t"/);
  assert.match(svg, /aria-describedby="hm-d"/);
  assert.match(svg, new RegExp(`viewBox="0 0 ${cal.W} ${cal.H}"`));
  assert.match(html, /<title id="hm-t">Contributions on GitHub by s1lin, a square a day, the year to \d+ \w+ \d{4}<\/title>/);
  const desc = html.match(/<desc id="hm-d">([^<]*)<\/desc>/)?.[1] ?? "";
  assert.match(desc, /^[\d,]+ contributions? from \d+ \w+ \d{4} to \d+ \w+ \d{4}, on \d+ of \d+ days\. The busiest day was \d+ \w+ \d{4}, with \d+; the longest run of days in a row, \d+\.$/, desc);
  const squares = [...html.matchAll(/<rect class="l([0-4])"[^>]*><title>([^<]*)<\/title><\/rect>/g)];
  assert.equal(squares.length, cal.DAYS, "a square a day");
  for (const [, , tip] of squares) assert.match(tip, /^(No contributions|1 contribution|[\d,]+ contributions) on (Sun|Mon|Tues|Wednes|Thurs|Fri|Satur)day, \d+ \w+ \d{4}$/, tip);
  const letters = [...html.matchAll(/<text[^>]*text-anchor="middle"[^>]*>([A-Z])<\/text>/g)].map((m) => m[1]).join("");
  assert.equal(letters, "SMTWTFSSMTWTFS", "the weekdays' letters over each column");
  const months = [...html.matchAll(/<text[^>]*text-anchor="end"[^>]*>([A-Z]{3})<\/text>/g)].map((m) => m[1]);
  assert.equal(months.length, cal.monthRows().length, "a month name for every one monthRows gives");
  assert.match(html, /<p class="heatmap__key" aria-hidden="true">Less<i class="l0"><\/i><i class="l1"><\/i><i class="l2"><\/i><i class="l3"><\/i><i class="l4"><\/i>More<\/p>/);
  assert.match(html, /[\d,]+ contributions in the last year/);
  assert.match(html, /a week to a\s+row, down one column and then the other/);
});

// ------------------------------------------------------------------ in a browser

const ENTRY = `
const report = (o) => { document.getElementById("out").textContent = JSON.stringify(o); if (parent !== window) parent.postMessage(JSON.stringify(o), "*"); };
window.addEventListener("error", (e) => report({ pageError: String(e.error?.stack ?? e.message) }));
import ${JSON.stringify(path.join(ROOT, "src/index.css"))};
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { GitHubHeatmap } from ${JSON.stringify(path.join(ROOT, "src/components/GitHubHeatmap.tsx"))};

try { localStorage.removeItem("s1lin-theme"); } catch {}
document.documentElement.dataset.theme = "light";
// as on the page: under the contents, the grass in the charts row beside the tokens
flushSync(() => createRoot(document.getElementById("root")).render(
  <section className="spread"><div className="wrap grid frontmatter"><div className="charts"><GitHubHeatmap /><div className="tokens" style={{ height: 1600 }} /></div></div></section>,
));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const box = (e) => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };

function look() {
  const fig = document.querySelector(".heatmap");
  const svg = fig.querySelector("svg");
  const plot = fig.querySelector(".heatmap__plot");
  const rects = [...svg.querySelectorAll("rect[class^=l]")];
  const fills = {};
  for (const l of [0, 1, 2, 3, 4]) {
    const i = document.createElement("i");
    i.className = "l" + l;
    fig.querySelector(".heatmap__key").append(i);
    fills[l] = getComputedStyle(i).backgroundColor;
    i.remove();
  }
  const text = svg.querySelector("text");
  const scale = box(svg).width / svg.viewBox.baseVal.width;
  return {
    theme: document.documentElement.dataset.theme,
    page: { width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth },
    fig: box(fig), svg: box(svg), plotScroll: plot.scrollWidth - plot.clientWidth,
    cell: box(rects[0]).width, text: parseFloat(getComputedStyle(text).fontSize) * scale,
    fills, rectFill: getComputedStyle(rects.find((r) => r.classList.contains("l0"))).fill,
    rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
  };
}

async function point(i) {
  const svg = document.querySelector(".heatmap svg");
  const r = svg.querySelectorAll("rect[class^=l]")[i].getBoundingClientRect();
  const at = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerType: "mouse", bubbles: true };
  svg.dispatchEvent(new PointerEvent("pointerover", at));
  svg.dispatchEvent(new PointerEvent("pointermove", at));
  await wait(50);
  const outline = svg.querySelector(".heatmap__at");
  return { line: document.querySelector(".heatmap__foot p").textContent, square: box(svg.querySelectorAll("rect[class^=l]")[i]), outline: outline && box(outline) };
}

(async () => {
  await document.fonts.ready;
  await wait(200);
  const paper = look();
  const n = document.querySelectorAll(".heatmap svg rect[class^=l]").length;
  const first = await point(0);
  const last = await point(n - 1);
  const mid = await point(Math.floor(n / 2));
  document.documentElement.dataset.theme = "dark";
  await wait(100);
  const night = look();
  report({ paper, night, first, last, mid, n });
})().catch((e) => report({ pageError: String(e?.stack ?? e) }));
`;

type Box = { left: number; right: number; top: number; bottom: number; width: number; height: number };
type Look = { theme: string; page: { width: number; scroll: number }; fig: Box; svg: Box; plotScroll: number; cell: number; text: number; fills: Record<number, string>; rectFill: string; rem: number };
type Point = { line: string; square: Box; outline: Box | null };
type Got = { paper: Look; night: Look; first: Point; last: Point; mid: Point; n: number };

const runs: Record<string, Got> = {};
async function run(t: { skip: (m: string) => void }, width: number): Promise<Got | undefined> {
  if (runs[width]) return runs[width];
  const bin = chrome();
  if (!bin) return void t.skip("no Chrome here: set CHROME to run it");
  const dist = path.join(out, "dist");
  if (!existsSync(path.join(dist, "page.html"))) {
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
    // a phone's width: headless Chrome keeps a window at least 500px wide, so the page runs in a frame of that width
    writeFileSync(
      path.join(dist, "frame.html"),
      `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"><iframe id="f" style="display:block;border:0" width="390" height="844" src="page.html"></iframe><pre id="out" hidden></pre><script>addEventListener("message", (e) => { document.getElementById("out").textContent = e.data; });</script></body></html>`,
    );
    writeFileSync(
      path.join(dist, "page.html"),
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="harness.css"></head><body><div id="root"></div><pre id="out" hidden></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`,
    );
  }
  const framed = width < 500;
  let dom: string;
  try {
    dom = execFileSync(
      bin,
      ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=${framed ? 600 : width},900`, "--virtual-time-budget=15000", "--dump-dom", pathToFileURL(path.join(dist, framed ? "frame.html" : "page.html")).href],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 90_000, maxBuffer: 64 * 1024 * 1024 },
    );
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === "ENOENT" || err.code === "EACCES") return void t.skip(`Chrome would not start (${bin}): ${err.code}`);
    assert.fail(`Chrome failed on the page (${bin}): ${String(err.stderr ?? e).slice(0, 400)}`);
  }
  const text = dom.match(/<pre id="out" hidden="">([\s\S]*?)<\/pre>/)?.[1] ?? "";
  assert.ok(text, `${width}px: the page printed nothing`);
  const parsed = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  assert.equal(parsed.pageError, undefined, `${width}px: the page failed: ${parsed.pageError}`);
  return (runs[width] = parsed as Got);
}

// GitHub's greens, its light scale on paper and its dark one at night
const GREENS = {
  light: ["rgb(235, 237, 240)", "rgb(155, 233, 168)", "rgb(64, 196, 99)", "rgb(48, 161, 78)", "rgb(33, 110, 57)"],
  dark: ["rgb(22, 27, 34)", "rgb(14, 68, 41)", "rgb(0, 109, 50)", "rgb(38, 166, 65)", "rgb(57, 211, 83)"],
};

for (const width of [1440, 390]) {
  test(`${width}px: taller than wide, no wider than 22rem, on the page with nothing to scroll sideways, squares of 14px and more, GitHub's greens by day and at night`, async (t) => {
    const got = await run(t, width);
    if (!got) return;
    for (const s of [got.paper, got.night]) {
      assert.equal(s.page.width, width, "the page's width");
      assert.ok(s.svg.height > s.svg.width * 1.3, `${s.theme}: stood on end, ${s.svg.width.toFixed(0)} × ${s.svg.height.toFixed(0)}`);
      assert.ok(s.fig.width <= 22 * s.rem + 0.5, `${s.theme}: the figure no wider than 22rem (${s.fig.width}px)`);
      assert.ok(s.svg.left >= 0 && s.svg.right <= width, `${s.theme}: the year inside the page (${s.svg.left}–${s.svg.right})`);
      assert.equal(s.plotScroll, 0, `${s.theme}: the year does not scroll in a box`);
      assert.equal(s.page.scroll, 0, `${s.theme}: nothing scrolls sideways`);
      assert.ok(s.cell >= 14, `${s.theme}: a day's square is ${s.cell.toFixed(1)}px`);
      assert.ok(s.text >= 9, `${s.theme}: the names are ${s.text.toFixed(1)}px`);
      if (width === 390) assert.ok(s.svg.width >= 330, `on a phone it takes the page's width (${s.svg.width}px)`);
    }
    assert.equal(got.paper.theme, "light");
    assert.deepEqual(Object.values(got.paper.fills), GREENS.light, "on paper, GitHub's light scale");
    assert.equal(got.paper.rectFill, GREENS.light[0], "a bare day's square in it");
    assert.equal(got.night.theme, "dark");
    assert.deepEqual(Object.values(got.night.fills), GREENS.dark, "at night, its dark scale");
    assert.equal(got.night.rectFill, GREENS.dark[0], "a bare day's square in it");
  });

  test(`${width}px: the line under it reads out the day under the pointer, with the outline round its square; the first day at the top left, the last at the foot of the second column`, async (t) => {
    const got = await run(t, width);
    if (!got) return;
    for (const [name, p] of Object.entries({ first: got.first, mid: got.mid, last: got.last })) {
      assert.match(p.line, /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) \d+ \w{3} \d{4} · (No contributions|1 contribution|[\d,]+ contributions)$/, `${name}: ${p.line}`);
      assert.ok(p.outline, `${name}: an outline`);
      const o = p.outline!;
      const s = p.square;
      assert.ok(o.left < s.left && o.right > s.right && o.top < s.top && o.bottom > s.bottom, `${name}: the outline goes round its square`);
      assert.ok(Math.abs((o.left + o.right) / 2 - (s.left + s.right) / 2) < 0.5 && Math.abs((o.top + o.bottom) / 2 - (s.top + s.bottom) / 2) < 0.5, `${name}: centred on it`);
    }
    const { first, last, paper } = got;
    assert.ok(first.square.top - paper.svg.top < 30, "the first day in the top row");
    assert.ok(first.square.left < paper.svg.left + paper.svg.width / 2, "in the first column");
    assert.ok(last.square.left > paper.svg.left + paper.svg.width / 2, "the last day in the second column");
    assert.ok(last.square.top > paper.svg.top + paper.svg.height / 2, "near its foot");
  });
}
