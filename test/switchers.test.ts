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
 * Every switcher the kit draws, in a real browser with React running, on paper and at night: RadioGroup's cards,
 * segmented row and dots (and `quiet`, which is dots), a ghost Button and a chip with aria-pressed, Switch, and
 * LangSwitch. Owner, 2026-11-02: "all switchers to non-border design ... one dots, two backgrounded. Never have
 * border." So no option, group, track or thumb has a border, an outline or a box-shadow, at rest, under the
 * pointer, chosen, or chosen under the pointer. The pointer is the page's own: each :hover rule is copied as a
 * .s1-hover rule in the same layer and @media, and the class put on the element and its ancestors, as the pointer
 * would match them. Then the two designs: filled (the chosen one on --s1-chosen, the ink until a theme sets it, its
 * words AA on it; the others on no fill, the second paper under the pointer) and dots (no fill ever; the chosen one
 * heavier with the dot in --s1-here, the others dimmer and AA). Skipped where there is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-switchers-"));
after(() => rmSync(out, { recursive: true, force: true }));

const part = (f: string) => JSON.stringify(path.join(UI, f));
const ENTRY = `
// a page error is printed in place of the findings, so the test says what it was
window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Button } from ${part("button.tsx")};
import { LangSwitch } from ${part("lang-switch.tsx")};
import { RadioGroup } from ${part("radio-group.tsx")};
import { Switch } from ${part("switch.tsx")};

const RANGE = ["5m", "30m", "1h", "6h", "24h"].map((r) => ({ value: r, label: r }));
const VIEW = [{ value: "chart", label: "Chart" }, { value: "table", label: "Table" }];
const AMOUNT = [{ value: "5", label: "$5", hint: "the least" }, { value: "20", label: "$20", hint: "about 4M tokens" }];
const LANGS = [{ value: "en", label: "EN", name: "English", lang: "en" }, { value: "zh", label: "中文", lang: "zh-CN" }];

function Set({ id, theme, style }) {
  return (
    <div id={id} data-theme={theme} style={{ background: "var(--s1-paper)", color: "var(--s1-ink)", padding: 8, ...style }}>
      <RadioGroup data-k="segmented" legend="Range" variant="segmented" defaultValue="1h" options={RANGE} />
      <RadioGroup data-k="cards" legend="Amount" variant="cards" defaultValue="20" options={AMOUNT} />
      <RadioGroup data-k="dots" legend="View" variant="dots" defaultValue="chart" options={VIEW} />
      <RadioGroup data-k="quiet" legend="View" variant="segmented" quiet defaultValue="chart" options={VIEW} />
      <div data-k="ghost" role="group" aria-label="Layout">
        <Button variant="ghost" size="sm" data-size="sm" aria-pressed={true}>Grid</Button>
        <Button variant="ghost" size="sm" data-size="sm" aria-pressed={false}>List</Button>
        <Button variant="ghost" data-size="md" aria-pressed={false}>Board</Button>
      </div>
      <div data-k="plain" role="group" aria-label="Alerts">
        <Button size="sm" data-size="sm" aria-pressed={true}>Alerts on</Button>
        <Button data-size="md" aria-pressed={false}>Sound</Button>
      </div>
      <div data-k="icon" role="group" aria-label="Show">
        <Button variant="ghost" size="sm" data-size="sm" aria-pressed={true} aria-label="Wrap" icon={<svg viewBox="0 0 16 16"><path d="M2 8h12" /></svg>} />
        <Button variant="ghost" data-size="md" aria-pressed={false} aria-label="Grid" icon={<svg viewBox="0 0 16 16"><path d="M2 8h12" /></svg>} />
        <Button variant="icon" size="sm" data-size="sm" aria-pressed={false} aria-label="Pin" icon={<svg viewBox="0 0 16 16"><path d="M2 8h12" /></svg>} />
      </div>
      <div data-k="chip" role="group" aria-label="Platform">
        <Button variant="chip" size="sm" data-size="sm" aria-pressed={true}>All</Button>
        <Button variant="chip" data-size="md" aria-pressed={false}>OpenAI</Button>
      </div>
      <div data-k="unpressed" aria-hidden="true">
        <Button size="sm">Alerts on</Button>
        <Button>Sound</Button>
      </div>
      <div data-k="switch">
        <Switch defaultChecked>On</Switch>
        <Switch>Off</Switch>
        <Switch disabled>Off, disabled</Switch>
        <Switch disabled defaultChecked>On, disabled</Switch>
      </div>
      <div data-k="lang"><LangSwitch label="Language" options={LANGS} value="en" onValueChange={() => {}} /></div>
    </div>
  );
}

flushSync(() =>
  createRoot(document.getElementById("app")).render(
    <>
      <Set id="light" theme="light" />
      <Set id="dark" theme="dark" />
      <Set id="brand" theme="light" style={{ "--s1-chosen": "#0f7a6c", "--s1-on-chosen": "#f6f6f4" }} />
    </>,
  ),
);

// Each :hover rule again as a .s1-hover rule, in the same layer and @media, right after it.
const unsupported = [];
const hoverize = (rules) => {
  for (let i = rules.length - 1; i >= 0; i--) {
    const r = rules[i];
    if (r instanceof CSSStyleRule) {
      // a rule for "not under the pointer" would still match beside its copy, so the copy could not stand for the pointer
      if (/:not\\([^)]*:hover/.test(r.selectorText)) unsupported.push(r.selectorText);
      if (r.selectorText.includes(":hover")) {
        (r.parentRule ?? r.parentStyleSheet).insertRule(r.selectorText.replaceAll(":hover", ".s1-hover") + r.cssText.slice(r.selectorText.length), i + 1);
      }
    } else if (r.cssRules) hoverize(r.cssRules);
  }
};
for (const sheet of document.styleSheets) hoverize(sheet.cssRules);
const settle = () => { for (const a of document.getAnimations()) a.finish(); };
const hover = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) e.classList.add("s1-hover"); settle(); };
const leave = () => { for (const e of [...document.querySelectorAll(".s1-hover")]) e.classList.remove("s1-hover"); settle(); };

const probe = document.createElement("span");
const rgb = (c, scope) => { scope.append(probe); probe.style.color = c; const v = getComputedStyle(probe).color; probe.style.color = ""; probe.remove(); return v; };
const token = (name, scope) => rgb(getComputedStyle(scope).getPropertyValue(name).trim(), scope);
const lines = (el, pseudo) => {
  const s = getComputedStyle(el, pseudo ?? null);
  return { border: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth].join(" "), outline: s.outlineStyle, shadow: s.boxShadow };
};
const look = (el, pseudo) => {
  const s = getComputedStyle(el, pseudo ?? null);
  return { ...lines(el, pseudo), bg: s.backgroundColor, color: s.color, weight: s.fontWeight, opacity: s.opacity, content: s.content, w: s.width, h: s.height, display: s.display, radius: s.borderTopLeftRadius, top: s.top };
};
// Every element an option paints (it and what it holds, and their ::before and ::after), skipping what is not
// rendered and the native input the drawn control stands for (it is invisible and takes the clicks).
const painted = (o) => {
  const found = [];
  const options = o.querySelectorAll(".s1-radio, .s1-lang__item, button, .s1-switch");
  for (const el of [o, ...o.querySelectorAll("*")]) {
    // inside an option: measured with the option (a group's own lines are what is left)
    const inside = [...options].some((x) => x !== o && x.contains(el));
    if (el.tagName === "INPUT" || el.closest("svg") && el.tagName !== "svg") continue;
    if (!el.getClientRects().length) continue;
    const name = el.className?.baseVal ?? el.className ?? el.tagName;
    found.push({ name: String(name || el.tagName), inside, ...lines(el) });
    for (const pseudo of ["::before", "::after"]) {
      const s = getComputedStyle(el, pseudo);
      if (s.content !== "none" && s.display !== "none") found.push({ name: String(name || el.tagName) + pseudo, inside, ...lines(el, pseudo) });
    }
  }
  return found;
};
// Opacity down to the page: a word on a faded option is fainter than its colour says.
const fade = (el) => { let o = 1; for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };

// The option elements of a switcher, each with whether it is the chosen one, and the boxes round them.
const OPTIONS = {
  segmented: [".s1-radio", (o) => o.querySelector("input").checked],
  cards: [".s1-radio", (o) => o.querySelector("input").checked],
  dots: [".s1-radio", (o) => o.querySelector("input").checked],
  quiet: [".s1-radio", (o) => o.querySelector("input").checked],
  ghost: ["button", (o) => o.getAttribute("aria-pressed") === "true"],
  plain: ["button", (o) => o.getAttribute("aria-pressed") === "true"],
  icon: ["button", (o) => o.getAttribute("aria-pressed") === "true"],
  chip: ["button", (o) => o.getAttribute("aria-pressed") === "true"],
  switch: [".s1-switch__row", (o) => o.querySelector("input").checked],
  lang: [".s1-lang__item", (o) => o.getAttribute("aria-pressed") === "true"],
  unpressed: ["button", () => false],
};
// Where the pointer is, inside an option: its words, its track, its icon (the class goes on the ancestors too).
const target = (o) => o.querySelector(".s1-radio__label, .s1-lang__label, .s1-switch__track, .s1-btn__icon") ?? o;
// The element that sets the words.
const words = (o) => o.querySelector(".s1-radio__label, .s1-lang__label, .s1-switch__label") ?? o;
const GROUPS = { segmented: ".s1-fieldset__body", cards: ".s1-fieldset__body", dots: ".s1-fieldset__body", quiet: ".s1-fieldset__body", lang: ".s1-lang" };

const got = { sets: {}, tokens: {} };
for (const id of ["light", "dark", "brand"]) {
  const set = document.getElementById(id);
  got.tokens[id] = { ink: token("--s1-ink", set), paper: token("--s1-paper", set), paper2: token("--s1-paper-2", set), ink3: token("--s1-ink-3", set), here: token("--s1-here", set) };
  const kinds = {};
  for (const [k, [sel, chosen]] of Object.entries(OPTIONS)) {
    const box = set.querySelector('[data-k="' + k + '"]');
    const group = GROUPS[k] ? box.querySelector(GROUPS[k]) : null;
    const options = [...box.querySelectorAll(sel)].map((o) => {
      const parts = (state) => {
        const rect = o.getBoundingClientRect();
        const svg = o.querySelector("svg")?.getBoundingClientRect();
        const hint = o.querySelector(".s1-radio__hint");
        const r = {
          state, self: look(o), text: look(words(o)), fade: fade(words(o)), painted: painted(o),
          hint: hint && hint.getClientRects().length ? { ...look(hint), fade: fade(hint) } : null,
          size: o.dataset.size ?? null, w: rect.width, h: rect.height, icon: svg ? [svg.width, svg.height] : null,
        };
        if (k === "switch") { const t = o.querySelector(".s1-switch__track"); r.track = { ...look(t), fade: fade(t) }; r.knob = look(t, "::after"); r.disabled = o.querySelector("input").disabled; }
        if (k === "dots" || k === "quiet") r.dot = look(o.querySelector(".s1-radio__label"), "::after");
        if (k === "lang") r.dot = look(o.querySelector(".s1-lang__label"), "::after");
        if (group) r.group = painted(group).filter((p) => !p.inside);
        r.outer = painted(box).filter((p) => !p.inside);
        return r;
      };
      const rest = parts("rest");
      hover(target(o));
      const hovered = parts("hover");
      leave();
      return { text: o.textContent, chosen: chosen(o), rest, hovered };
    });
    kinds[k] = options;
  }
  got.sets[id] = kinds;
}

// focus: script focus with no pointer before it is keyboard-like, so it matches :focus-visible; each kind's ring
got.focus = {};
for (const [k, sel] of [["segmented", "input"], ["cards", "input"], ["dots", "input"], ["quiet", "input"], ["ghost", "button"], ["plain", "button"], ["icon", "button"], ["chip", "button"], ["switch", "input"], ["lang", "button"]]) {
  const el = document.querySelector('#light [data-k="' + k + '"] ' + sel);
  el.focus();
  const ring = k === "switch" ? el.nextElementSibling : el.closest(".s1-radio") ?? el;
  const s = getComputedStyle(ring);
  got.focus[k] = { visible: el.matches(":focus-visible"), style: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor };
  el.blur();
}
got.unsupported = unsupported;
document.getElementById("out").textContent = JSON.stringify(got);
`;

