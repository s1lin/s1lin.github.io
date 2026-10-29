import { useEffect, useRef, useState, type PointerEvent } from "react";
import tokens from "@/content/tokens.json";
import { useMedia } from "@/hooks/useMedia";
import { useNear } from "@/hooks/useNear";
import { DAY, MONTHS, long, short, thousands } from "@/lib/calendar";

/*
 * The editor's tokens with coding agents, under the GitHub heatmap: the total
 * and its value at API list prices, a skyline from the first week there was
 * any (a week to a building, stacked by agent), and three rings for the
 * shares. scripts/token-data.py counts it all from cc-switch into
 * src/content/tokens.json. Each agent keeps its own colour everywhere
 * (agent-claude and so on, in site.css) and is always named beside its marks.
 */

type Tokens = {
  fetched: string;
  machines: number;
  apps: string[];
  total: number;
  byApp: Record<string, number>;
  usd: number;
  usdByApp: Record<string, number>;
  parts: { input: number; output: number; cacheRead: number; cacheWrite: number };
  since: string | null;
  days: [string, number[], number[]][];
};
// JSON imports type its rows as loose arrays; scripts/token-data.py writes them as this shape.
const T = tokens as unknown as Tokens;

const NAMES: Record<string, string> = { claude: "Claude", codex: "Codex", pi: "Pi", gemini: "Gemini", opencode: "OpenCode" };
const named = (app: string) => NAMES[app] ?? app;
/** The agent's colour class; an agent with no colour of its own is drawn in ink. */
const hue = (app: string) => (["claude", "codex", "pi"].includes(app) ? `agent-${app}` : "agent-other");
const MACHINES = ["no machines", "one machine", "my two machines", "my three machines"][T.machines] ?? `${T.machines} machines`;

/** 47,944,236,992 → "47.9B". */
const compact = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${Math.round(n)}`;
const dollars = (n: number) => (n >= 1e4 ? `$${(n / 1e3).toFixed(1)}K` : `$${Math.round(n).toLocaleString("en-US")}`);
const percent = (part: number, whole: number) => {
  const p = (100 * part) / whole;
  return p >= 10 ? `${Math.round(p)}%` : p >= 0.1 ? `${p.toFixed(1)}%` : "<0.1%";
};
/** 47,944,236,992 → "47.9 billion"; 484,325,000 → "484 million". */
const spelt = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} billion` : `${Math.round(n / 1e6)} million`);
/** 7.86 → "7.9 times"; 11.2 → "11 times". */
const times = (r: number) => `${r >= 10 ? Math.round(r) : r.toFixed(1)} times`;

// ---------------------------------------------------------------- why it is a lot

/*
 * Anthropic's yardstick, from its Claude Code cost guide: across enterprise
 * deployments, about $13 per developer per active day, and under $30 for nine
 * in ten. Both it and cc-switch price tokens at list price.
 */
const COSTS = "https://code.claude.com/docs/en/costs";
const TYPICAL_DAY = 13;
const NINE_IN_TEN = 30;
const CLAUDE = T.apps.indexOf("claude");
const CLAUDE_DAYS = CLAUDE < 0 ? [] : T.days.filter(([, n]) => n[CLAUDE] > 0);
const CLAUDE_PER_DAY = CLAUDE_DAYS.reduce((a, [, , usd]) => a + usd[CLAUDE], 0) / Math.max(1, CLAUDE_DAYS.length);
const PER_DAY = T.total / Math.max(1, T.days.length);
// What the agents wrote back, as one person typing it: a token is about three-quarters of a
// word, typed at 40 words a minute, six hours a day, 230 days a year.
const TYPING_YEARS = Math.round((T.parts.output * 0.75) / (40 * 60 * 6 * 230));

// ---------------------------------------------------------------- the skyline's weeks

