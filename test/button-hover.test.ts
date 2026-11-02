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
 * Under the pointer a button turns over (owner, 2026-11-02: "the button hovering should have color flipping, right now
 * there is no hovering effect on all buttons"): every variant of Button, in a real browser with React running, on
 * paper, at night and in a brand theme (the apps' jade chosen fill and accent). go turns from the ink to the paper,
 * its words to the ink; plain, icon, ghost and chip fill with the ink, their words in the paper; link fills its box
 * and 6px either side with the ink. The words AA on their ground at rest and under the pointer; the icon turns with
 * the words. What must not turn: a disabled button, a <span> drawn as a chip, and a toggle (aria-pressed), which
 * keeps the switchers' rules. The keyboard's ring stays under the pointer. The pointer is the page's own: each
 * :hover rule is copied as a .s1-hover rule in the same layer and @media (as test/switchers.test.ts does). Then,
 * from the stylesheets, the transition only where motion is welcome and the turn in the system's colours in forced
 * colours. Skipped where there is no Chrome: set CHROME to one.
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

const out = mkdtempSync(path.join(tmpdir(), "s1lin-button-hover-"));
after(() => rmSync(out, { recursive: true, force: true }));

const part = (f: string) => JSON.stringify(path.join(UI, f));
const ENTRY = `
// a page error is printed in place of the findings, so the test says what it was
window.addEventListener("error", (e) => { document.getElementById("out").textContent = JSON.stringify({ pageError: String(e.error?.stack ?? e.message) }); });
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Button, buttonClass } from ${part("button.tsx")};
import { Copy } from ${part("copy.tsx")};
import { Input } from ${part("input.tsx")};

const Mark = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M2 8h12M8 2v12" /></svg>;

// data-k names the case, data-turns what it does under the pointer: "ink" (the ink fill, the paper words), "paper"
// (the paper fill, the ink words), "still" (nothing changes), "tint" and "chosen" (a toggle's two switcher rules).
function Set({ id, theme, style }) {
  return (
    <div id={id} data-theme={theme} style={{ background: "var(--s1-paper)", color: "var(--s1-ink)", padding: 8, display: "flex", flexWrap: "wrap", gap: 12, ...style }}>
      <Button data-k="go" data-turns="paper" variant="go" icon={<Mark />}>Create key</Button>
      <Button data-k="go sm" data-turns="paper" variant="go" size="sm">Send</Button>
      <Button data-k="go link" data-turns="paper" variant="go" href="#go">Start</Button>
      <Button data-k="plain" data-turns="ink" icon={<Mark />}>Edit</Button>
      <Button data-k="plain sm" data-turns="ink" size="sm">Cancel</Button>
      <Button data-k="plain link" data-turns="ink" href="#plain">Open</Button>
      <Button data-k="ghost" data-turns="ink" variant="ghost" icon={<Mark />}>Refresh</Button>
      <Button data-k="ghost sm" data-turns="ink" variant="ghost" size="sm">刷新</Button>
      <Button data-k="icon" data-turns="ink" variant="icon" icon={<Mark />} aria-label="Download" />
      <Button data-k="icon sm" data-turns="ink" variant="icon" size="sm" icon={<Mark />} aria-label="Download" />
      <Button data-k="ghost icon" data-turns="ink" variant="ghost" size="sm" icon={<Mark />} aria-label="Dark mode" />
      <Button data-k="chip" data-turns="ink" variant="chip" iconEnd={<Mark />}>qwen-3.8</Button>
      <Button data-k="chip sm" data-turns="ink" variant="chip" size="sm">模型</Button>
      <Button data-k="chip open" data-turns="ink" variant="chip" aria-expanded={true}>Open menu</Button>
      <Button data-k="link" data-turns="ink" variant="link" href="#docs" iconEnd={<Mark />}>Docs</Button>
      <Button data-k="link sm" data-turns="ink" variant="link" size="sm">Sign out</Button>
      <span data-k="copy" data-turns="ink"><Copy value="sk-1" label="key" /></span>
      <span data-k="input action" data-turns="ink"><Input aria-label="Coupon" action={<Button icon={<Mark />}>Apply</Button>} /></span>
      <Button data-k="plain disabled" data-turns="still" disabled>Save</Button>
      <Button data-k="go disabled" data-turns="still" variant="go" disabled>Send</Button>
      <Button data-k="ghost disabled" data-turns="still" variant="ghost" disabled>Refresh</Button>
      <Button data-k="icon disabled" data-turns="still" variant="icon" icon={<Mark />} aria-label="Pin" disabled />
      <Button data-k="link disabled" data-turns="still" variant="link" aria-disabled="true" href="#none">Gone</Button>
      <span data-k="span chip" data-turns="still" className={buttonClass({ variant: "chip" })}>a span, as a chip</span>
      <span data-k="input action disabled" data-turns="still"><Input aria-label="Amount" action={<Button aria-disabled="true">Max</Button>} /></span>
      <span data-k="input action span" data-turns="still"><Input aria-label="Unit" action={<span className={buttonClass({ variant: "ghost" })}>USD</span>} /></span>
      <Button data-k="toggle off" data-turns="tint" variant="ghost" size="sm" aria-pressed={false}>List</Button>
      <Button data-k="toggle on" data-turns="chosen" variant="ghost" size="sm" aria-pressed={true}>Grid</Button>
      <Button data-k="plain toggle off" data-turns="tint" aria-pressed={false}>Sound</Button>
      <Button data-k="chip toggle on" data-turns="chosen" variant="chip" aria-pressed={true}>All</Button>
      <Button data-k="chip toggle off" data-turns="tint" variant="chip" aria-pressed={false}>OpenAI</Button>
    </div>
  );
}

flushSync(() =>
  createRoot(document.getElementById("app")).render(
    <>
      <Set id="light" theme="light" />
      <Set id="dark" theme="dark" />
      <Set id="brand" theme="light" style={{ "--s1-chosen": "#0f7a6c", "--s1-on-chosen": "#f6f6f4", "--s1-accent": "#0f7a6c" }} />
    </>,
  ),
);

// Each :hover rule again as a .s1-hover rule, and each :focus-visible rule as a .s1-focus rule (the keyboard's focus
// without the page needing the window's focus), in the same layer and @media, right after it.
const unsupported = [];
const hoverize = (rules) => {
  for (let i = rules.length - 1; i >= 0; i--) {
    const r = rules[i];
    if (r instanceof CSSStyleRule) {
      if (/:not\\([^)]*:(hover|focus-visible)/.test(r.selectorText)) unsupported.push(r.selectorText);
      if (/:hover|:focus-visible/.test(r.selectorText)) {
        const as = r.selectorText.replaceAll(":hover", ".s1-hover").replaceAll(":focus-visible", ".s1-focus");
        (r.parentRule ?? r.parentStyleSheet).insertRule(as + r.cssText.slice(r.selectorText.length), i + 1);
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
const look = (el) => {
  const s = getComputedStyle(el);
  const svg = el.querySelector("svg");
  return {
    bg: s.backgroundColor, color: s.color, border: s.borderTopColor, borderWidth: s.borderTopWidth, shadow: s.boxShadow,
    outline: [s.outlineStyle, s.outlineWidth, s.outlineColor].join(" "), opacity: s.opacity, transition: s.transitionDuration,
    icon: svg ? getComputedStyle(svg).color : null,
  };
};
// The button a case is: the element itself, or the one inside its wrapper (Copy, an Input's action).
const button = (el) => (el.matches(".s1-btn") ? el : el.querySelector(".s1-btn"));

const got = { sets: {}, tokens: {} };
for (const id of ["light", "dark", "brand"]) {
  const set = document.getElementById(id);
  got.tokens[id] = { ink: token("--s1-ink", set), paper: token("--s1-paper", set), paper2: token("--s1-paper-2", set), chosen: rgb(getComputedStyle(set).getPropertyValue("--s1-chosen").trim() || getComputedStyle(set).getPropertyValue("--s1-ink").trim(), set) };
  got.sets[id] = [...set.querySelectorAll("[data-k]")].map((el) => {
    const b = button(el);
    const rest = look(b);
    hover(b.querySelector(".s1-btn__icon") ?? b);
    const hovered = look(b);
    // the keyboard's ring under the pointer
    let ring = null;
    if (b.matches("button:not(:disabled), a[href]")) { b.classList.add("s1-focus"); ring = look(b); b.classList.remove("s1-focus"); }
    leave();
    return { k: el.dataset.k, turns: el.dataset.turns, tag: b.tagName, rest, hovered, ring };
  });
}
got.unsupported = unsupported;
document.getElementById("out").textContent = JSON.stringify(got);
`;

// rgb(r g b [/ a]) or rgba(...) in 0–255; color(srgb r g b [/ a]) in 0–1. Any alpha under 1 is refused: the contrast
// of a colour seen through is not its own (a clear ground is read as the paper under it, before this is called).
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

type Look = { bg: string; color: string; border: string; borderWidth: string; shadow: string; outline: string; opacity: string; transition: string; icon: string | null };
type Case = { k: string; turns: "ink" | "paper" | "still" | "tint" | "chosen"; tag: string; rest: Look; hovered: Look; ring: Look | null };
type Got = {
  sets: Record<string, Case[]>;
  tokens: Record<string, { ink: string; paper: string; paper2: string; chosen: string }>;
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

// The ground under a button: its own fill, or the set's paper through a clear one.
const ground = (l: Look, paper: string) => (l.bg === CLEAR ? paper : l.bg);
const KINDS = ["go", "go sm", "go link", "plain", "plain sm", "plain link", "ghost", "ghost sm", "icon", "icon sm", "ghost icon", "chip", "chip sm", "chip open", "link", "link sm", "copy", "input action"];

test("every variant turns over under the pointer: go to the paper with the ink words, the others to the ink with the paper words, AA both ways, the icon with them", async (t) => {
  const got = await run(t);
  if (!got) return;
  assert.deepEqual(got.unsupported, [], "no :not(:hover) rule, which the pointer's copy could not stand for");
  for (const [set, cases] of Object.entries(got.sets)) {
    const tk = got.tokens[set];
    assert.deepEqual(cases.filter((c) => c.turns === "ink" || c.turns === "paper").map((c) => c.k), KINDS, `${set}: every variant was drawn`);
    for (const c of cases.filter((x) => x.turns === "ink" || x.turns === "paper")) {
      const where = `${set} ${c.k}`;
      const [fill, words] = c.turns === "paper" ? [tk.paper, tk.ink] : [tk.ink, tk.paper];
      assert.deepEqual([c.hovered.bg, c.hovered.color], [fill, words], `${where}: under the pointer, ${c.turns === "paper" ? "the paper with the ink words" : "the ink with the paper words"}`);
      assert.notEqual(ground(c.rest, tk.paper), fill, `${where}: at rest it is not already ${c.turns === "paper" ? "the paper" : "the ink"} (it turns)`);
      assert.notEqual(c.rest.color, words, `${where}: its words change colour`);
      assert.ok(contrast(c.rest.color, ground(c.rest, tk.paper)) >= 4.5, `${where}: its words at rest, ${contrast(c.rest.color, ground(c.rest, tk.paper)).toFixed(2)}:1`);
      assert.ok(contrast(c.hovered.color, c.hovered.bg) >= 4.5, `${where}: its words under the pointer, ${contrast(c.hovered.color, c.hovered.bg).toFixed(2)}:1`);
      assert.equal(c.hovered.opacity, "1", `${where}: not faded under the pointer`);
      if (c.rest.icon) assert.deepEqual([c.rest.icon, c.hovered.icon], [c.rest.color, c.hovered.color], `${where}: the icon in the words' colour, at rest and under the pointer`);
      // a box with a line keeps it, in the ink (the fill's own colour, or round the paper box go turns to): whole, one size
      if (parseFloat(c.rest.borderWidth) > 0 && c.rest.border !== CLEAR) assert.equal(c.hovered.border, tk.ink, `${where}: its line in the ink under the pointer`);
      assert.equal(c.hovered.borderWidth, c.rest.borderWidth, `${where}: the line keeps its width`);
    }
  }
});

test("go keeps its accent shadow under the pointer; link fills 6px either side of its words; nothing else casts one", async (t) => {
  const got = await run(t);
  if (!got) return;
  for (const [set, cases] of Object.entries(got.sets)) {
    const tk = got.tokens[set];
    const accent = set === "brand" ? "rgb(15, 122, 108)" : null;
    for (const c of cases.filter((x) => x.turns === "ink" || x.turns === "paper")) {
      const where = `${set} ${c.k}`;
      if (c.k.startsWith("go")) {
        assert.equal(c.hovered.shadow, c.rest.shadow, `${where}: the shadow kept`);
        if (accent) assert.ok(c.hovered.shadow.startsWith(accent), `${where}: the brand's accent shadow, ${c.hovered.shadow}`);
      } else if (c.k.startsWith("link")) {
        assert.equal(c.hovered.shadow, `${tk.ink} -6px 0px 0px 0px, ${tk.ink} 6px 0px 0px 0px`, `${where}: the ink 6px either side`);
      } else if (c.k !== "input action") assert.equal(c.hovered.shadow, "none", `${where}: no shadow under the pointer`);
    }
  }
});

test("what must not turn: a disabled button, a <span> drawn as a chip; a toggle keeps the switchers' rules", async (t) => {
  const got = await run(t);
  if (!got) return;
  for (const [set, cases] of Object.entries(got.sets)) {
    const tk = got.tokens[set];
    for (const c of cases) {
      const where = `${set} ${c.k}`;
      if (c.turns === "still") {
        assert.deepEqual([c.hovered.bg, c.hovered.color, c.hovered.border, c.hovered.shadow], [c.rest.bg, c.rest.color, c.rest.border, c.rest.shadow], `${where}: the same under the pointer`);
      } else if (c.turns === "tint") {
        assert.equal(c.rest.bg, CLEAR, `${where}: a toggle not pressed has no fill`);
        assert.deepEqual([c.hovered.bg, c.hovered.color], [tk.paper2, tk.ink], `${where}: the second paper under the pointer, the words in the ink (not the turn, which would look pressed)`);
      } else if (c.turns === "chosen") {
        for (const s of [c.rest, c.hovered]) assert.equal(s.bg, tk.chosen, `${where}: the chosen fill, at rest and under the pointer`);
        assert.ok(contrast(c.hovered.color, c.hovered.bg) >= 4.5, `${where}: its words on the fill under the pointer`);
      }
    }
  }
});

test("the keyboard's ring stays under the pointer: 2px, solid, in the ink, outside the turned box", async (t) => {
  const got = await run(t);
  if (!got) return;
  for (const [set, cases] of Object.entries(got.sets)) {
    const tk = got.tokens[set];
    for (const c of cases.filter((x) => x.ring && x.turns !== "still")) {
      assert.equal(c.ring!.outline, `solid 2px ${tk.ink}`, `${set} ${c.k}: the ring under the pointer`);
    }
  }
});

// The stylesheets: the colours ease only where motion is welcome; forced colours turn in the system's colours.
const rules = (css: string) => {
  const found: { selector: string; body: string; media: string[] }[] = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const walk = (s: string, media: string[]) => {
    let i = 0;
    while (i < s.length) {
      const open = s.indexOf("{", i);
      if (open < 0) break;
      const prelude = s.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < s.length && depth) depth += s[j] === "{" ? 1 : s[j] === "}" ? -1 : 0, j++;
      const body = s.slice(open + 1, j - 1);
      if (prelude.startsWith("@")) walk(body, [...media, prelude]);
      else found.push({ selector: prelude, body, media });
      i = j;
    }
  };
  walk(text, []);
  return found;
};

test("in the stylesheets: a transition only under prefers-reduced-motion: no-preference; under the pointer in forced colours, ButtonText behind ButtonFace", () => {
  for (const f of ["button.css", "input.css"]) {
    const all = rules(readFileSync(path.join(UI, f), "utf8"));
    for (const r of all) {
      if (!/(^|;)\s*transition(-duration|-property)?\s*:/.test(r.body)) continue;
      assert.ok(r.media.some((m) => /prefers-reduced-motion\s*:\s*no-preference/.test(m)), `${f}: "${r.selector}" eases outside @media (prefers-reduced-motion: no-preference)`);
    }
    const forced = all.filter((r) => r.media.some((m) => /forced-colors\s*:\s*active/.test(m)) && r.selector.includes(":hover") && !r.selector.includes("aria-pressed=\"true\"]"));
    assert.ok(forced.some((r) => /background(-color)?:\s*ButtonText/.test(r.body) && /(^|;)\s*color:\s*ButtonFace/.test(r.body)), `${f}: a button under the pointer turns in the system's colours in forced colours`);
  }
  const button = rules(readFileSync(path.join(UI, "button.css"), "utf8"));
  assert.ok(button.some((r) => r.media.some((m) => /no-preference/.test(m)) && /transition:[^;]*background-color 120ms/.test(r.body)), "button.css: the colours ease over 120ms where motion is welcome");
});