// rgb(r g b [/ a]) or rgba(...) in 0–255; color(srgb r g b [/ a]) in 0–1 (what color-mix() computes to). Any other
// space, or any alpha under 1, is refused: the contrast of a colour seen through is not its own.
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

type Lines = { border: string; outline: string; shadow: string };
type Look = { border: string; outline: string; shadow: string; bg: string; color: string; weight: string; opacity: string; content: string; w: string; h: string; display: string; radius: string; top: string };
type Painted = Lines & { name: string };
type State = {
  state: string; self: Look; text: Look; fade: number; painted: Painted[]; hint: (Look & { fade: number }) | null;
  size: string | null; w: number; h: number; icon: [number, number] | null;
  track?: Look & { fade: number }; knob?: Look; dot?: Look; group?: Painted[]; outer: Painted[]; disabled?: boolean;
};
type Option = { text: string; chosen: boolean; rest: State; hovered: State };
type Got = {
  sets: Record<string, Record<string, Option[]>>;
  tokens: Record<string, { ink: string; paper: string; paper2: string; ink3: string; here: string }>;
  focus: Record<string, { visible: boolean; style: string; width: string; color: string }>;
  unsupported: string[];
};

let shared: Got | undefined;
async function run(t: { skip: (m: string) => void }): Promise<Got | undefined> {
  if (shared) return shared;
  const bin = chrome();
  if (!bin) return void t.skip("no Chrome here: set CHROME to run it");
  if (!existsSync(path.join(out, "node_modules"))) symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");
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
  let dom: string;
  try {
    dom = execFileSync(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,1600", "--virtual-time-budget=10000", "--dump-dom", pathToFileURL(page).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60_000 });
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    // only a browser that cannot start here at all is a skip; a crash, a hang or a page error is a failure
    if (err.code === "ENOENT" || err.code === "EACCES") return void t.skip(`Chrome would not start (${bin}): ${err.code}`);
    assert.fail(`Chrome failed on the page (${bin}): ${String(err.stderr ?? e).slice(0, 400)}`);
  }
  const text = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1] ?? "";
  assert.ok(text, "the page printed nothing");
  const parsed = JSON.parse(text.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"));
  assert.equal(parsed.pageError, undefined, `the page failed: ${parsed.pageError}`);
  shared = parsed as Got;
  return shared;
}

const NONE = { border: "0px 0px 0px 0px", outline: "none", shadow: "none" };
const linesOf = (l: Lines) => ({ border: l.border, outline: l.outline, shadow: l.shadow });
const SWITCHERS = ["segmented", "cards", "dots", "quiet", "ghost", "plain", "icon", "chip", "switch", "lang"];

test("no switcher has a border, an outline or a box-shadow on anything it paints, on paper or at night, at rest, under the pointer, chosen or not", async (t) => {
  const got = await run(t);
  if (!got) return;
  assert.deepEqual(got.unsupported, [], "no :not(:hover) rule, which the pointer's copy could not stand for");
  for (const [set, kinds] of Object.entries(got.sets)) {
    for (const kind of SWITCHERS) {
      const options = kinds[kind];
      assert.ok(options.length >= 2, `${set} ${kind}: the switcher rendered its options`);
      assert.ok(options.some((o) => o.chosen) && options.some((o) => !o.chosen), `${set} ${kind}: one chosen and one not`);
      for (const o of options) {
        for (const s of [o.rest, o.hovered]) {
          const where = `${set} ${kind} "${o.text}" (${o.chosen ? "chosen" : "not chosen"}, ${s.state})`;
          assert.ok(s.painted.length >= (["ghost", "plain", "chip"].includes(kind) ? 1 : 2), `${where}: the option and what it holds were measured`);
          for (const p of s.painted) assert.deepEqual(linesOf(p), NONE, `${where}: ${p.name}`);
          for (const p of s.outer) assert.deepEqual(linesOf(p), NONE, `${where}: the switcher's box, ${p.name}`);
          for (const p of s.group ?? []) assert.deepEqual(linesOf(p), NONE, `${where}: the group round the options, ${p.name}`);
        }
      }
    }
  }
});

test("filled: the chosen one sits on --s1-chosen (the ink, until a theme sets it) in words AA on it; the others on no fill, the second paper under the pointer", async (t) => {
  const got = await run(t);
  if (!got) return;
  for (const [set, kinds] of Object.entries(got.sets)) {
    const tk = got.tokens[set];
    const fill = set === "brand" ? "rgb(15, 122, 108)" : tk.ink;
    const on = set === "brand" ? "rgb(246, 246, 244)" : tk.paper;
    for (const kind of ["segmented", "cards", "ghost", "plain", "icon", "chip"]) {
      for (const o of kinds[kind]) {
        const where = `${set} ${kind} "${o.text}"`;
        for (const s of [o.rest, o.hovered]) assert.equal(s.fade, 1, `${where} (${s.state}): its words are not faded`);
        if (o.chosen) {
          for (const s of [o.rest, o.hovered]) assert.deepEqual([s.self.bg, s.text.color], [fill, on], `${where}, chosen (${s.state}): its words on the fill`);
          assert.ok(contrast(fill, o.rest.text.color) >= 4.5, `${where}: its words on the fill, ${contrast(fill, o.rest.text.color).toFixed(2)}:1`);
          for (const s of [o.rest, o.hovered]) if (s.hint) {
            assert.equal(s.hint.fade, 1, `${where} (${s.state}): its hint is not faded`);
            assert.ok(contrast(fill, s.hint.color) >= 4.5, `${where} (${s.state}): its hint on the fill, ${contrast(fill, s.hint.color).toFixed(2)}:1`);
          }
        } else {
          assert.equal(o.rest.self.bg, CLEAR, `${where}: no fill at rest`);
          assert.equal(o.hovered.self.bg, tk.paper2, `${where}: the second paper under the pointer`);
          assert.ok(contrast(o.rest.text.color, tk.paper) >= 4.5, `${where}: its words on the paper, ${contrast(o.rest.text.color, tk.paper).toFixed(2)}:1`);
          assert.ok(contrast(o.hovered.text.color, tk.paper2) >= 4.5, `${where}: its words under the pointer, ${contrast(o.hovered.text.color, tk.paper2).toFixed(2)}:1`);
          if (o.rest.hint) assert.ok(contrast(o.rest.hint.color, tk.paper) >= 4.5 && o.rest.hint.fade === 1, `${where}: its hint on the paper`);
          if (o.hovered.hint) assert.ok(contrast(o.hovered.hint.color, tk.paper2) >= 4.5 && o.hovered.hint.fade === 1, `${where}: its hint under the pointer`);
        }
      }
    }
  }
});

test("dots: no fill ever; the chosen word heavier with a 4px dot in --s1-here under it, at rest and under the pointer; the others dimmer, AA, raised by the pointer", async (t) => {
  const got = await run(t);
  if (!got) return;
  for (const [set, kinds] of Object.entries(got.sets)) {
    const tk = got.tokens[set];
    for (const kind of ["dots", "quiet", "lang"]) {
      const chosen = kinds[kind].find((o) => o.chosen)!;
      const other = kinds[kind].find((o) => !o.chosen)!;
      const where = `${set} ${kind}`;
      for (const o of kinds[kind]) for (const s of [o.rest, o.hovered]) assert.equal(s.self.bg, CLEAR, `${where} "${o.text}" (${s.state}): no fill`);
      for (const s of [chosen.rest, chosen.hovered]) {
        const d = s.dot!;
        assert.deepEqual([d.content, d.display, d.w, d.h, d.radius, d.opacity, d.bg], ['""', "block", "4px", "4px", "50%", "1", tk.here], `${where} (${s.state}): the dot under the chosen word`);
        assert.ok(parseFloat(d.top) > 0, `${where} (${s.state}): the dot sits below the word (top ${d.top})`);
        assert.equal(s.text.color, tk.ink, `${where} (${s.state}): the chosen word in the ink`);
        assert.equal(s.fade, 1, `${where} (${s.state}): not faded`);
      }
      for (const s of [other.rest, other.hovered]) assert.equal(s.dot!.opacity, "0", `${where} (${s.state}): no dot under the others`);
      for (const st of ["rest", "hovered"] as const) assert.ok(Number(chosen[st].text.weight) > Number(other[st].text.weight), `${where} (${st}): the chosen word is heavier`);
      assert.equal(other.hovered.fade, 1, `${where}: the raised word is not faded`);
      assert.notEqual(other.rest.text.color, tk.ink, `${where}: the others are dimmer`);
      assert.equal(other.hovered.text.color, tk.ink, `${where}: the pointer raises one to the ink`);
      assert.equal(other.rest.fade, 1, `${where}: the dimmer words are not faded besides`);
      assert.ok(contrast(other.rest.text.color, tk.paper) >= 4.5, `${where}: the dimmer words, ${contrast(other.rest.text.color, tk.paper).toFixed(2)}:1`);
    }
  }
});

test("Switch: a filled track with no line, off in the third ink and on in the ink, each 3:1 on the paper, the paper knob 3:1 on it", async (t) => {
  const got = await run(t);
  if (!got) return;
  for (const [set, kinds] of Object.entries(got.sets)) {
    const tk = got.tokens[set];
    for (const o of kinds.switch.filter((s) => !s.rest.disabled)) {
      const where = `${set} switch "${o.text}"`;
      assert.equal(o.rest.track!.bg, o.chosen ? tk.ink : tk.ink3, `${where}: the track's fill`);
      assert.equal(o.rest.knob!.bg, tk.paper, `${where}: the knob is the paper`);
      assert.ok(contrast(o.rest.track!.bg, tk.paper) >= 3, `${where}: the track on the paper, ${contrast(o.rest.track!.bg, tk.paper).toFixed(2)}:1`);
      assert.ok(contrast(o.rest.knob!.bg, o.rest.track!.bg) >= 3, `${where}: the knob on the track, ${contrast(o.rest.knob!.bg, o.rest.track!.bg).toFixed(2)}:1`);
      assert.ok(contrast(o.hovered.track!.bg, tk.paper) >= 3, `${where}: still a 3:1 fill under the pointer`);
      assert.ok(contrast(o.hovered.knob!.bg, o.hovered.track!.bg) >= 3, `${where}: the knob 3:1 on the track under the pointer`);
      for (const st of [o.rest, o.hovered]) assert.equal(st.track!.fade, 1, `${where} (${st.state}): the track is not faded`);
    }
  }
});

test("the keyboard's focus ring on every switcher: 2px, solid, in the ink", async (t) => {
  const got = await run(t);
  if (!got) return;
  const ink = got.tokens.light.ink;
  for (const [kind, f] of Object.entries(got.focus)) {
    assert.ok(f.visible, `${kind}: focus from script with no pointer before it is :focus-visible`);
    assert.deepEqual([f.style, f.width, f.color], ["solid", "2px", ink], `${kind}: the ring`);
  }
});

test("a toggle keeps its button's size without the line: its height at its size, a plain one as wide as unpressed, an icon alone square with its icon whole", async (t) => {
  const got = await run(t);
  if (!got) return;
  const near = (a: number, b: number) => Math.abs(a - b) < 0.5;
  for (const [set, kinds] of Object.entries(got.sets)) {
    for (const kind of ["ghost", "plain", "icon", "chip"]) {
      for (const o of kinds[kind]) {
        const s = o.rest;
        const h = s.size === "sm" ? 30 : 40;
        assert.ok(s.size, `${set} ${kind} "${o.text}": the fixture names its size`);
        assert.ok(near(s.h, h), `${set} ${kind} "${o.text}" (${s.size}): ${s.h}px tall, not ${h}`);
        if (kind === "icon") {
          assert.ok(near(s.w, h), `${set} icon toggle (${s.size}): ${s.w}px wide, not ${h}`);
          const i = s.size === "sm" ? 14 : 16;
          assert.ok(s.icon && near(s.icon[0], i) && near(s.icon[1], i), `${set} icon toggle (${s.size}): the icon ${s.icon} whole, not ${i}`);
        }
      }
    }
    kinds.plain.forEach((o, i) => {
      const was = kinds.unpressed[i];
      assert.equal(o.text, was.text);
      assert.ok(near(o.rest.w, was.rest.w), `${set} plain toggle "${o.text}": ${o.rest.w}px wide, ${was.rest.w}px unpressed`);
    });
  }
});

// The stylesheets: an outline on a switcher only for the keyboard or in forced colours, and a cue there for the chosen one.
const SHEETS = ["radio-group.css", "button.css", "switch.css", "lang-switch.css"];
const rules = (css: string) => {
  const found: { selector: string; body: string; forced: boolean }[] = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const walk = (s: string, forced: boolean) => {
    let i = 0;
    while (i < s.length) {
      const open = s.indexOf("{", i);
      if (open < 0) break;
      const prelude = s.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < s.length && depth) depth += s[j] === "{" ? 1 : s[j] === "}" ? -1 : 0, j++;
      const body = s.slice(open + 1, j - 1);
      if (prelude.startsWith("@")) walk(body, forced || /^@media\s*\(\s*forced-colors\s*:\s*active\s*\)$/.test(prelude));
      else found.push({ selector: prelude, body, forced });
      i = j;
    }
  };
  walk(text, false);
  return found;
};