const FIRST = Date.parse(T.since ?? T.fetched);
const START = FIRST - new Date(FIRST).getUTCDay() * DAY; // the Sunday on or before the first day
const LAST = Date.parse(T.days.at(-1)?.[0] ?? T.fetched);
const WEEKS = Math.floor((LAST - START) / (7 * DAY)) + 1;
const WEEK = Array.from({ length: WEEKS }, () => ({ tokens: T.apps.map(() => 0), usd: 0 }));
for (const [day, counts, usd] of T.days) {
  const w = WEEK[Math.floor((Date.parse(day) - START) / (7 * DAY))];
  counts.forEach((c, k) => (w.tokens[k] += c));
  w.usd += usd.reduce((a, b) => a + b, 0);
}
const SUM = WEEK.map((w) => w.tokens.reduce((a, b) => a + b, 0));
const TALLEST = Math.max(1, ...SUM);
const PEAK = SUM.indexOf(TALLEST);
const weekStart = (w: number) => new Date(START + w * 7 * DAY);

const W = 556; // as wide as the heatmap's drawing, so the two read at one scale
const LEFT = 26; // the heatmap's grid starts here too
const STEP = (W - LEFT) / WEEKS;
const BAR = Math.min(24, Math.round(STEP * 0.72));
const SKY = 76; // the tallest building
const ROOF = 14; // room over it for its figure
const GROUND = ROOF + SKY;
const H = GROUND + 18; // and under the ground, the months
const xOf = (w: number) => LEFT + w * STEP + (STEP - BAR) / 2;
const height = (n: number) => (n / TALLEST) * SKY;

/** Each month's name under the first week that starts in it (the first week, under the first day's month). */
const MONTH_MARKS = WEEK.flatMap((_, w) => {
  const month = (w === 0 ? new Date(FIRST) : weekStart(w)).getUTCMonth();
  return w === 0 || month !== weekStart(w - 1).getUTCMonth() ? [{ w, label: MONTHS[month].slice(0, 3).toUpperCase() }] : [];
});

const BUILDINGS = (
  <g>
    {SUM.map((total, w) => {
      if (!total) return null;
      let top = GROUND;
      return (
        <g key={w}>
          {WEEK[w].tokens.map((n, k) => {
            if (!n) return null;
            const h = height(n);
            top -= h;
            // a hairline of paper between one agent's floors and the next
            return <rect key={k} className={hue(T.apps[k])} x={xOf(w)} y={top + (h > 2 ? 1 : 0)} width={BAR} height={h > 2 ? h - 1 : h} />;
          })}
          <rect className="sky-windows" x={xOf(w)} y={GROUND - height(total)} width={BAR} height={height(total)} />
        </g>
      );
    })}
    <text className="sky-peak" x={xOf(PEAK) + BAR / 2} y={GROUND - height(TALLEST) - 4}>
      {compact(TALLEST)}
    </text>
    <line className="sky-ground" x1={LEFT} x2={W} y1={GROUND + 0.5} y2={GROUND + 0.5} />
    {MONTH_MARKS.map(({ w, label }) => (
      <text key={w} className="sky-month" x={xOf(w)} y={GROUND + 13}>
        {label}
      </text>
    ))}
  </g>
);

// ---------------------------------------------------------------- the rings

type Slice = { label: string; value: number; cls: string };

/** A slice of a ring from a to b, in turns from twelve o'clock, clockwise. */
function arc(a: number, b: number, r = 42, inner = 27) {
  const pt = (t: number, rad: number) => [50 + rad * Math.sin(2 * Math.PI * t), 50 - rad * Math.cos(2 * Math.PI * t)];
  const big = b - a > 0.5 ? 1 : 0;
  const [x0, y0] = pt(a, r);
  const [x1, y1] = pt(b, r);
  const [x2, y2] = pt(b, inner);
  const [x3, y3] = pt(a, inner);
  return `M${x0} ${y0} A${r} ${r} 0 ${big} 1 ${x1} ${y1} L${x2} ${y2} A${inner} ${inner} 0 ${big} 0 ${x3} ${y3} Z`;
}

