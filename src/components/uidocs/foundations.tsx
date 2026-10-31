import { useState, useSyncExternalStore } from "react";
import { Kicker } from "@/components/bits";
import { useDark } from "@/hooks/useDark";
import { useMedia } from "@/hooks/useMedia";

/*
 * The live examples of the foundations: the tokens, type, grid, rules and
 * buttons of src/styles/site.css, drawn with the classes themselves, so what
 * is shown is what the site uses.
 */

const TOKENS = [
  { token: "--paper", tw: "bg-paper", light: "#f6f6f4", dark: "#0f0f0f", use: "The page." },
  { token: "--paper-2", tw: "bg-paper-2", light: "#ececea", dark: "#191919", use: "Plates, wells, code, hover." },
  { token: "--sumi", tw: "text-sumi", light: "#111111", dark: "#ededed", use: "The ink: text, marks, a pressed button." },
  { token: "--ink-2", tw: "text-ink-2", light: "#4d4d4d", dark: "#b3b3b3", use: "Second ink: deks, captions, labels." },
  { token: "--ink-3", tw: "text-ink-3", light: "#8a8a8a", dark: "#7a7a7a", use: "Third ink: hints, page numbers, leaders." },
  { token: "--rule", tw: "border-rule", light: "ink at 14%", dark: "ink at 14%", use: "Hairlines between items." },
  { token: "--rule-strong", tw: "var(--rule-strong)", light: "ink at 80%", dark: "ink at 80%", use: "Hairlines under labels; frames." },
];

/** Each token as a chip in the theme now showing, with both its values. */
export function Swatches() {
  return (
    <ul className="ud-swatches">
      {TOKENS.map((t) => (
        <li key={t.token} className="ud-swatch">
          <i style={{ background: `var(${t.token})` }} aria-hidden="true" />
          <b>{t.token}</b>
          <span>{t.tw}</span>
          <span>
            {t.light} · {t.dark}
          </span>
          <small>{t.use}</small>
        </li>
      ))}
    </ul>
  );
}

const FAMILIES = [
  { token: "--f-display", name: "Instrument Serif", sample: "Architecture, set like a magazine." },
  { token: "--f-sans", name: "Inter Tight", sample: "One gateway to every model." },
  { token: "--f-mono", name: "JetBrains Mono", sample: "VOL.30 · 2026 · 0123456789" },
  { token: "--f-mincho", name: "Shippori Mincho B1", sample: "設計 部品", ja: true },
  { token: "--f-gothic", name: "Zen Kaku Gothic New", sample: "夜 紙 随筆", ja: true },
];

/** The families, then the named styles that carry the scale. */
export function TypeScale() {
  return (
    <>
      <ul className="ud-type">
        {FAMILIES.map((f) => (
          <li key={f.token}>
            <p className="ud-type__spec">
              <b>{f.name}</b>
              var({f.token})
            </p>
            <p className="ud-type__sample" style={{ fontFamily: `var(${f.token})` }} lang={f.ja ? "ja" : undefined}>
              {f.sample}
            </p>
          </li>
        ))}
      </ul>
      <ul className="ud-type ud-type--scale">
        <li>
          <p className="ud-type__spec">
            <b>.display</b>serif 400, clamp(3rem, 8.4vw, 8.5rem) / 0.9
          </p>
          <p className="display ud-type__sample">
            Parts <em>of it.</em>
          </p>
        </li>
        <li>
          <p className="ud-type__spec">
            <b>.dek</b>serif 400, clamp(1.1rem, 0.6vw + 1rem, 1.4rem) / 1.45, ink-2
          </p>
          <p className="dek ud-type__sample">A paragraph set large under a headline, in the display serif.</p>
        </li>
        <li>
          <p className="ud-type__spec">
            <b>body</b>sans 400, clamp(16px, 0.35vw + 15px, 18px) / 1.6
          </p>
          <p className="ud-type__sample">Body text in Inter Tight, at least 16px, on a line and a bit more.</p>
        </li>
        <li>
          <p className="ud-type__spec">
            <b>.kicker</b>mono 500, 11px, 0.14em, caps; mincho 13px
          </p>
          <div className="ud-type__sample">
            <Kicker ja="部品">Kicker · over a heading</Kicker>
          </div>
        </li>
        <li>
          <p className="ud-type__spec">
            <b>.mono</b>mono, 0.72rem, 0.08em, caps, tabular figures
          </p>
          <p className="mono ud-type__sample">Labels · 2026.10.31 · 1,234</p>
        </li>
        <li>
          <p className="ud-type__spec">
            <b>figcaption, .cap</b>mono 400, 11px / 1.55, ink-2
          </p>
          <p className="cap ud-type__sample">A caption under a figure, in small mono.</p>
        </li>
      </ul>
    </>
  );
}