// Selector branches at the top level (commas inside :is() and :not() stay in their branch).
const branches = (selector: string) => {
  const out: string[] = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < selector.length; i++) {
    if (selector[i] === "(") depth++;
    else if (selector[i] === ")") depth--;
    else if (selector[i] === "," && depth === 0) out.push(selector.slice(from, i).trim()), (from = i + 1);
  }
  return [...out, selector.slice(from).trim()];
};
const declarations = (body: string) =>
  body
    .split(";")
    .map((d) => d.match(/^\s*([\w-]+)\s*:\s*([\s\S]*?)\s*$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => [m[1], m[2]] as const);
const keyboardOnly = (branch: string) =>
  branch.includes(":focus-visible") &&
  !/:not\([^)]*:focus-visible/.test(branch) &&
  !/:focus(?!-visible)/.test(branch) &&
  !/:(is|where|matches)\([^()]*(:focus-visible[^()]*,|,[^()]*:focus-visible)/.test(branch);

test("in the stylesheets an outline on a switcher is the keyboard's (:focus-visible) or forced colours', and forced colours mark the chosen one where the fill would win", () => {
  for (const f of SHEETS) {
    const css = readFileSync(path.join(UI, f), "utf8");
    for (const r of rules(css)) {
      for (const [prop, value] of declarations(r.body)) {
        if (!/^outline(-style|-width)?$/.test(prop) || /^(0(px)?|none)\b/.test(value)) continue;
        if (r.forced) continue;
        for (const b of branches(r.selector)) assert.ok(keyboardOnly(b), `${f}: "${b}" draws an outline (${prop}: ${value}) that is not the keyboard's ring`);
      }
    }
    assert.ok(rules(css).some((r) => r.forced), `${f}: a forced-colours block`);
  }
  const forced = (f: string) => rules(readFileSync(path.join(UI, f), "utf8")).filter((r) => r.forced);
  const has = (f: string, test: (r: { selector: string; body: string }) => boolean, what: string) => assert.ok(forced(f).some(test), `${f}: ${what}`);
  has("radio-group.css", (r) => branches(r.selector).includes(":is(.s1-radios--cards, .s1-radios--segmented) .s1-radio:has(.s1-radio__input:checked)") && /background:\s*Highlight/.test(r.body) && /forced-color-adjust:\s*none/.test(r.body), "the chosen card or segment in Highlight, on the selector that fills it");
  has("radio-group.css", (r) => branches(r.selector).includes(".s1-radios--dots .s1-radio__label::after") && /background:\s*CanvasText/.test(r.body) && /forced-color-adjust:\s*none/.test(r.body), "a chosen word's dot in CanvasText");
  has("button.css", (r) => branches(r.selector).some((b) => b.includes('.s1-btn:is(') && b.endsWith('[aria-pressed="true"]')) && branches(r.selector).some((b) => b.includes('[aria-pressed="true"]:hover:not(:disabled)')) && /background:\s*Highlight/.test(r.body), "a pressed toggle in Highlight, under the pointer too, on the selectors that fill it");
  has("switch.css", (r) => branches(r.selector).includes(".s1-switch__input:checked + .s1-switch__track") && /background:\s*Highlight/.test(r.body), "an on track in Highlight");
  assert.ok(!forced("switch.css").some((r) => /display:\s*none/.test(r.body)), "switch.css: the track stays in forced colours");
  has("lang-switch.css", (r) => branches(r.selector).includes(".s1-lang__label::after") && /background:\s*CanvasText/.test(r.body), "the dot in CanvasText");
});