/** Shares of a whole as a ring, the whole in its middle, every slice named beside it. */
function Ring({ title, slices, middle, format }: { title: string; slices: Slice[]; middle: string; format: (n: number) => string }) {
  const whole = slices.reduce((a, s) => a + s.value, 0) || 1;
  let at = 0;
  return (
    <div className="pie">
      <p className="pie__title mono">{title}</p>
      <svg viewBox="0 0 100 100" role="img" aria-label={`${title}: ${slices.map((s) => `${s.label} ${percent(s.value, whole)}`).join(", ")}`}>
        {slices.map((s) => {
          const from = at;
          at += s.value / whole;
          // A whole ring cannot be one arc; a lone slice is drawn as two halves.
          const d = at - from >= 0.9999 ? `${arc(0, 0.5)} ${arc(0.5, 0.9999)}` : arc(from, at);
          return s.value > 0 ? (
            <path key={s.label} className={`pie__slice ${s.cls}`} d={d}>
              <title>{`${s.label}: ${format(s.value)}, ${percent(s.value, whole)}`}</title>
            </path>
          ) : null;
        })}
        <text className="pie__middle" x="50" y="53.5">
          {middle}
        </text>
      </svg>
      <ul className="pie__key mono">
        {slices.map((s) => (
          <li key={s.label}>
            <i className={s.cls} />
            <span>{s.label}</span>
            <b>{percent(s.value, whole)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

const BY_AGENT = T.apps.map((a) => ({ label: named(a), value: T.byApp[a], cls: hue(a) }));
const VALUE_BY_AGENT = T.apps.map((a) => ({ label: named(a), value: T.usdByApp[a] ?? 0, cls: hue(a) }));
const BY_KIND: Slice[] = [
  // Cache reads are the point of this pie, so they alone take a colour; the rest stay in ink.
  { label: "Cache reads", value: T.parts.cacheRead, cls: "kind-cache" },
  { label: "Fresh input", value: T.parts.input, cls: "kind-input" },
  { label: "Cache writes", value: T.parts.cacheWrite, cls: "kind-write" },
  { label: "Output", value: T.parts.output, cls: "kind-output" },
];

// ---------------------------------------------------------------- the total

/** The total, rolling up from zeros the first time it comes into view; leading zeros stay faint. */
function Odometer({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const near = useNear(ref, "0px");
  const still = useMedia("(prefers-reduced-motion: reduce)");
  const [shown, setShown] = useState(value);
  const rolled = useRef(false);

  useEffect(() => {
    if (!near || still || rolled.current) return;
    rolled.current = true;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      // A frame's timestamp can fall just before the start; never roll below zero.
      const p = Math.min(1, Math.max(0, (now - start) / 1600));
      setShown(Math.round(value * (1 - (1 - p) ** 4)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [near, still, value]);

  const width = String(value).length;
  const digits = String(shown).padStart(width, "0");
  const lead = digits.length - String(shown).length;
  return (
    <span ref={ref} className="tokens__n" aria-label={thousands(value)}>
      {[...digits].map((d, i) => (
        <span key={i} aria-hidden="true">
          {i > 0 && (width - i) % 3 === 0 && <span className={i <= lead ? "tokens__lead" : undefined}>,</span>}
          <span className={i < lead ? "tokens__lead" : undefined}>{d}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * Tokens with coding agents: the total and what it is worth, the weeks as a
 * skyline, and the shares as rings. The line under the skyline reads out the
 * week the pointer is on.
 */
export function TokenSkyline() {
  const [at, setAt] = useState<number | null>(null);

  function pick(e: PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const w = Math.floor((((e.clientX - box.left) * W) / box.width - LEFT) / STEP);
    setAt(w >= 0 && w < WEEKS && SUM[w] > 0 ? w : null);
  }

  const since = T.since ? long(new Date(T.since)) : "the start";
  return (
    <figure className="tokens">
      <h3 className="sect-label">
        <span lang="ja">楼</span> With agents
      </h3>
      <p className="tokens__total">
        <Odometer value={T.total} />
        <span className="tokens__unit mono">tokens</span>
      </p>
      <p className="tokens__usd">
        <span className="tokens__money">${Math.round(T.usd).toLocaleString("en-US")}</span>
        <span className="tokens__unit mono">at API list prices</span>
      </p>

      {/* Why the number matters: it is the measure of the crew, and so of the architect's job. */}
      <div className="corollary">
        <p className="corollary__claim">
          <b>Corollary.</b>A crew does the building; the drawing is mine.
        </p>
        <p className="corollary__proof">
          <i>Proof.</i> Since {MONTHS[new Date(FIRST).getUTCMonth()]}, coding agents have worked through {spelt(T.total)}{" "}
          tokens on my plans, {spelt(PER_DAY)} on an average working day.
          {CLAUDE_DAYS.length > 0 && (
            <>
              {" "}
              <a href={COSTS}>Anthropic puts</a> a typical Claude Code developer at about ${TYPICAL_DAY} an active day,
              with nine in ten under ${NINE_IN_TEN}. My Claude alone came to ${Math.round(CLAUDE_PER_DAY)} a day at the same
              list prices: {times(CLAUDE_PER_DAY / TYPICAL_DAY)} the average, and {times(CLAUDE_PER_DAY / NINE_IN_TEN)} the
              line nine in ten stay under.
            </>
          )}{" "}
          What the agents wrote back, {spelt(T.parts.output)} tokens of code, commands and reasoning, would keep one person
          typing six hours a day for {TYPING_YEARS} years. Nobody types that much, or reads all of it. Someone has to decide
          what it is for.
          <span className="qed" aria-label="end of proof">
            ∎
          </span>
        </p>
      </div>

      <svg
        className="tokens__sky"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby="sky-t"
        onPointerMove={pick}
        onPointerDown={pick}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setAt(null);
        }}
      >
        <title id="sky-t">{`${thousands(T.total)} tokens with coding agents since ${since}, a building a week: ${BY_AGENT.map((s) => `${s.label} ${compact(s.value)}`).join(", ")}. The busiest week, from ${long(weekStart(PEAK))}, used ${compact(TALLEST)}.`}</title>
        <defs>
          <pattern id="sky-lit" width="3" height="4" patternUnits="userSpaceOnUse">
            <rect x="1" y="1.5" width="1" height="1.4" />
          </pattern>
        </defs>
        {BUILDINGS}
        {at !== null && (
          <rect className="tokens__at" x={xOf(at) - 1.5} y={GROUND - height(SUM[at]) - 1.5} width={BAR + 3} height={height(SUM[at]) + 1.5} />
        )}
      </svg>
      <div className="tokens__foot mono">
        <p>
          {at === null
            ? `${compact(T.total)} tokens since ${since}`
            : `Week of ${short(weekStart(at))} · ${compact(SUM[at])} · ${dollars(WEEK[at].usd)} · ` +
              T.apps.map((a, k) => (WEEK[at].tokens[k] ? `${named(a)} ${compact(WEEK[at].tokens[k])}` : "")).filter(Boolean).join(", ")}
        </p>
        <p className="tokens__key" aria-hidden>
          {T.apps.map((a) => (
            <span key={a}>
              <i className={hue(a)} />
              {named(a)}
            </span>
          ))}
        </p>
      </div>

      <div className="pies">
        <Ring title="Tokens by agent" slices={BY_AGENT} middle={compact(T.total)} format={(n) => `${compact(n)} tokens`} />
        <Ring title="Value by agent" slices={VALUE_BY_AGENT} middle={dollars(T.usd)} format={(n) => dollars(n)} />
        <Ring title="Tokens by kind" slices={BY_KIND} middle={percent(T.parts.cacheRead, T.total)} format={(n) => `${compact(n)} tokens`} />
      </div>

      <figcaption>
        <span lang="ja">楼</span>, tower: a week of tokens to a building, stacked by agent, from the first week there were
        any. Counted by cc-switch on {MACHINES}, cache reads included, to {long(new Date(T.fetched))}. The money is what the
        tokens are worth at API list prices, not what I paid; models no price table knows count at nothing, so it is a
        floor. The typist types 40 words a minute, 230 days a year, and a token is about three-quarters of a word.
      </figcaption>
    </figure>
  );
}
