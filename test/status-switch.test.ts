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
 * StatusSwitch in a real browser, with React running (owner, 2026-11-16: "change status active from a tag or a toggler
 * to a switch like language with dots, but active should change text color as well"): no line, box, fill or shadow on
 * the pair or on a word; the current word heavier with the --s1-here dot under it alone; the on state, current, in the
 * ok hue a theme sets (the ink where none is set), the off state, current, in the ink, the other word dimmer and AA on
 * both papers, by day and at night; the three heights; Chinese in the Chinese sans at 12px; a radiogroup of two radios,
 * Tab at the current one, an arrow key moving and choosing; busy, disabled and a locked state taking no press; the dot
 * pulsing while busy where motion is welcome and whole where it is not; in a table's cell the first word at the
 * column's edge. Vite bundles a small page from src/ui/ as an app would; headless Chrome runs it, its script presses and
 * prints what it found. Skipped where there is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-status-"));
after(() => rmSync(out, { recursive: true, force: true }));

const part = (f: string) => JSON.stringify(path.join(ROOT, "src/ui", f));
const ENTRY = `
window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
import { useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { StatusSwitch } from ${part("status-switch.tsx")};
import { Table } from ${part("table.tsx")};

const WORDS = { on: "Active", off: "Inactive" };
const chosen = [];
function Stateful({ id, start = true, words = WORDS, ...rest }) {
  const [on, setOn] = useState(start);
  return <StatusSwitch id={id} label={"Status of " + id} words={words} value={on} onValueChange={(v) => { chosen.push(id + ":" + v); setOn(v); }} {...rest} />;
}
// a theme's ok, as the admin's theme sets it (#1d733b by day, #5cc281 at night)
const DAY_OK = { "--s1-ok": "#1d733b" };
const NIGHT_OK = { "--s1-ok": "#5cc281", background: "var(--s1-paper)", color: "var(--s1-ink)" };
const ROWS = [{ id: 1, name: "Claude Standard", on: true }, { id: 2, name: "Grok", on: false }];
const root = createRoot(document.getElementById("app"));
flushSync(() =>
  root.render(
    <>
      <div id="themed" style={DAY_OK}><Stateful id="sm" /><Stateful id="off" start={false} /></div>
      <div id="plain"><Stateful id="ink" /></div>
      <div id="sizes"><Stateful id="md" size="md" /><Stateful id="xs" size="xs" words={{ on: "On", off: "Off" }} /></div>
      <div id="zh" lang="zh-CN"><Stateful id="cn" words={{ on: "正常", off: "未启用" }} /></div>
      <div id="night" data-theme="dark" style={NIGHT_OK}><Stateful id="nt" /><Stateful id="ntoff" start={false} /></div>
      <div id="states" style={DAY_OK}><Stateful id="busy" busy /><Stateful id="dis" disabled /><Stateful id="lock" locked="off" /></div>
      <div id="table" style={{ width: 600 }}>
        <Table caption="Groups" fit rowKey="id" rows={ROWS} columns={[{ key: "name", header: "Group" }, { key: "on", header: "Status", width: 136, cell: (g) => <StatusSwitch label={"Status of " + g.name} words={WORDS} value={g.on} /> }]} />
      </div>
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
const channels = (c) => { const n = c.match(/[\\d.]+/g).map(Number).slice(0, 3); return c.startsWith("color(") ? n.map((v) => v * 255) : n; };
const lum = (c) => { const [r, g, b] = channels(c); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const lines = (el) => { const s = css(el); return [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth, s.outlineStyle, s.boxShadow, s.backgroundColor, s.backgroundImage]; };
const item = (b) => {
  const s = css(b);
  const label = b.querySelector(".s1-status__label");
  const dot = css(label, "::after");
  const r = b.getBoundingClientRect();
  return { tag: b.tagName, role: b.getAttribute("role"), checked: b.getAttribute("aria-checked"), disabled: b.getAttribute("aria-disabled"), tab: b.getAttribute("tabindex"), text: b.textContent, color: s.color, weight: s.fontWeight, size: s.fontSize, spacing: s.letterSpacing, transform: s.textTransform, family: s.fontFamily, w: Math.round(r.width), h: Math.round(r.height), lines: lines(b), dot: { opacity: dot.opacity, bg: dot.backgroundColor, w: dot.width, animation: dot.animationName, transition: dot.transitionDuration } };
};
const group = (id) => { const g = document.getElementById(id); return { role: g.getAttribute("role"), label: g.getAttribute("aria-label"), busy: g.getAttribute("aria-busy"), disabled: g.getAttribute("aria-disabled"), lines: lines(g), items: [...g.children].map(item) }; };
const steps = [];
const step = (f) => steps.push(f);

step(() => {
  got.ink = token("--s1-ink");
  got.ink3 = token("--s1-ink-3");
  got.paper = token("--s1-paper");
  got.paper2 = token("--s1-paper-2");
  got.here = token("--s1-here");
  got.ok = token("--s1-ok", $("#themed"));
  got.nightInk = token("--s1-ink", $("#night"));
  got.nightPaper = token("--s1-paper", $("#night"));
  got.nightPaper2 = token("--s1-paper-2", $("#night"));
  got.nightHere = token("--s1-here", $("#night"));
  got.nightOk = token("--s1-ok", $("#night"));
  got.dim = rgb(getComputedStyle($("#sm")).getPropertyValue("--s1-status-dim").trim());
  got.nightDim = rgb(getComputedStyle($("#nt")).getPropertyValue("--s1-status-dim").trim(), $("#night"));
  got.before = Object.fromEntries(["sm", "off", "ink", "md", "xs", "cn", "nt", "ntoff", "busy", "dis", "lock"].map((id) => [id, group(id)]));
  // in a table's cell: the first word at the column's edge (the cell's content box), the switch's own room over its padding
  const cell = $("#table tbody td:last-child, #table tbody th:last-child");
  const firstLabel = cell.querySelector(".s1-status__label").getBoundingClientRect();
  got.cell = { edge: cell.getBoundingClientRect().left + parseFloat(css(cell).paddingLeft), first: firstLabel.left, margin: css(cell.querySelector(".s1-status")).marginInlineStart };
  // Tab's one stop: the current word; an arrow key moves to the other and chooses it
  const current = $("#sm [aria-checked='true']");
  current.focus();
  got.focus = { on: document.activeElement === current, visible: current.matches(":focus-visible"), outline: [css(current).outlineStyle, css(current).outlineWidth] };
  current.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
});
step(() => {
  got.afterKey = { sm: group("sm"), focusOff: document.activeElement === $("#sm .s1-status__item--off") };
  // presses that must do nothing: the current word, a busy, a disabled and a locked one
  $("#ink .s1-status__item--on").click();
  $("#busy .s1-status__item--off").click();
  $("#dis .s1-status__item--off").click();
  $("#lock .s1-status__item--off").click();
  // and one that works: the locked switch's other word is free
  $("#off .s1-status__item--on").click();
});
step(() => {
  got.running = document.getAnimations().filter((a) => a.animationName !== "s1-status-wait").length;
  for (const a of document.getAnimations()) if (a.animationName !== "s1-status-wait") a.finish();
  got.afterPress = { off: group("off"), lock: group("lock") };
  got.chosen = [...chosen];
});

let i = 0;
const next = () => {
  if (i < steps.length) { steps[i++](); setTimeout(next, 250); }
  else document.getElementById("out").textContent = JSON.stringify(got);
};
setTimeout(next, 120);
`;

// rgb(...) in 0–255; color(srgb ...) in 0–1 (what color-mix() computes to).
const channels = (c: string) => {
  const n = (c.match(/[\d.]+/g) ?? []).map(Number).slice(0, 3);
  return c.startsWith("color(") ? n.map((v) => v * 255) : n;
};
const lum = (c: string) => {
  const lin = (x: number) => ((x /= 255) <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = channels(c);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

test("StatusSwitch in a browser: no line round the pair or a word, the on state in the ok hue, the dot under the current one alone, the other dimmer (AA), sizes, Chinese, a radiogroup and its keys, busy, disabled, locked, reduced motion, a table's edge", async (t) => {
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
  writeFileSync(page, `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css} *, *::before, *::after { box-sizing: border-box; } body { margin: 0; background: var(--s1-paper); color: var(--s1-ink); }</style></head><body><div id="app"></div><pre id="out"></pre><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`);

  const run = (flags: string[]) => {
    let dom: string;
    try {
      dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,900", "--virtual-time-budget=10000", ...flags, "--dump-dom", pathToFileURL(page).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
    } catch (e) {
      return t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
    }
    const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
    assert.ok(text, "the page printed nothing");
    const found = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
    assert.equal(found.pageError, undefined, found.pageError);
    return found;
  };

  const got = run([]);
  if (!got) return;
  const none = ["0px", "0px", "0px", "0px", "none", "none", "rgba(0, 0, 0, 0)", "none"];
  for (const [name, g] of Object.entries(got.before) as [string, { lines: string[]; items: { lines: string[] }[] }][]) {
    assert.deepEqual(g.lines, none, `${name}: the pair has no line, box, fill or shadow`);
    for (const it of g.items) assert.deepEqual(it.lines, none, `${name}: a word has no line, box, fill or shadow`);
  }

  // a radiogroup named for the row, of two radios named by their words; Tab reaches the current one only
  const [on, off] = got.before.sm.items;
  assert.deepEqual([got.before.sm.role, got.before.sm.label], ["radiogroup", "Status of sm"]);
  assert.deepEqual([on.tag, on.role, on.checked, on.tab, on.text], ["BUTTON", "radio", "true", "0", "Active"]);
  assert.deepEqual([off.tag, off.role, off.checked, off.tab, off.text], ["BUTTON", "radio", "false", "-1", "Inactive"]);

  // the on state, current, in the ok hue a theme sets; in the ink where none is set; the off state, current, in the ink
  assert.equal(got.ok, "rgb(29, 115, 59)");
  assert.equal(on.color, got.ok);
  assert.equal(got.before.ink.items[0].color, got.ink, "no theme's ok: the on state in the ink");
  assert.deepEqual([got.before.off.items[1].checked, got.before.off.items[1].color], ["true", got.ink]);
  assert.equal(got.before.off.items[0].color, got.dim, "the on state, not current, is as dim as any other word");
  assert.equal(got.before.nt.items[0].color, got.nightOk);
  assert.equal(got.before.ntoff.items[1].color, got.nightInk);
  // the ok hue AA on both papers, by day and at night; the dim word AA too
  for (const [what, fg, bg] of [
    ["ok on paper", got.ok, got.paper],
    ["ok on paper-2", got.ok, got.paper2],
    ["night ok on paper", got.nightOk, got.nightPaper],
    ["night ok on paper-2", got.nightOk, got.nightPaper2],
    ["dim on paper", got.dim, got.paper],
    ["dim on paper-2", got.dim, got.paper2],
    ["night dim on paper", got.nightDim, got.nightPaper],
    ["night dim on paper-2", got.nightDim, got.nightPaper2],
  ] as const)
    assert.ok(contrast(fg, bg) >= 4.5, `${what}: ${contrast(fg, bg).toFixed(2)}:1`);
  assert.ok(Number(on.weight) > Number(off.weight), `the current word is heavier (${on.weight} over ${off.weight})`);

  // the dot: under the current word alone, 4px, in --s1-here (the night's blue at night)
  assert.deepEqual([on.dot.opacity, on.dot.bg, on.dot.w], ["1", got.here, "4px"]);
  assert.equal(off.dot.opacity, "0");
  assert.deepEqual([got.before.nt.items[0].dot.opacity, got.before.nt.items[0].dot.bg], ["1", got.nightHere]);

  // one height at each size, every word 24px wide at least
  for (const [name, h] of [["sm", 30], ["md", 40], ["xs", 24]] as const) {
    for (const it of got.before[name].items) {
      assert.equal(it.h, h, `${name}: ${it.text} is ${it.h}px tall`);
      assert.ok(it.w >= 24, `${name}: ${it.text} is ${it.w}px wide`);
    }
  }

  // Latin in mono capitals; Chinese in the Chinese sans at 12px, not tracked, not in capitals
  assert.equal(on.transform, "uppercase");
  const cn = got.before.cn.items[0];
  assert.match(cn.family, /^"?PingFang SC"?, .*Microsoft YaHei/);
  assert.deepEqual([cn.size, cn.transform], ["12px", "none"]);
  assert.ok(["normal", "0px"].includes(cn.spacing), `正常 is not tracked (${cn.spacing})`);

  // busy: the pair says so, both words wait (the other in the third ink), the dot under the state asked for pulses
  const busy = got.before.busy;
  assert.deepEqual([busy.busy, busy.items[0].disabled, busy.items[1].disabled], ["true", "true", "true"]);
  assert.equal(busy.items[1].color, got.ink3);
  assert.equal(busy.items[0].color, got.ok, "the state asked for keeps its hue while it waits");
  assert.equal(busy.items[0].dot.animation, "s1-status-wait");
  // disabled: both words in the third ink; locked: only the locked one
  assert.equal(got.before.dis.disabled, "true");
  assert.deepEqual(got.before.dis.items.map((it: { color: string }) => it.color), [got.ink3, got.ink3]);
  assert.deepEqual(got.before.lock.items.map((it: { disabled: string | null }) => it.disabled), [null, "true"]);

  // the keys: Tab's stop the current word, an arrow moves to the other and chooses it
  assert.ok(got.focus.on, "the current word takes focus");
  if (got.focus.visible) assert.deepEqual(got.focus.outline, ["solid", "2px"]);
  assert.deepEqual(got.afterKey.sm.items.map((it: { checked: string }) => it.checked), ["false", "true"]);
  assert.ok(got.afterKey.focusOff, "the arrow moved focus to the word it chose");
  // presses: the current word, busy, disabled and locked ones say nothing; the free word chooses
  assert.deepEqual(got.chosen, ["sm:false", "off:true"]);
  assert.deepEqual(got.afterPress.off.items.map((it: { checked: string }) => it.checked), ["true", "false"]);
  assert.deepEqual(got.afterPress.lock.items.map((it: { checked: string }) => it.checked), ["true", "false"]);

  // in a table's cell: the first word starts at the column's edge, its own 4px over the cell's padding
  assert.equal(got.cell.margin, "-4px");
  assert.ok(Math.abs(got.cell.first - got.cell.edge) <= 0.5, `the first word starts ${(got.cell.first - got.cell.edge).toFixed(2)}px from the column's edge`);

  // where motion is welcome the dot grows in and pulses while busy; under reduced motion it is simply there, whole while busy
  assert.equal(on.dot.transition, "0.16s, 0.16s");
  assert.ok(got.running > 0, "the press started the dot's and the ink's transitions");
  const still = run(["--force-prefers-reduced-motion"]);
  if (!still) return;
  assert.equal(still.before.sm.items[0].dot.transition, "0s");
  assert.equal(still.before.busy.items[0].dot.animation, "none");
  assert.equal(still.before.busy.items[0].dot.opacity, "1");
  assert.equal(still.running, 0, "under reduced motion nothing moves");
});
