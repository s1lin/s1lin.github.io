import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createElement as h, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import ts from "typescript";
import react from "@vitejs/plugin-react";
import { build } from "vite";

/*
 * MetroMap and Timetable. On the server: the figure and its names, stations placed on a log axis, the zones, the
 * interchanges (rings only on member lines, the fare on a tag, the 5 % rule that compares with the run's cheapest),
 * twin stops, square stops, stations left off, the evenly spaced map without an axis, lit stations, the trains'
 * timing, the Timetable as a styling of Table. Then in headless Chrome with React running: no two label blocks
 * overlap and none sits on a track, the rings sit on member lines only, a focused station or interchange opens its
 * tooltip; the phone's strip map stays inside its box; reduced motion stops the trains; the forced-colours rules draw
 * in the system's colours; and the names a screen reader hears.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const UI = path.join(ROOT, "src/ui");

/* src/ui/ as plain ES modules in a scratch folder (stylesheets dropped), as test/ui-parts.test.ts does. */
const out = mkdtempSync(path.join(tmpdir(), "s1lin-metro-"));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");
writeFileSync(path.join(out, "package.json"), '{ "type": "module" }');
for (const f of readdirSync(UI).filter((x) => /\.tsx?$/.test(x))) {
  const js = ts.transpileModule(readFileSync(path.join(UI, f), "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  writeFileSync(
    path.join(out, f.replace(/\.tsx?$/, ".js")),
    js.replace(/^import\s+["']\.\/[\w-]+\.css["'];?\s*$/gm, "").replace(/from\s+["'](\.\/[\w-]+)["']/g, 'from "$1.js"'),
  );
}
after(() => rmSync(out, { recursive: true, force: true }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const part = async (name: string): Promise<any> => import(pathToFileURL(path.join(out, `${name}.js`)).href);
const html = (node: ReactNode) => renderToString(node as never).replaceAll("<!-- -->", "");
const all = (markup: string, re: RegExp) => [...markup.matchAll(re)];
const num = (s: string) => Number(s);

/** A station on a price axis: x is its output price, the value "in / out". */
const st = (id: string, input: number, output: number, extra: Record<string, unknown> = {}) => ({
  id,
  label: id,
  x: output || input,
  kind: output ? "stop" : "input",
  value: `${input.toFixed(2)} / ${output.toFixed(2)}`,
  href: `#${id}`,
  ...extra,
});
const LINES = [
  { id: "gpt", name: "GPT", colour: { light: "#0e7251", dark: "#5ad1a3" }, stations: [st("gpt-5.5-nano", 0.05, 0.4), st("gpt-5.5", 1.25, 10), st("gpt-5.5-codex", 1.25, 10), st("gpt-image-2", 0, 0, { x: null })] },
  { id: "claude", name: "Claude", colour: "var(--c-vendor-anthropic)", stations: [st("claude-haiku-4-5", 0.44, 2.2), st("claude-opus-5", 8.25, 41.25)] },
  { id: "gemini", name: "Gemini", stations: [st("gemini-embedding-2", 0.135, 0), st("gemini-3.8-flash-lite", 0.1, 0.4), st("gemini-3.8-flash", 0.27, 2.25)] },
  { id: "grok", name: "Grok", stations: [st("grok-4-3-mini", 0.24, 0.4), st("grok-code-2", 0.16, 1.2)] },
  { id: "none", name: "Nobody", stations: [st("unpriced", 0, 0, { x: null })] },
];
const ZONES = [
  { id: "z1", from: null, to: 0.5, name: "Zone 1 · under $0.50" },
  { id: "z2", from: 0.5, to: 2, name: "Zone 2 · $0.50–2" },
  { id: "z3", from: 2, to: 8, name: "Zone 3 · $2–8" },
  { id: "z4", from: 8, to: 20, name: "Zone 4 · $8–20" },
  { id: "z5", from: 20, to: null, name: "Zone 5 · $20 and up" },
];
const AXIS = { ticks: [0.1, 0.5, 1, 2, 5, 10, 20], format: (v: number) => `$${v < 1 ? v.toFixed(2) : v}` };
const tag = (f: { min: number; max: number; exact: boolean }) => (f.exact ? `$${f.min.toFixed(2)}` : `$${f.min.toFixed(2)}–${f.max.toFixed(2)}`);

/** The y of each line's track, by the line's name, from the server's HTML. */
function tracks(m: string) {
  return new Map(
    all(m, /<g class="s1-metro__line" role="group" aria-label="([^"]+)"[^>]*>[\s\S]*?<path class="s1-metro__track" d="M([\d.]+) ([\d.]+) H([\d.]+)"/g).map((g) => [g[1], { y: num(g[3]), x0: num(g[2]), x1: num(g[4]) }]),
  );
}
/** The stop drawn for a station, by its id. */
function stopOf(m: string, id: string) {
  const a = new RegExp(`data-station="${id.replace(/\./g, "\\.")}"[^>]*>(?:<circle class="s1-metro__spot" cx="([\\d.]+)" cy="([\\d.]+)")?`).exec(m);
  return a && a[1] ? { x: num(a[1]), y: num(a[2]) } : null;
}

// ------------------------------------------------------------------ the map on the server

test("MetroMap: a figure with its caption last, a group for each line it can draw, a link for each station named by its label and value", async () => {
  const { MetroMap } = await part("metro-map");
  const m = html(h(MetroMap, { lines: LINES, axis: AXIS, zones: ZONES, caption: "What you pay now", legend: "in / out", details: "table", label: "Prices" }));
  assert.match(m, /^<figure class="s1-metro" data-layout="across" aria-details="table"/);
  assert.match(m, /<figcaption id="[^"]+" class="s1-metro__caption">What you pay now<\/figcaption><\/figure>$/, "the caption is the figure's last child");
  assert.match(m, /<div class="s1-metro__legend">in \/ out<\/div>/);
  assert.match(m, /<svg class="s1-metro__map" width="960" height="[\d.]+" viewBox="0 0 960 [\d.]+" role="group" aria-label="Prices"/, "960px wide before the frame is measured");
  const groups = all(m, /<g class="s1-metro__line" role="group" aria-label="([^"]+)"/g).map((g) => g[1]);
  assert.deepEqual(groups, ["GPT", "Claude", "Gemini", "Grok"], "in the order given; a line with nothing to draw is left off");
  const links = all(m, /<a href="([^"]+)" class="s1-metro__station" data-station="[^"]+" data-stop="[^"]+" aria-label="([^"]+)"/g).map((a) => a[2]);
  assert.ok(links.includes("gpt-5.5-nano, 0.05 / 0.40"));
  assert.ok(!links.some((l) => l.startsWith("gpt-image-2")), "a station without a place on the axis is not drawn");
  assert.match(m, /aria-label="GPT" style="--s1-metro-hue:light-dark\(#0e7251, #5ad1a3\)"/);
  for (const cls of ["s1-metro__track", "s1-metro__badge", "s1-metro__trains", "s1-metro__end", "s1-metro__zones", "s1-metro__approach"]) {
    for (const [t] of all(m, new RegExp(`<[a-z]+ class="${cls}"[^>]*>`, "g"))) assert.match(t, /aria-hidden="true"/, `${cls} is hidden`);
  }
  assert.match(m, /<text class="s1-metro__letter"[^>]*>G<\/text>/, "a line with no mark: its first letter in the roundel");
});

test("MetroMap: stations sit at their price on a log axis, in five zones, with ticks in the axis's format", async () => {
  const { MetroMap } = await part("metro-map");
  const m = html(h(MetroMap, { lines: LINES, axis: AXIS, zones: ZONES, trains: false }));
  const nano = stopOf(m, "gpt-5.5-nano");
  const gpt = stopOf(m, "gpt-5.5");
  const opus = stopOf(m, "claude-opus-5");
  assert.ok(nano && gpt && opus);
  // 0.40 → 10 → 41.25 on a log scale: distance ∝ log ratio
  const perDecade = (gpt!.x - nano!.x) / Math.log10(10 / 0.4);
  assert.ok(Math.abs((opus!.x - gpt!.x) / Math.log10(41.25 / 10) - perDecade) < 0.5, "equal ratios, equal distances");
  const zones = all(m, /<g class="s1-metro__zone"( data-shade="true")?><rect x="([\d.]+)" y="0" width="([\d.]+)"/g);
  assert.equal(zones.length, 5);
  assert.deepEqual(zones.map((z) => !!z[1]), [true, false, true, false, true], "shaded in turn");
  for (let i = 1; i < zones.length; i++) assert.ok(Math.abs(num(zones[i][2]) - (num(zones[i - 1][2]) + num(zones[i - 1][3]))) < 0.01, "zones meet");
  assert.match(m, /<text class="s1-metro__zone-name" transform="translate\([\d.]+ 13\)">Zone 1 · under \$0\.50<\/text>/);
  assert.equal(all(m, /class="s1-metro__zone-edge"/g).length, 4, "a dashed edge where each zone after the first starts");
  const z = (x: number) => zones.findIndex((q) => x >= num(q[2]) && x < num(q[2]) + num(q[3]));
  assert.deepEqual([z(nano!.x), z(gpt!.x), z(opus!.x)], [0, 3, 4], "each station in its fare's zone");
  assert.deepEqual(all(m, /<g class="s1-metro__tick">[\s\S]*?<text[^>]*>([^<]+)</g).map((t) => t[1]), ["$0.10", "$0.50", "$1", "$2", "$5", "$10", "$20"]);
  // a name wider than its band: two lines, split at " · ", and never past the band (clipped to it)
  const narrow = html(h(MetroMap, { lines: LINES, axis: AXIS, zones: [...ZONES.slice(0, 3), { id: "z4", from: 8, to: 9, name: "Zone 4 · $8–9" }, { id: "z5", from: 9, to: null, name: "Zone 5" }], trains: false }));
  assert.match(narrow, /<g clip-path="url\(#s1m[\w-]+-z4\)"><text class="s1-metro__zone-name" transform="translate\([\d.]+ 13\)"><tspan x="0">Zone 4<\/tspan><tspan x="0" dy="12">\$8–9<\/tspan><\/text><\/g>/);
  assert.match(narrow, /<clipPath id="s1m[\w-]+-z4"><rect x="([\d.]+)"/);
});

test("MetroMap: an interchange where lines meet at one fare: a bar behind the tracks, a ring on each member's track only, the fare on a tag", async () => {
  const { MetroMap } = await part("metro-map");
  const m = html(h(MetroMap, { lines: LINES, axis: AXIS, zones: ZONES, interchange: { label: tag }, trains: false }));
  const ys = tracks(m);
  const groups = all(m, /<g class="s1-metro__interchange" role="img" tabindex="0" aria-label="([^"]+)" data-members="([^"]+)">([\s\S]*?)<\/g>(?=<g class="s1-metro__interchange"|<\/svg>)/g);
  const at040 = groups.find((g) => g[2] === "gpt-5.5-nano gemini-3.8-flash-lite grok-4-3-mini");
  assert.ok(at040, "$0.40 on three lines");
  assert.equal(at040![1], "Same fare: gpt-5.5-nano, gemini-3.8-flash-lite and grok-4-3-mini, $0.40");
  assert.match(at040![3], /<g class="s1-metro__xtag"><rect[^>]*><\/rect><text[^>]*>\$0\.40<\/text><\/g>/);
  const rings = all(at040![3], /<circle class="s1-metro__xring" cx="([\d.]+)" cy="([\d.]+)"/g).map((r) => num(r[2]));
  assert.deepEqual(rings, [ys.get("GPT")!.y, ys.get("Gemini")!.y, ys.get("Grok")!.y], "a ring on each member's track, none on Claude's, which only crosses");
  // the bar runs from the top member to the bottom member, and is drawn before (under) the tracks
  const bar = /<rect class="s1-metro__xbar" x="[\d.]+" y="([\d.]+)" width="12" height="([\d.]+)" rx="6" aria-hidden="true"/.exec(m)!;
  assert.ok(m.indexOf(bar[0]) < m.indexOf('class="s1-metro__line"'), "the bar is behind the tracks");
  // near fares: within 5 % of the run's cheapest
  const near = groups.find((g) => g[2] === "claude-haiku-4-5 gemini-3.8-flash");
  assert.ok(near, "$2.20 and $2.25 meet");
  assert.match(near![3], />\$2\.20–2\.25<\/text>/);
  // a stop of a member has no ring of its own: the interchange draws it over the track
  assert.doesNotMatch(/data-station="grok-4-3-mini"[^>]*>[\s\S]*?<\/a>/.exec(m)![0], /s1-metro__stop"/);
});

test("MetroMap: the 5 % rule compares each fare with its run's cheapest, so near fares never chain; tolerance 1 joins equal fares only", async () => {
  const { MetroMap } = await part("metro-map");
  const lines = [
    { id: "a", name: "A", stations: [st("a1", 0, 1.0), st("a2", 0, 1.32)] },
    { id: "b", name: "B", stations: [st("b1", 0, 1.04), st("b2", 0, 1.4)] },
    { id: "c", name: "C", stations: [st("c1", 0, 1.08)] },
  ];
  const m = html(h(MetroMap, { lines, axis: AXIS }));
  const members = all(m, /data-members="([^"]+)"/g).map((g) => g[1]);
  assert.deepEqual(members, ["a1 b1"], "1.04 joins 1.00; 1.08 is more than 5 % above 1.00; 1.32 and 1.40 are 6 % apart");
  const exact = html(h(MetroMap, { lines, axis: AXIS, interchange: { tolerance: 1 } }));
  assert.equal(all(exact, /data-members=/g).length, 0);
  assert.equal(all(html(h(MetroMap, { lines, axis: AXIS, interchange: false })), /s1-metro__interchange/g).length, 0);
});

test("MetroMap: stations meet only within their unit: a $0.04 image and a $0.04 request are two stops, not an interchange", async () => {
  const { MetroMap } = await part("metro-map");
  const lines = [
    { id: "a", name: "A", stations: [{ id: "img", label: "img", x: 0.04, unit: "image", href: "#img" }] },
    { id: "b", name: "B", stations: [{ id: "req", label: "req", x: 0.04, unit: "request", href: "#req" }, { id: "img2", label: "img2", x: 0.041, unit: "image", href: "#img2" }] },
  ];
  const m = html(h(MetroMap, { lines, axis: AXIS }));
  assert.deepEqual(all(m, /data-members="([^"]+)"/g).map((g) => g[1]), ["img img2"]);
});

test("MetroMap: two stations of one line at one fare share a twin stop, each its own link; a station priced on input is a square", async () => {
  const { MetroMap } = await part("metro-map");
  const m = html(h(MetroMap, { lines: LINES, axis: AXIS, trains: false }));
  const twin = /<a href="#gpt-5\.5" class="s1-metro__station" data-station="gpt-5\.5"[^>]*>([\s\S]*?)<\/a><a href="#gpt-5\.5-codex" class="s1-metro__station" data-station="gpt-5\.5-codex"[^>]*>([\s\S]*?)<\/a>/.exec(m);
  assert.ok(twin, "two links, one after the other");
  assert.equal(all(twin![1], /class="s1-metro__stop"/g).length, 1, "one ring");
  assert.equal(all(twin![2], /class="s1-metro__stop"|class="s1-metro__spot"/g).length, 0, "the second has its words only");
  const y = (s: string) => num(/<text class="s1-metro__label" x="[\d.]+" y="([\d.]+)"/.exec(s)![1]);
  assert.equal(y(twin![2]) - y(twin![1]), 26, "stacked: label and value, then the next");
  assert.match(m, /data-station="gemini-embedding-2"[^>]*><circle class="s1-metro__spot"[^>]*><\/circle><rect class="s1-metro__stop s1-metro__stop--input"/);
});

test("MetroMap: without an axis a line's stations are evenly spaced in their order, and no interchange is drawn", async () => {
  const { MetroMap } = await part("metro-map");
  const lines = [{ id: "a", name: "A", stations: ["one", "two", "three", "four"].map((id) => ({ id, label: id, value: "1", href: `#${id}` })) }, { id: "b", name: "B", stations: [{ id: "x", label: "x", href: "#x" }] }];
  const m = html(h(MetroMap, { lines, trains: false }));
  const xs = ["one", "two", "three", "four"].map((id) => stopOf(m, id)!.x);
  assert.ok(xs.slice(2).every((x, i) => Math.abs(x - xs[i + 1] - (xs[1] - xs[0])) < 0.01), "one step");
  assert.equal(all(m, /s1-metro__interchange/g).length, 0, "x and one share a position, not a fare");
});

test("MetroMap: a strip map on request: tracks side by side, the cheapest at the top, the words in one column with leaders", async () => {
  const { MetroMap } = await part("metro-map");
  const m = html(h(MetroMap, { lines: LINES, axis: AXIS, zones: ZONES, interchange: { label: tag }, layout: "down", trains: false }));
  assert.match(m, /data-layout="down"/);
  assert.match(m, /<svg class="s1-metro__map" width="358"/, "a phone's width before the frame is measured");
  const nano = stopOf(m, "gpt-5.5-nano")!;
  const opus = stopOf(m, "claude-opus-5")!;
  assert.ok(opus.y > nano.y, "pricier further down");
  const labels = all(m, /<text class="s1-metro__label" x="([\d.]+)"/g).map((t) => num(t[1]));
  assert.equal(new Set(labels).size, 1, "one column");
  assert.ok(all(m, /<path class="s1-metro__leader" d="M/g).length > 0);
  assert.match(m, /<text class="s1-metro__xhead" x="[\d.]+" y="[\d.]+">⇄ Same fare \$0\.40<\/text>/);
  assert.match(m, /<text class="s1-metro__zone-name" transform="translate\(11 [\d.]+\) rotate\(-90\)">/, "zone names up the left edge");
});

test("MetroMap: stations the app lights: their stop and line lit, the tooltip open; the map's own lights call onLit, the app's do not", async () => {
  const { MetroMap } = await part("metro-map");
  const said: unknown[] = [];
  const m = html(h(MetroMap, { lines: LINES, axis: AXIS, zones: ZONES, lit: ["claude-opus-5"], onLit: (v: unknown) => said.push(v) }));
  assert.match(m, /<svg class="s1-metro__map"[^>]*data-lit="true"/);
  assert.match(m, /aria-label="Claude" style="[^"]*" data-lit="true"/);
  assert.match(m, /data-station="claude-opus-5" data-stop="[\d@]+" data-lit="true"/);
  assert.match(m, /<div class="s1-metro__tip"[^>]*aria-hidden="true"><span class="s1-metro__tip-line">Claude · Zone 5 · \$20 and up<\/span><span class="s1-metro__tip-station"><span class="s1-metro__tip-label">claude-opus-5<\/span><span class="s1-metro__tip-value">8\.25 \/ 41\.25<\/span>/);
  assert.deepEqual(said, []);
});

test("MetroMap: a station's status on its card: the word with its tone's glyph, the strip oldest first, a tone a cell; said with its name; none, no line", async () => {
  const { MetroMap } = await part("metro-map");
  const cells = ["neutral", ...Array(20).fill("ok"), "warn", "bad", "ok"];
  const lines = [
    {
      ...LINES[1],
      stations: [
        st("claude-haiku-4-5", 0.44, 2.2, { note: "in / out", status: { label: "Normal", tone: "ok", cells, summary: "last 24 hours: 21 normal, 1 degraded, 1 down, 1 without data" } }),
        st("claude-opus-5", 8.25, 41.25, { status: { label: "No status yet" } }),
      ],
    },
    { ...LINES[0], stations: [st("gpt-5.5-nano", 0.05, 0.4)] },
  ];
  const lit = html(h(MetroMap, { lines, axis: AXIS, lit: ["claude-haiku-4-5"], trains: false }));
  const tip = /<div class="s1-metro__tip"[^>]*>([\s\S]*?)<\/div>/.exec(lit)![1];
  assert.match(
    tip,
    /<span class="s1-metro__tip-value">0\.44 \/ 2\.20<\/span><span class="s1-metro__status" data-tone="ok"><span class="s1-metro__status-word"><span class="s1-glyph s1-glyph--ok" aria-hidden="true"><\/span>Normal<\/span><span class="s1-metro__strip">/,
    "under the value: the glyph and the word in its tone",
  );
  assert.deepEqual(all(tip, /<i data-tone="([a-z]+)"><\/i>/g).map((c) => c[1]), cells, "the strip, a cell a tone, in order");
  assert.match(tip, /<\/i><\/span><\/span><\/span><span class="s1-metro__tip-note">in \/ out<\/span>$/, "the note after it, last");
  assert.match(lit, /aria-label="claude-haiku-4-5, 0\.44 \/ 2\.20, Normal, last 24 hours: 21 normal, 1 degraded, 1 down, 1 without data"/, "the word and the summary said with the station");
  const none = html(h(MetroMap, { lines, axis: AXIS, lit: ["claude-opus-5"], trains: false }));
  assert.match(none, /<span class="s1-metro__status" data-tone="neutral"><span class="s1-metro__status-word"><span class="s1-glyph s1-glyph--neutral" aria-hidden="true"><\/span>No status yet<\/span><\/span>/, "neutral by default; no cells, no strip");
  assert.match(none, /aria-label="claude-opus-5, 8\.25 \/ 41\.25, No status yet"/);
  const plain = html(h(MetroMap, { lines, axis: AXIS, lit: ["gpt-5.5-nano"], trains: false }));
  assert.doesNotMatch(plain, /s1-metro__status/, "a station without a status has no status line");
  assert.match(plain, /aria-label="gpt-5\.5-nano, 0\.05 \/ 0\.40"/);
  const css = readFileSync(path.join(UI, "metro-map.css"), "utf8");
  for (const [tone, token] of [["ok", "--s1-ok"], ["warn", "--s1-warn"], ["bad", "--s1-bad"]]) {
    assert.match(css, new RegExp(`\\.s1-metro__status\\[data-tone="${tone}"\\] \\.s1-metro__status-word \\{ color: var\\(${token}, var\\(--s1-ink\\)\\)`), `${tone}: the word in ${token}, the ink unset`);
  }
  assert.match(css, /\.s1-metro__strip i\[data-tone="warn"\] \{\s*height: 72%;[^}]*repeating-linear-gradient/, "warn: hatched and shorter");
  assert.match(css, /\.s1-metro__strip i\[data-tone="bad"\] \{ height: 48%;/, "bad: short");
  assert.match(css, /\.s1-metro__strip i\[data-tone="neutral"\] \{ background: transparent; outline: 1px dotted/, "no data: an outline");
});

test("MetroMap: nothing to draw is said with the empty words or a mark; loading draws ghosts and says so", async () => {
  const { MetroMap } = await part("metro-map");
  const { S1Words } = await part("words");
  const none = html(h(MetroMap, { lines: [LINES[4]], axis: AXIS }));
  assert.match(none, /<p class="s1-empty__title">Nothing here yet\.<\/p>/);
  assert.doesNotMatch(none, /<svg class="s1-metro__map"/);
  const marked = html(h(MetroMap, { lines: [], empty: "No prices yet", emptyMark: h("svg", { viewBox: "0 0 8 8" }) }));
  assert.match(marked, /<span class="s1-empty__own" aria-hidden="true"><svg viewBox="0 0 8 8"><\/svg><\/span><p class="s1-empty__title">No prices yet<\/p>/);
  const busy = html(h(S1Words, { words: { loading: "加载中" } }, h(MetroMap, { lines: LINES, loading: 3 })));
  assert.match(busy, /^<figure class="s1-metro" aria-busy="true"/);
  assert.equal(all(busy, /class="s1-metro__ghost-roundel"/g).length, 3, "three ghost lines");
  assert.match(busy, /<span class="s1-visually-hidden">加载中<\/span>/);
});

test("MetroMap: the words for an interchange are translated with the rest", async () => {
  const { MetroMap } = await part("metro-map");
  const { S1Words } = await part("words");
  const m = html(h(S1Words, { words: { sameFare: "同价", and: " 和 " } }, h(MetroMap, { lines: LINES, axis: AXIS, interchange: { label: tag } })));
  assert.match(m, /aria-label="同价: gpt-5\.5-nano, gemini-3\.8-flash-lite 和 grok-4-3-mini, \$0\.40"/);
});

test("MetroMap: a train runs to the terminus and back, waiting at every stop, in valid SMIL timing", async () => {
  const { MetroMap } = await part("metro-map");
  const m = html(h(MetroMap, { lines: [LINES[0]], axis: AXIS }));
  const motion = /<animateMotion ([^>]+)>/.exec(m)![1];
  const get = (name: string) => new RegExp(`${name}="([^"]+)"`).exec(motion)![1];
  const times = get("keyTimes").split(";").map(Number);
  const points = get("keyPoints").split(";").map(Number);
  assert.equal(times.length, points.length);
  assert.equal(times[0], 0);
  assert.equal(times.at(-1), 1);
  assert.ok(times.every((t, i) => i === 0 || t >= times[i - 1]), "times never go back");
  assert.ok(points.every((p) => p >= 0 && p <= 1));
  assert.equal(Math.max(...points), 1, "it reaches the terminus");
  assert.equal(points.at(-1), 0, "and comes home");
  assert.equal(points.length, 1 + 2 * (2 * 2 + 2), "two stops (one twin) out and back, the terminus and home");
});

test("metroHue: a pair is light-dark(), a hex that would vanish gives way to the ink there, anything else as it is", async () => {
  const { metroHue } = await part("metro-map");
  assert.equal(metroHue(undefined), undefined);
  assert.equal(metroHue({ light: "#a24b09", dark: "#f0a16a" }), "light-dark(#a24b09, #f0a16a)");
  assert.equal(metroHue("#111111"), "light-dark(#111111, var(--s1-ink))");
  assert.equal(metroHue("#fafafa"), "light-dark(var(--s1-ink), #fafafa)");
  assert.equal(metroHue("#016a77"), "#016a77");
  assert.equal(metroHue("var(--c-vendor-openai)"), "var(--c-vendor-openai)");
});

test("MetroMap's stylesheet: no trains and no fades under reduced motion; the system's colours when forced; Chinese set plainly", () => {
  const css = readFileSync(path.join(UI, "metro-map.css"), "utf8");
  const still = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n  \}/.exec(css)?.[1] ?? "";
  assert.match(still, /\.s1-metro__trains \{ display: none; \}/);
  assert.match(still, /transition: none/);
  const forced = /@media \(forced-colors: active\) \{([\s\S]*?)\n  \}/.exec(css)?.[1] ?? "";
  assert.match(forced, /\.s1-metro__track[^{]*\{ stroke: CanvasText; \}/);
  assert.match(css, /:lang\(zh\)[\s\S]*?text-transform: none/);
});

// ------------------------------------------------------------------ the timetable on the server

test("Timetable: Table's own table in the map's hand, a station on a rail in each row's header, the band's pill as its mark", async () => {
  const { Timetable, TimetableRail, TimetableMark } = await part("timetable");
  const rows = [
    { id: "gpt-5.5-nano", out: 0.4, here: true },
    { id: "gpt-5.5", out: 10, here: false },
  ];
  const m = html(
    h(Timetable, {
      id: "tt",
      caption: "Prices",
      columns: [
        { key: "id", header: "Model" },
        { key: "out", header: "Output", numeric: true },
      ],
      rowKey: "id",
      rail: (r: { here: boolean }) => h(TimetableRail, { stop: r.here ? "here" : "ring" }),
      rowProps: (r: { id: string; here: boolean }) => ({ "data-lit": r.id === "gpt-5.5" || undefined, "data-fare": r.here ? "here" : undefined }),
      groups: [{ key: "gpt", label: "GPT", mark: h(TimetableMark, { colour: "#0e7251", mark: h("svg", { viewBox: "0 0 24 24" }) }, "OpenAI"), heading: "GPT", rows }],
    }),
  );
  assert.match(m, /^<div id="tt" class="s1-timetable"><div class="s1-table s1-table--groups">/);
  assert.match(m, /<div class="s1-table__gmark"><span class="s1-timetable__pill" data-marked="true" style="--s1-metro-hue:#0e7251"><span class="s1-timetable__pill-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><\/svg><\/span><span class="s1-timetable__pill-name">OpenAI<\/span><\/span><\/div><div id="[^"]+" class="s1-table__gheading">GPT<\/div>/);
  assert.match(m, /<tr data-fare="here"><th scope="row"><span class="s1-table__station"><span class="s1-timetable__rail" data-stop="here" aria-hidden="true"><span class="s1-timetable__track"><\/span><svg class="s1-timetable__ring" viewBox="0 0 14 14" focusable="false"><circle class="s1-timetable__stop"[^>]*><\/circle><\/svg><\/span><span class="s1-table__station-body">gpt-5\.5-nano<\/span><\/span><\/th>/);
  assert.match(m, /<tr data-lit="true"><th scope="row"><span class="s1-table__station"><span class="s1-timetable__rail" data-stop="ring"/);
  const period = html(h(TimetableRail, { stop: "period" }));
  assert.doesNotMatch(period, /circle/, "a period row: a dashed track and no ring");
  const css = readFileSync(path.join(UI, "timetable.css"), "utf8");
  assert.match(css, /th\[scope="row"\]:has\(\.s1-timetable__rail\) \{ position: relative; \}/, "the track runs the cell's whole height, however tall the row");
  const board = html(h(Timetable, { caption: "Departures", columns: [{ key: "id", header: "Model" }], rowKey: "id", rows: [], board: true }));
  assert.match(board, /^<div class="s1-timetable s1-timetable--board" data-theme="dark">/);
});

// ------------------------------------------------------------------ in a browser

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
  const system = ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(existsSync);
  return [...cached, ...system][0];
}

/* The price map of the console's plaza fixture: 10 lines, 30 stations, interchanges near and far, twins. */
const ENTRY = `
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { MetroMap } from ${JSON.stringify(path.join(ROOT, "src/ui/metro-map.tsx"))};

const hours = (bad, warn, none) => Array.from({ length: 24 }, (_, i) => (bad.includes(i) ? "bad" : warn.includes(i) ? "warn" : none.includes(i) ? "neutral" : "ok"));
const STATUS = {
  "claude-haiku-5": { label: "Degraded", tone: "warn", cells: hours([5], [22, 23], [0]), summary: "last 24 hours: 20 normal, 2 degraded, 1 down, 1 without data" },
  "gpt-5.5-nano": { label: "Normal", tone: "ok", cells: hours([], [], []) },
  "gemini-3.8-flash-lite": { label: "Down", tone: "bad", cells: hours([23], [], []) },
  "grok-4-3-mini": { label: "No status yet" },
};
const st = (id, i, o) => ({ id, label: id, x: o || i, kind: o ? "stop" : "input", value: i.toFixed(2) + " / " + o.toFixed(2), href: "#" + id, note: "in / out", status: STATUS[id] });
const lines = [
  ["GPT", "#0e7251", [["gpt-5.5-nano", .05, .4], ["gpt-5.5-mini", .175, 1.4], ["gpt-realtime-2.1-mini", .6, 2.4], ["gpt-transcribe", 1.25, 5], ["gpt-5.5", .875, 7], ["gpt-5.5-codex", 1.25, 10], ["gpt-4o-mini-tts", .6, 12], ["gpt-realtime-2.1", 4, 16], ["gpt-realtime-2", 4, 16]]],
  ["Claude", "#a24b09", [["claude-haiku-4-5", .44, 2.2], ["claude-haiku-5-5", .55, 2.75], ["claude-haiku-5", 1, 5], ["claude-sonnet-5", 1.65, 8.25], ["claude-sonnet-4-6", 1.65, 8.25], ["claude-fable-5-1", 2.75, 13.75], ["claude-opus-5", 8.25, 41.25], ["claude-opus-4-8", 8.25, 41.25]]],
  ["Gemini", "#1a5fd0", [["gemini-embedding-2", .135, 0], ["gemini-3.8-flash-lite", .1, .4], ["gemini-3.8-flash", .27, 2.25], ["gemini-3.8-pro", 1.8, 10.8]]],
  ["DeepSeek", "#016a77", [["deepseek-v4", .336, 1.008], ["deepseek-v4-pro", .66, 2.64]]],
  ["Kimi", "#b0286c", [["kimi-k3", .36, 1.5]]],
  ["GLM", "#312b88", [["glm-5", .36, 1.32]]],
  ["Grok", "#4d4d4d", [["grok-4-3-mini", .24, .4], ["grok-code-2", .16, 1.2], ["grok-3-fast", .3, 2.4], ["grok-4-3", 2.4, 12]]],
  ["Qwen", "#5b48d6", [["qwen-3.8", .24, .96], ["qwen-3.8-coder", .27, 1.08]]],
  ["MiniMax", "#b6303c", [["minimax-m3", .18, .72]]],
  ["Jev", null, [["jev-1-mini", .5, 0]]],
].map(([name, colour, fares]) => ({ id: name.toLowerCase(), name, colour: colour || undefined, stations: fares.map(([id, i, o]) => st(id, i, o)) }));
// The homepage's public prices (2026-11-02): claude-haiku-5-5 at $3.00 between two bars that end on Claude's track.
const squeeze = [
  ["GPT", "#0e7251", [["gpt-realtime-2.1-mini", .6, 2.4], ["gpt-transcribe", 1.25, 5], ["gpt-5.5", .875, 7]]],
  ["Claude", "#a24b09", [["claude-haiku-4-5", .48, 2.4], ["claude-haiku-5-5", .6, 3], ["claude-haiku-5", 1, 5], ["claude-sonnet-5", 1.8, 9], ["claude-sonnet-4-6", 1.8, 9]]],
].map(([name, colour, fares]) => ({ id: name.toLowerCase(), name, colour, stations: fares.map(([id, i, o]) => st(id, i, o)) }));
const zones = [[null, .5], [.5, 2], [2, 8], [8, 20], [20, null]].map(([from, to], i) => ({ id: "z" + i, from, to, name: "Zone " + (i + 1) }));
const axis = { ticks: [.1, .5, 1, 2, 5, 10, 20, 50], format: (v) => "$" + v, cue: { start: "← Cheaper", end: "Pricier →" } };
const interchange = { label: (f) => f.exact ? "$" + f.min.toFixed(2) : "$" + f.min.toFixed(2) + "–" + f.max.toFixed(2), tip: "change here" };

const root = createRoot(document.getElementById("app"));
// headless Chrome keeps a window 500px wide at least: a phone's column (390 less two 16px gutters) is set on the box
const phone = location.search.includes("phone");
const shown = location.search.includes("squeeze") ? squeeze : lines;
flushSync(() => root.render(<div id="box" style={{ "--s1-warn": "#925600", ...(phone ? { width: 358 } : {}) }}><MetroMap lines={shown} axis={axis} zones={zones} interchange={interchange} caption="Prices" label="Prices by family" /></div>));

const boxOf = (el) => { const b = el.getBBox(); return { l: b.x, r: b.x + b.width, t: b.y, b: b.y + b.height }; };
const union = (bs) => bs.reduce((u, b) => ({ l: Math.min(u.l, b.l), r: Math.max(u.r, b.r), t: Math.min(u.t, b.t), b: Math.max(u.b, b.b) }));
const meets = (a, b, by = 0.5) => a.l < b.r - by && a.r > b.l + by && a.t < b.b - by && a.b > b.t + by;
const got = {};
setTimeout(() => {
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => [...document.querySelectorAll(q)];
  const fig = $(".s1-metro");
  const frame = $(".s1-metro__frame");
  const svg = $(".s1-metro__map");
  got.layout = fig.getAttribute("data-layout");
  got.frame = frame.clientWidth;
  got.svg = svg.getBoundingClientRect().width;
  got.page = document.documentElement.scrollWidth > window.innerWidth;
  got.frameScrolls = frame.scrollWidth > frame.clientWidth + 1;
  // every label block (a station's words) against every other, and against every track
  // a twin stop's stations are one block, stacked; down, a fare's stations are one block in the column
  const stopsAt = new Map();
  for (const a of $$(".s1-metro__station")) {
    const k = got.layout === "down" ? a.dataset.stop.split("@")[1] : a.dataset.stop;
    stopsAt.set(k, [...(stopsAt.get(k) ?? []), a]);
  }
  const blocks = [...stopsAt.values()].map((as) => ({ id: as.map((a) => a.dataset.station).join("+"), stop: as[0].dataset.stop, ...union(as.flatMap((a) => [...a.querySelectorAll(".s1-metro__label, .s1-metro__value")].map(boxOf))) }));
  got.blocks = blocks.length;
  got.overlaps = [];
  for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) if (meets(blocks[i], blocks[j])) got.overlaps.push(blocks[i].id + " × " + blocks[j].id);
  got.onTrack = [];
  for (const t of $$(".s1-metro__track")) {
    const tb = boxOf(t);
    for (const b of blocks) if (meets(b, { l: tb.l, r: tb.r, t: tb.t - 2, b: tb.b + 2 }, 0)) got.onTrack.push(b.id);
  }
  // a leader never runs through another stop's words
  got.leaders = [];
  for (const ln of $$(".s1-metro__station .s1-metro__leader")) {
    const own = ln.closest(".s1-metro__station").dataset.stop;
    const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map((a) => +ln.getAttribute(a));
    for (const b of blocks) {
      if (b.stop === own) continue;
      for (let i = 0; i <= 20; i++) {
        const x = x1 + ((x2 - x1) * i) / 20, y = y1 + ((y2 - y1) * i) / 20;
        if (x > b.l + 1 && x < b.r - 1 && y > b.t + 1 && y < b.b - 1) { got.leaders.push(own + " through " + b.id); break; }
      }
    }
  }
  got.outside = blocks.filter((b) => b.l < -0.5 || b.r > svg.viewBox.baseVal.width + 0.5).map((b) => b.id);
  got.zones = $$(".s1-metro__zone").length;
  // rings: each interchange's rings sit on its member lines' tracks, and on no other
  // the bars, as boxes: no stop's words may sit on one
  for (const bar of $$(".s1-metro__interchange .s1-metro__xhit")) {
    const bb = boxOf(bar);
    for (const b of blocks) if (meets(b, bb, 0.5)) got.overlaps.push(b.id + " × a bar");
  }
  got.rings = $$(".s1-metro__interchange").map((g) => {
    const members = g.dataset.members.split(" ");
    const lines = new Set(members.map((id) => $('[data-station="' + id + '"]').closest(".s1-metro__line")));
    const want = [...lines].map((l) => got.layout === "down" ? +l.querySelector(".s1-metro__track").getAttribute("d").match(/^M([\\d.]+)/)[1] : +l.querySelector(".s1-metro__track").getAttribute("d").match(/^M[\\d.]+ ([\\d.]+)/)[1]).sort((a, b) => a - b);
    const rings = got.layout === "down"
      ? members.map((id) => $('[data-station="' + id + '"] .s1-metro__xring')).filter(Boolean).map((c) => +c.getAttribute("cx"))
      : [...g.querySelectorAll(".s1-metro__xring")].map((c) => +c.getAttribute("cy"));
    return { name: g.getAttribute("aria-label"), ok: JSON.stringify([...new Set(rings)].sort((a, b) => a - b)) === JSON.stringify(want) };
  });
  got.names = $$("a.s1-metro__station").map((a) => a.getAttribute("aria-label"));
  got.interchanges = $$(".s1-metro__interchange").map((g) => g.getAttribute("aria-label"));
  got.lineNames = $$(".s1-metro__line").map((g) => g.getAttribute("aria-label"));
  got.trains = getComputedStyle($(".s1-metro__trains")).display;
  got.paused = svg.animationsPaused();
  const probe = document.createElement("span");
  probe.style.color = "CanvasText";
  document.body.append(probe);
  got.canvasText = getComputedStyle(probe).color;
  got.trackStroke = getComputedStyle($(".s1-metro__track")).stroke;
  got.zoneFill = getComputedStyle($(".s1-metro__zone[data-shade] rect")).fill;
  $('a.s1-metro__station[data-station="claude-haiku-5"]').focus();
  setTimeout(() => {
    const tip = $(".s1-metro__tip");
    got.tip = tip ? tip.textContent : null;
    // the status line under the value, before the note: the word in the theme's warn, the strip a cell an hour
    const status = tip && tip.querySelector(".s1-metro__status");
    got.status = status && {
      after: status.previousElementSibling?.className,
      word: getComputedStyle(status.querySelector(".s1-metro__status-word")).color,
      cells: [...status.querySelectorAll(".s1-metro__strip i")].map((i) => i.dataset.tone + ":" + Math.round(i.getBoundingClientRect().height)),
      strip: Math.round(status.querySelector(".s1-metro__strip").getBoundingClientRect().width),
      inside: (() => { const a = tip.getBoundingClientRect(), b = status.getBoundingClientRect(); return b.left >= a.left && b.right <= a.right; })(),
      forced: getComputedStyle(status.querySelector('.s1-metro__strip i[data-tone="ok"]')).backgroundColor,
      forcedBad: getComputedStyle(status.querySelector('.s1-metro__strip i[data-tone="bad"]')).backgroundColor,
    };
    document.getAnimations().forEach((a) => a.finish());
    got.lit = $$(".s1-metro__line").map((g) => g.getAttribute("aria-label") + ":" + getComputedStyle(g).opacity);
    $(".s1-metro__interchange").focus();
    setTimeout(() => {
      const tip2 = $(".s1-metro__tip");
      got.interTip = tip2 ? tip2.textContent : null;
      got.interTones = tip2 ? [...tip2.querySelectorAll(".s1-metro__tip-tone")].map((t) => t.dataset.tone) : null;
      document.getAnimations().forEach((a) => a.finish());
      got.interLit = $$(".s1-metro__line").filter((g) => getComputedStyle(g).opacity === "1").map((g) => g.getAttribute("aria-label"));
      document.getElementById("out").textContent = JSON.stringify(got);
    }, 200);
  }, 300);
}, 300);
`;

test("MetroMap in a browser: labels never meet, rings only on members, tooltips; the phone's strip map in its box; reduced motion; forced colours; names", async (t) => {
  const bin = chrome();
  if (!bin) return t.skip("no Chrome here: set CHROME to run it");
  const dir = mkdtempSync(path.join(tmpdir(), "s1lin-metro-page-"));
  after(() => rmSync(dir, { recursive: true, force: true }));
  symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"), "dir");
  writeFileSync(path.join(dir, "entry.jsx"), ENTRY);
  await build({
    configFile: false,
    root: dir,
    logLevel: "silent",
    plugins: [react()],
    define: { "process.env.NODE_ENV": '"production"' },
    build: { outDir: path.join(dir, "dist"), emptyOutDir: true, minify: false, lib: { entry: path.join(dir, "entry.jsx"), formats: ["iife"], name: "Harness", fileName: () => "harness.js", cssFileName: "harness" } },
  });
  const js = readFileSync(path.join(dir, "dist/harness.js"), "utf8");
  const css = readFileSync(path.join(dir, "dist", readdirSync(path.join(dir, "dist")).find((f) => f.endsWith(".css"))!), "utf8");
  const page = (name: string, sheet: string) => {
    const file = path.join(dir, name);
    writeFileSync(file, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{margin:0 16px}${sheet}</style></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);
    return file;
  };
  const plainPage = page("page.html", css);
  // Forced colours cannot be switched on from the command line: the same page with the forced-colours rules always on.
  assert.match(css, /@media \(forced-colors: ?active\)/);
  const forcedPage = page("forced.html", css.replace(/@media \(forced-colors: ?active\)/g, "@media all"));

  const run = (file: string, size: string, flags: string[] = [], query = "") => {
    let dom: string;
    try {
      dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", `--window-size=${size}`, ...flags, "--virtual-time-budget=8000", "--dump-dom", `${pathToFileURL(file).href}${query}`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 60_000,
      });
    } catch (e) {
      t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
      return null;
    }
    const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
    assert.ok(text, `${size}: the page printed nothing`);
    return JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  };

  const desk = run(plainPage, "1280,900");
  if (!desk) return;
  assert.equal(desk.layout, "across");
  assert.equal(desk.page, false, "the page never scrolls sideways");
  assert.equal(desk.frameScrolls, false);
  assert.equal(desk.blocks, 30, "every stop drawn: 33 stations, three twins");
  assert.deepEqual(desk.overlaps, [], "no two label blocks meet");
  assert.deepEqual(desk.onTrack, [], "no label block sits on a track");
  assert.deepEqual(desk.leaders, [], "no leader runs through another stop's words");
  assert.deepEqual(desk.outside, [], "every label block inside the frame");
  assert.equal(desk.zones, 5);
  assert.ok(desk.rings.length >= 6, "the fixture's interchanges");
  assert.deepEqual(desk.rings.filter((r: { ok: boolean }) => !r.ok), [], "rings on member lines only");
  assert.ok(desk.names.includes("gpt-5.5-nano, 0.05 / 0.40, Normal"), "a status without a summary: its word");
  assert.ok(desk.names.includes("claude-opus-4-8, 8.25 / 41.25"), "a twin's second station is its own link");
  assert.ok(desk.interchanges.includes("Same fare: gpt-5.5-nano, gemini-3.8-flash-lite and grok-4-3-mini, $0.40"));
  assert.ok(desk.interchanges.includes("Same fare: qwen-3.8 and deepseek-v4, $0.96–1.01"), "within 5 %");
  assert.ok(desk.interchanges.includes("Same fare: gpt-realtime-2.1-mini and grok-3-fast, $2.40"), "a bar across Claude's line, between Claude's own");
  assert.deepEqual(desk.lineNames, ["GPT", "Claude", "Gemini", "DeepSeek", "Kimi", "GLM", "Grok", "Qwen", "MiniMax", "Jev"]);
  assert.equal(desk.trains, "inline", "trains ride");
  assert.equal(desk.paused, false);
  assert.match(desk.tip, /^Claude · Zone 3claude-haiku-51\.00 \/ 5\.00Degradedin \/ out$/, "a focused station opens its tooltip, with its zone and status");
  assert.equal(desk.status.after, "s1-metro__tip-value", "the status under the value");
  assert.equal(desk.status.word, "rgb(146, 86, 0)", "the word in the theme's --s1-warn");
  assert.equal(desk.status.cells.length, 24);
  assert.deepEqual([desk.status.cells[0], desk.status.cells[1], desk.status.cells[23]], ["neutral:12", "ok:12", "warn:9"], "no data an outline, ok full, warn shorter");
  assert.ok(desk.status.strip >= 96, "a strip a reader can see");
  assert.equal(desk.status.inside, true, "inside its card");
  assert.ok(desk.names.includes("claude-haiku-5, 1.00 / 5.00, Degraded, last 24 hours: 20 normal, 2 degraded, 1 down, 1 without data"), "the status said with the station");
  assert.equal(desk.status.cells[5], "bad:6", "bad: short");
  assert.ok(desk.names.includes("grok-4-3-mini, 0.24 / 0.40, No status yet"));
  assert.deepEqual(
    desk.lit.map((l: string) => l.split(":")[1]),
    ["0.22", "1", "0.22", "0.22", "0.22", "0.22", "0.22", "0.22", "0.22", "0.22"],
    "its line lit, the others stepped back",
  );
  assert.deepEqual(desk.interLit, ["GPT", "Gemini", "Grok"], "an interchange lights its members' lines");
  assert.match(desk.interTip, /^⇄ Same fare · \$0\.40change heregpt-5\.5-nano0\.05 \/ 0\.40gemini-3\.8-flash-lite0\.10 \/ 0\.40grok-4-3-mini0\.24 \/ 0\.40$/);
  assert.deepEqual(desk.interTones, ["ok", "bad", "neutral"], "an interchange's members each with their tone's glyph");

  const squeezed = run(plainPage, "1280,900", [], "?squeeze");
  if (!squeezed) return;
  assert.deepEqual(squeezed.overlaps, [], "a stop between two bars that end on its track: its words below, clear of both");
  assert.deepEqual(squeezed.leaders, []);

  const phone = run(plainPage, "390,844", [], "?phone");
  if (!phone) return;
  assert.equal(phone.layout, "down", "a phone: the strip map");
  assert.ok(phone.svg <= 358.5, "as wide as its box");
  assert.equal(phone.page, false, "the page never scrolls sideways");
  assert.equal(phone.frameScrolls, false);
  assert.deepEqual(phone.outside, [], "every word inside the box");
  assert.deepEqual(phone.overlaps, [], "the label column relaxed: nothing meets");
  assert.deepEqual(phone.rings.filter((r: { ok: boolean }) => !r.ok), [], "rings on member tracks only");

  const still = run(plainPage, "1280,900", ["--force-prefers-reduced-motion"]);
  if (!still) return;
  assert.equal(still.trains, "none", "reduced motion: no trains");
  assert.equal(still.paused, true, "and their clock stopped");

  const forced = run(forcedPage, "1280,900");
  if (!forced) return;
  assert.equal(forced.trackStroke, forced.canvasText, "forced colours: tracks in CanvasText");
  assert.equal(forced.zoneFill, "none", "and no shading behind");
  assert.equal(forced.status.word, forced.canvasText, "a status's word in CanvasText");
  assert.equal(forced.status.forced, forced.canvasText, "and its strip's cells in CanvasText");
  assert.equal(forced.status.forcedBad, forced.canvasText, "a bad cell too, not the theme's red");
  assert.notEqual(desk.trackStroke, desk.canvasText, "(not so without them)");
});