/** Twelve columns, numbered, and the two splits the spreads use most. */
export function GridDemo() {
  return (
    <div className="ud-griddemo">
      <div className="grid ud-cols" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
      <div className="grid ud-spans">
        <span style={{ gridColumn: "1 / span 5" }}>1 / span 5</span>
        <span style={{ gridColumn: "7 / span 6" }}>7 / span 6</span>
      </div>
      <div className="grid ud-spans">
        <span style={{ gridColumn: "1 / span 7" }}>1 / span 7</span>
        <span style={{ gridColumn: "9 / span 4" }}>9 / span 4</span>
      </div>
      <p className="cap">
        Contents and foreword (5 + 6), blog intro and aside (7 + 4). This page is set the same way: its index on 1 / span 3,
        the parts on 4 / span 9; both fold to 1 / -1 at 900px.
      </p>
    </div>
  );
}

const RULES = [
  { style: "0.5px solid var(--rule)", use: "Between items" },
  { style: "0.5px solid var(--rule-strong)", use: "Under a label, round a box" },
  { style: "1px dotted var(--ink-3)", use: "The contents' leader" },
  { style: "0.5px dashed var(--rule-strong)", use: "Not there yet, or held elsewhere" },
  { style: "2px solid var(--sumi)", use: "A feature's opening rule" },
];

/** The rules in use, then a box with registration marks. */
export function RulesDemo() {
  return (
    <>
      <ul className="ud-rules">
        {RULES.map((r) => (
          <li key={r.style}>
            <i style={{ borderTop: r.style }} aria-hidden="true" />
            <span>
              <code>{r.style}</code> {r.use}
            </span>
          </li>
        ))}
      </ul>
      <div className="ud-corner-box">
        <p className="mono">--corners</p>
        <p>A box with a &ldquo;+&rdquo; at each corner, in its own ink. This page is a spread: see the hairlines either side of the column, and the marks where they cross its top rule.</p>
      </div>
    </>
  );
}

/** The house buttons, each in the parent class that styles it. Pressing one only says so here. */
export function ButtonsDemo() {
  const [mode, setMode] = useState<"ride" | "guess">("ride");
  const [page, setPage] = useState(1);
  const [pick, setPick] = useState(0);
  const [last, setLast] = useState("");
  return (
    <div className="ud-buttons">
      <div className="ud-buttons__row">
        <div className="m2l-bar">
          <div className="m2l-bar__group" role="group" aria-label="Mode">
            <button type="button" aria-pressed={mode === "ride"} onClick={() => setMode("ride")}>
              Ride
            </button>
            <button type="button" aria-pressed={mode === "guess"} onClick={() => setMode("guess")}>
              Guess the city
            </button>
          </div>
        </div>
        <p className="cap">
          <code>.m2l-bar button</code>: toggles in a group, pressed in reverse. The most general.
        </p>
      </div>
      <div className="ud-buttons__row">
        <div className="bl-nav">
          <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ←
          </button>
          <p>
            Page <b>{page}</b> of 3<span>as in Brick Locator</span>
          </p>
          <button type="button" aria-label="Next page" disabled={page === 3} onClick={() => setPage((p) => p + 1)}>
            →
          </button>
        </div>
        <p className="cap">
          <code>.bl-nav button</code>, and the slider&rsquo;s <code>.ws-slider__nav button</code>: step through, faint when there is no further.
        </p>
      </div>
      <div className="ud-buttons__row">
        <p className="closing__pick mono" role="group" aria-label="Choose a plate">
          {["Alpine dawn", "Tokyo rain"].map((p, i) => (
            <button key={p} type="button" aria-pressed={i === pick} onClick={() => setPick(i)}>
              {p}
            </button>
          ))}
        </p>
        <p className="cap">
          <code>.closing__pick button</code>: words that choose, the chosen one underlined.
        </p>
      </div>
      <div className="ud-buttons__row">
        <div className="soc ud-soc">
          <div className="soc__row">
            <button type="button" className="soc__btn" onClick={() => setLast("Load more")}>
              Load more
            </button>
            <button type="button" className="soc__btn soc__btn--go" onClick={() => setLast("Post")}>
              Post
            </button>
          </div>
        </div>
        <p className="cap" aria-live="polite">
          <code>.soc__btn</code>, <code>.soc__btn--go</code>: the social parts&rsquo; own, in the primaries. {last && `Pressed ${last}: nothing is sent from this page.`}
        </p>
      </div>
    </div>
  );
}

/* The theme attribute itself, as the page has it now. */
function subscribeTheme(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

/** What the theme and motion settings are on this page, right now. */
export function MotionDemo() {
  const dark = useDark();
  const still = useMedia("(prefers-reduced-motion: reduce)");
  const attr = useSyncExternalStore(subscribeTheme, () => document.documentElement.dataset.theme ?? "", () => "");
  return (
    <>
      <dl className="ud-readout">
        <dt>&lt;html data-theme&gt;</dt>
        <dd>{attr ? `"${attr}"` : "not set: following the system"}</dd>
        <dt>useDark()</dt>
        <dd>{String(dark)}</dd>
        <dt>prefers-reduced-motion</dt>
        <dd>{still ? "reduce: nothing moves" : "no preference"}</dd>
      </dl>
      <p className="sect-label ud-drawn">
        <span lang="ja">線</span> A label whose rule draws in as it scrolls into view
      </p>
      <p className="cap">Flip the theme with 夜 / 紙 in the running head and watch every example on this page turn with it.</p>
    </>
  );
}
