import { useEffect, useRef, useState, type PointerEvent } from "react";
import tokens from "@/content/tokens.json";
import { useMedia } from "@/hooks/useMedia";
import { useNear } from "@/hooks/useNear";
import { DAY, MONTHS, long, short, thousands } from "@/lib/calendar";

/*
 * The editor's tokens with coding agents, under the GitHub heatmap: the total
 * and its value at API list prices, a skyline from the first week there was
 * any (a week to a building, stacked by agent), and a flow from each agent to
 * the kinds of token it spent. scripts/token-data.py counts it all from
 * cc-switch into src/content/tokens.json. Each agent keeps its own colour everywhere
 * (agent-claude and so on, in site.css) and is always named beside its marks.
 */

type Parts = { input: number; output: number; cacheRead: number; cacheWrite: number };
type Tokens = {
  fetched: string;
  machines: number;
  apps: string[];
  total: number;
  byApp: Record<string, number>;
  usd: number;
  usdByApp: Record<string, number>;
  parts: Parts;
  partsByApp: Record<string, Parts>;
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

// ---------------------------------------------------------------- the flow

const BY_AGENT = T.apps.map((a) => ({ label: named(a), value: T.byApp[a] }));
const KINDS: { key: keyof Parts; label: string; cls: string }[] = [
  // Cache reads are most of it, so they alone take a colour; the other kinds stay in ink.
  { key: "cacheRead", label: "Cache reads", cls: "kind-cache" },
  { key: "input", label: "Fresh input", cls: "kind-input" },
  { key: "cacheWrite", label: "Cache writes", cls: "kind-write" },
  { key: "output", label: "Output", cls: "kind-output" },
];

/*
 * The drawing is FW units wide and stretches to its column, while its height
 * stays FH pixels, so the labels either side (HTML, readable at any width) sit
 * level with their nodes. A token is the same height on both sides.
 */
const FW = 300;
const FH = 168;
const NODE = 6;
const GAP = 10;
const PER = (FH - (KINDS.length - 1) * GAP) / T.total;
const r2 = (n: number) => Math.round(n * 100) / 100;

type Span = { y0: number; y1: number };
/** Values stacked down one side, a gap between each, centred in the drawing. */
function stack(values: number[]): Span[] {
  let y = (FH - values.reduce((a, v) => a + v * PER, 0) - (values.length - 1) * GAP) / 2;
  return values.map((v) => {
    const span = { y0: y, y1: y + v * PER };
    y = span.y1 + GAP;
    return span;
  });
}
const FROM = stack(T.apps.map((a) => T.byApp[a]));
const TO = stack(KINDS.map((k) => T.parts[k.key]));

/** Label centres beside a side's nodes, nudged down until no two are closer than `room` pixels. */
function spread(spans: Span[], room: number) {
  const ys = spans.map((s) => (s.y0 + s.y1) / 2);
  for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + room);
  return ys.map(r2);
}
const FROM_Y = spread(FROM, 28);
const TO_Y = spread(TO, 14);

/**
 * A band for each agent and kind it spent: agents leave in kind order and
 * kinds fill in agent order, so no two bands cross more than they must.
 */
const LINKS = (() => {
  const out: { app: number; kind: number; value: number; d: string }[] = [];
  const at = TO.map((s) => s.y0);
  FROM.forEach((from, i) => {
    let y = from.y0;
    KINDS.forEach((k, j) => {
      const value = T.partsByApp[T.apps[i]]?.[k.key] ?? 0;
      if (!value) return;
      const h = value * PER;
      const [a0, a1, b0, b1] = [y, y + h, at[j], at[j] + h].map(r2);
      const [x0, x1, m] = [NODE, FW - NODE, FW / 2];
      out.push({ app: i, kind: j, value, d: `M${x0} ${a0}C${m} ${a0} ${m} ${b0} ${x1} ${b0}L${x1} ${b1}C${m} ${b1} ${m} ${a1} ${x0} ${a1}Z` });
      y += h;
      at[j] += h;
    });
  });
  return out;
})();

/** What the pointer is on: a band (an agent and a kind), an agent, or a kind. */
type Pick = { app?: number; kind?: number } | null;

function readout(pick: Pick) {
  if (!pick) return `${compact(T.total)} tokens, ${percent(T.parts.cacheRead, T.total)} of them read back from the cache`;
  const { app, kind } = pick;
  if (app !== undefined && kind !== undefined) {
    const a = T.apps[app];
    const v = T.partsByApp[a]?.[KINDS[kind].key] ?? 0;
    return `${named(a)} → ${KINDS[kind].label} · ${compact(v)} · ${percent(v, T.byApp[a])} of ${named(a)}'s`;
  }
  if (app !== undefined) {
    const a = T.apps[app];
    return `${named(a)} · ${compact(T.byApp[a])} tokens · ${dollars(T.usdByApp[a] ?? 0)} · ${percent(T.partsByApp[a]?.cacheRead ?? 0, T.byApp[a])} cache reads`;
  }
  const k = KINDS[kind!];
  const each = T.apps.map((a) => [named(a), T.partsByApp[a]?.[k.key] ?? 0] as const).filter(([, v]) => v > 0);
  return `${k.label} · ${compact(T.parts[k.key])} · ${percent(T.parts[k.key], T.total)} · ${each.map(([n, v]) => `${n} ${compact(v)}`).join(", ")}`;
}

/** Each agent's tokens running to the kinds they were, with the agent's value at list prices beside it. */
function Flow() {
  const [pick, setPick] = useState<Pick>(null);
  const on = (app: number, kind: number) =>
    pick !== null && (pick.app === undefined || pick.app === app) && (pick.kind === undefined || pick.kind === kind);
  const hold = (p: Pick) => ({ onPointerEnter: () => setPick(p), onPointerDown: () => setPick(p) });

  return (
    <div className="flows">
      <p className="flows__title mono">Agent to kind</p>
      <div
        className="flow"
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setPick(null);
        }}
      >
        <ul className="flow__side flow__side--from mono">
          {T.apps.map((a, i) => (
            <li key={a} style={{ top: FROM_Y[i] }} {...hold({ app: i })}>
              <b>{named(a)}</b>
              <span>
                {compact(T.byApp[a])} · {dollars(T.usdByApp[a] ?? 0)}
              </span>
            </li>
          ))}
        </ul>
        <svg className={pick ? "flow__plot is-picking" : "flow__plot"} viewBox={`0 0 ${FW} ${FH}`} preserveAspectRatio="none" aria-hidden="true">
          {LINKS.map((l) => (
            <path
              key={`${l.app}-${l.kind}`}
              className={`flow__link ${hue(T.apps[l.app])}${on(l.app, l.kind) ? " is-on" : ""}`}
              d={l.d}
              {...hold({ app: l.app, kind: l.kind })}
            />
          ))}
          {FROM.map((s, i) => (
            <rect key={i} className={hue(T.apps[i])} x={0} y={r2(s.y0)} width={NODE} height={r2(Math.max(1, s.y1 - s.y0))} />
          ))}
          {TO.map((s, j) => (
            <rect key={j} className={KINDS[j].cls} x={FW - NODE} y={r2(s.y0)} width={NODE} height={r2(Math.max(1, s.y1 - s.y0))} />
          ))}
        </svg>
        <ul className="flow__side flow__side--to mono">
          {KINDS.map((k, j) => (
            <li key={k.key} style={{ top: TO_Y[j] }} {...hold({ kind: j })}>
              <b>{k.label}</b>
              <span>{percent(T.parts[k.key], T.total)}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="flows__read mono">{readout(pick)}</p>
      {/* A table cannot be made 1px wide, so it hides inside a box that can. */}
      <div className="visually-hidden">
        <table>
          <caption>Tokens by agent and kind</caption>
          <thead>
            <tr>
              <th scope="col">Agent</th>
              {KINDS.map((k) => (
                <th key={k.key} scope="col">
                  {k.label}
                </th>
              ))}
              <th scope="col">All tokens</th>
              <th scope="col">Value at list prices</th>
            </tr>
          </thead>
          <tbody>
            {T.apps.map((a) => (
              <tr key={a}>
                <th scope="row">{named(a)}</th>
                {KINDS.map((k) => (
                  <td key={k.key}>{thousands(T.partsByApp[a]?.[k.key] ?? 0)}</td>
                ))}
                <td>{thousands(T.byApp[a])}</td>
                <td>{dollars(T.usdByApp[a] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
 * skyline, and the shares as a flow from agent to kind. The lines under the
 * skyline and the flow read out what the pointer is on.
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

      <Flow />

      <figcaption>
        <span lang="ja">楼</span>, tower: a week of tokens to a building, stacked by agent, from the first week there were
        any. Under it, each agent's tokens run to what they were: read back from the cache, fresh input, written to the
        cache, or written back as output. Counted by cc-switch on {MACHINES}, cache reads included, to {long(new Date(T.fetched))}. The money is what the
        tokens are worth at API list prices, not what I paid; models no price table knows count at nothing, so it is a
        floor. The typist types 40 words a minute, 230 days a year, and a token is about three-quarters of a word.
      </figcaption>
    </figure>
  );
}
