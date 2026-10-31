import { useEffect, useRef, useState, type PointerEvent } from "react";
import { LOGOS } from "@/content/logos";
import tokens from "@/content/tokens.json";
import { DAY, MONTHS, long, short, thousands } from "@/lib/calendar";
import { Plate } from "@/ui/plate";
import { SectionLabel } from "@/ui/section-label";
import { useMedia } from "@/ui/use-media";
import { useNear } from "@/ui/use-near";
import { useScale } from "@/ui/use-scale";

/*
 * The editor's tokens with coding agents, under the GitHub heatmap: the total
 * and its value at API list prices, the weeks from the first there was any
 * (a column a week, each filled to full height with that week's mix of models,
 * and a bar above it for how many tokens), and a flow from each agent to
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
  /** Models, in the order the weeks stack them, and the company that makes each; the last is "Other". */
  models: string[];
  makers: string[];
  byModel: Record<string, number>;
  days: [string, number[], number[], number[]][];
};
// JSON imports type its rows as loose arrays; scripts/token-data.py writes them as this shape.
const T = tokens as unknown as Tokens;

const NAMES: Record<string, string> = { claude: "Claude", codex: "Codex", pi: "Pi", cursor: "Cursor", gemini: "Gemini", opencode: "OpenCode" };
const named = (app: string) => NAMES[app] ?? app;
/** The agent's colour class; an agent with no colour of its own is drawn in ink. */
const hue = (app: string) => (["claude", "codex", "pi", "cursor"].includes(app) ? `agent-${app}` : "agent-other");
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

// ---------------------------------------------------------------- the weeks

const FIRST = Date.parse(T.since ?? T.fetched);
const START = FIRST - new Date(FIRST).getUTCDay() * DAY; // the Sunday on or before the first day
const LAST = Date.parse(T.days.at(-1)?.[0] ?? T.fetched);
const WEEKS = Math.floor((LAST - START) / (7 * DAY)) + 1;
const WEEK = Array.from({ length: WEEKS }, () => ({ tokens: T.apps.map(() => 0), models: T.models.map(() => 0), usd: 0 }));
for (const [day, counts, usd, models] of T.days) {
  const w = WEEK[Math.floor((Date.parse(day) - START) / (7 * DAY))];
  counts.forEach((c, k) => (w.tokens[k] += c));
  models.forEach((c, k) => (w.models[k] += c));
  w.usd += usd.reduce((a, b) => a + b, 0);
}
const SUM = WEEK.map((w) => w.tokens.reduce((a, b) => a + b, 0));
const TALLEST = Math.max(1, ...SUM);
const PEAK = SUM.indexOf(TALLEST);
const weekStart = (w: number) => new Date(START + w * 7 * DAY);

/*
 * The weeks as columns, one for each week with tokens, all the same width; a
 * week with none takes no room, and a wider seam with a break in the axis marks
 * where weeks were skipped. Each column is filled to full height with that
 * week's mix of models (a company to a hue and its models in shades of it,
 * MODEL_FILL; Other in grey), so a week of a few thousand tokens still shows
 * what it was spent on. Over it, a bar for how many tokens, on a square-root
 * scale so the small weeks can be seen beside the huge ones. Months are named
 * under the columns.
 */
const W = 556;
const VOL = 44; // the bar over the columns
const BAND = 6; // between the bars and the columns
const MIX = 150; // the columns
const NAMES_H = 16; // the months' names
const H = VOL + BAND + MIX + NAMES_H;
/** The weeks with tokens: the only ones that get a column. */
const USED = SUM.flatMap((total, week) => (total > 0 ? [week] : []));
/** Where weeks were skipped: before each column that does not follow the week before it. */
const BREAKS = USED.filter((week, i) => i > 0 && week - USED[i - 1] > 1).length;
const SKIP = 5; // the seam where weeks were skipped
const COL = (W - BREAKS * SKIP) / USED.length;
const SEAM = Math.min(1.5, COL / 5); // paper between columns
const r2 = (n: number) => Math.round(n * 100) / 100;

/** `skipped`: how many weeks with no tokens come just before this one. */
type Column = { week: number; x: number; w: number; skipped: number };
type Month = { month: number; total: number; x: number };

const COLUMNS: Column[] = (() => {
  let x = 0;
  return USED.map((week, i) => {
    const skipped = i > 0 ? week - USED[i - 1] - 1 : 0;
    if (skipped) x += SKIP;
    const c = { week, x, w: COL - SEAM, skipped };
    x += COL;
    return c;
  });
})();
const COLUMN_OF = new Map(COLUMNS.map((c) => [c.week, c]));
/** Each week goes to the month it starts in (the first week, to the first day's month); a month starts at its first column. */
const MONTHS_AT: Month[] = (() => {
  const months: Month[] = [];
  for (const { week, x } of COLUMNS) {
    const month = (week === 0 ? new Date(FIRST) : weekStart(week)).getUTCMonth();
    const last = months.at(-1);
    if (last?.month === month) last.total += SUM[week];
    else months.push({ month, total: SUM[week], x });
  }
  return months;
})();
/** A company to a hue: the dataviz palette's first five slots, in their validated order (site.css). */
const MAKER_HUE: Record<string, string> = {
  OpenAI: "var(--co-1)",
  Anthropic: "var(--co-2)",
  DeepSeek: "var(--co-3)",
  Alibaba: "var(--co-4)",
  Zhipu: "var(--co-5)",
  xAI: "var(--co-6)",
  Google: "var(--co-7)",
  Cursor: "var(--co-8)",
};
const MAKER_NAME: Record<string, string> = { Zhipu: "Zhipu AI" };
/**
 * Each model's colour: its company's hue, in its own shade, the first model the
 * strongest and each next a step toward the paper; Other in grey.
 */
const MODEL_FILL = T.models.map((_, k) => {
  const hue = MAKER_HUE[T.makers[k]];
  if (!hue) return "var(--ink-3)";
  const kin = T.makers.flatMap((maker, j) => (maker === T.makers[k] ? [j] : []));
  // Cursor's light green keeps two full tints of its own: a paler one would read as paper.
  if (T.makers[k] === "Cursor") return kin.indexOf(k) === 0 ? "var(--co-8)" : "var(--co-8b)";
  const step = kin.length > 1 ? Math.min(24, 40 / (kin.length - 1)) : 0;
  // Never fainter than 68% of the hue, so no model washes out to paper.
  return `color-mix(in oklab, ${hue} ${96 - kin.indexOf(k) * step}%, var(--paper))`;
});
/**
 * The champion: the model with the most tokens, which dwarfs the rest, so it
 * stands in a row of its own (the owner's call, 2026-10-30) and the bars below
 * are scaled to the runner-up.
 */
const CHAMPION = T.models.reduce((best, m, k) => ((T.byModel[m] ?? 0) > (T.byModel[T.models[best]] ?? 0) ? k : best), 0);
/** The companies, the biggest first, each with its models but the champion, the biggest first. */
const BY_MAKER = [...new Set(T.makers)]
  .map((maker) => {
    const all = T.models
      .map((name, k) => ({ name, k, n: T.byModel[name] ?? 0 }))
      .filter(({ k, n }) => T.makers[k] === maker && n > 0)
      .sort((a, b) => b.n - a.n);
    return { maker, models: all.filter((m) => m.k !== CHAMPION), n: all.reduce((a, m) => a + m.n, 0) };
  })
  .filter((m) => m.n > 0)
  .sort((a, b) => (a.maker === "Other" ? 1 : b.maker === "Other" ? -1 : b.n - a.n));
const BIGGEST = Math.max(1, ...T.models.filter((_, k) => k !== CHAMPION).map((m) => T.byModel[m] ?? 0));

/** A company's mark, in the ink colour; a plain dot where there is none. */
function Mark({ maker }: { maker: string }) {
  const paths = LOGOS[maker];
  return paths ? (
    <svg className="models__mark" viewBox="0 0 24 24" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} fillRule="evenodd" d={d} />
      ))}
    </svg>
  ) : (
    <span className="models__mark models__mark--none" aria-hidden="true" />
  );
}

/**
 * The key to the weeks' colours, as a chart of its own: the champion in a row of its
 * own, then each company under its mark, each other model a bar on one scale.
 */
function ByModel() {
  const champ = T.models[CHAMPION];
  const n = T.byModel[champ] ?? 0;
  return (
    <div className="models">
      <p className="flows__title mono">By model</p>
      <Plate className="champion">
        <p className="champion__label mono">
          <span lang="ja">王者</span> Champion
        </p>
        <p className="champion__name">
          <Mark maker={T.makers[CHAMPION]} />
          {champ}
        </p>
        <p className="champion__n mono">
          {compact(n)} tokens · {percent(n, T.total)} of all
        </p>
        {/* its bar is of all the tokens, not on the scale below */}
        <span className="champion__bar" aria-hidden="true">
          <i style={{ width: `${(100 * n) / T.total}%`, background: MODEL_FILL[CHAMPION] }} />
        </span>
      </Plate>
      <p className="models__scale mono">The rest, on a scale of their own</p>
      <div className="models__makers">
        {BY_MAKER.map(({ maker, models, n }) => (
          <section className="models__maker" key={maker}>
            <h4 className="mono">
              <Mark maker={maker} />
              {MAKER_NAME[maker] ?? maker}
              <span className="models__share">{percent(n, T.total)}</span>
            </h4>
            {/* Other is one row already; its heading says all of it */}
            {maker !== "Other" && (
            <ul>
              {models.map((m) => (
                <li key={m.name}>
                  <span className="models__name">{m.name}</span>
                  <span className="models__bar">
                    <i style={{ width: `${(100 * m.n) / BIGGEST}%`, background: MODEL_FILL[m.k] }} />
                  </span>
                  <span className="models__n mono">
                    {compact(m.n)} · {percent(m.n, T.total)}
                  </span>
                </li>
              ))}
            </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
/** A week's three biggest families, for the line under the chart. */
const topModels = (week: number) =>
  WEEK[week].models
    .map((n, k) => [T.models[k], n] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m, n]) => `${m} ${compact(n)}`)
    .join(", ");
/**
 * A month's name under its first column, and its tokens beside the name, as
 * much as fits before the next month's name. Names are set at 9px whatever the
 * chart's width, about 5.9px a letter; `scale` is pixels to a unit.
 */
const monthName = (m: Month, i: number, scale: number) => {
  const room = ((MONTHS_AT[i + 1]?.x ?? W) - m.x) * scale;
  const name = MONTHS[m.month].slice(0, 3).toUpperCase();
  const full = `${name} ${compact(m.total)}`;
  return [full, name].find((t) => t.length * 5.9 + 6 <= room) ?? "";
};

function Weeks({ scale }: { scale: number }) {
  const base = VOL; // the bars stand on this line
  const top = VOL + BAND; // the columns start here
  return (
    <g>
      {COLUMNS.map((c) => {
        const total = SUM[c.week];
        const bar = Math.max(1.5, VOL * Math.sqrt(total / TALLEST));
        // the break in the axis, in the middle of the wider seam before a column that follows skipped weeks
        const gap = c.x - (SKIP + SEAM) / 2;
        let y = top;
        return (
          <g key={c.week}>
            {c.skipped > 0 && (
              <path className="sky-break" d={`M${r2(gap - 1.5)} ${top + MIX + 4}L${r2(gap + 0.5)} ${top + MIX - 2}M${r2(gap - 0.5)} ${top + MIX + 4}L${r2(gap + 1.5)} ${top + MIX - 2}`} />
            )}
            <rect className="tokens__vol" x={r2(c.x)} y={r2(base - bar)} width={r2(c.w)} height={r2(bar)} />
            {WEEK[c.week].models.map((n, k) => {
              if (!n) return null;
              const h = (MIX * n) / total;
              const y0 = y;
              y += h;
              // a little overlap, so the models in one column never show a seam of paper between them
              return <rect key={k} style={{ fill: MODEL_FILL[k] }} x={r2(c.x)} y={r2(y0)} width={r2(c.w)} height={r2(h + 0.5)} />;
            })}
          </g>
        );
      })}
      {MONTHS_AT.map((m, i) => (
        <g key={`${m.month}-${m.x}`}>
          <line className="sky-tick" x1={r2(m.x)} x2={r2(m.x)} y1={top + MIX} y2={top + MIX + 4} />
          <text className="sky-month" x={r2(m.x)} y={top + MIX + 13} style={{ fontSize: r2(9 / scale) }}>
            {monthName(m, i, scale)}
          </text>
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------- the flow

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
// The agents stand further apart than the kinds: their labels take two lines,
// and the small agents' labels can then sit level with their own nodes.
const GAP_FROM = 24;
const GAP = 10;
// one scale for both sides, whichever needs more room for its gaps
const PER = Math.min(FH - (T.apps.length - 1) * GAP_FROM, FH - (KINDS.length - 1) * GAP) / T.total;

type Span = { y0: number; y1: number };
/** Values stacked down one side, `gap` between each, centred in the drawing. */
function stack(values: number[], gap: number): Span[] {
  let y = (FH - values.reduce((a, v) => a + v * PER, 0) - (values.length - 1) * gap) / 2;
  return values.map((v) => {
    const span = { y0: y, y1: y + v * PER };
    y = span.y1 + gap;
    return span;
  });
}
const FROM = stack(T.apps.map((a) => T.byApp[a]), GAP_FROM);
const TO = stack(KINDS.map((k) => T.parts[k.key]), GAP);

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
                {compact(T.byApp[a])} · {T.usdByApp[a] ? dollars(T.usdByApp[a]) : "unpriced"}
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
 * Tokens with coding agents: the total and what it is worth, the weeks as
 * columns, and the shares as a flow from agent to kind. The lines under the chart
 * and the flow read out what the pointer is on.
 */
export function TokenSkyline() {
  const [at, setAt] = useState<number | null>(null);
  const sky = useRef<SVGSVGElement>(null);
  const scale = useScale(sky, W);

  /** The week under the pointer: its column, the bar over it, and the seam either side, so a thin week can still be found. */
  function pick(e: PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) * W) / box.width;
    const y = ((e.clientY - box.top) * H) / box.height;
    const c = COLUMNS.findLast((c) => c.x - SEAM <= x);
    setAt(y <= VOL + BAND + MIX && c && x < c.x + COL ? c.week : null);
  }
  const column = at === null ? undefined : COLUMN_OF.get(at);

  const since = T.since ? long(new Date(T.since)) : "the start";
  return (
    <figure className="tokens">
      <SectionLabel as="h3" ja="街">
        With agents
      </SectionLabel>
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
        ref={sky}
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
        <title id="sky-t">{`${thousands(T.total)} tokens with coding agents since ${since}, as one column for each week with any (weeks with none left out), each filled with that week's mix of models, and a bar over it for how many tokens: ${MONTHS_AT.map((m) => `${MONTHS[m.month]} ${compact(m.total)}`).join(", ")}. By model: ${T.models.map((m) => `${m} ${compact(T.byModel[m] ?? 0)}`).join(", ")}. The busiest week, from ${long(weekStart(PEAK))}, used ${compact(TALLEST)}.`}</title>
        <Weeks scale={scale} />
        {column && (
          <rect className="tokens__at" x={r2(column.x - 1)} y={0.75} width={r2(column.w + 2)} height={VOL + BAND + MIX - 1.5} />
        )}
      </svg>
      <div className="tokens__foot mono">
        <p>
          {at === null
            ? `${compact(T.total)} tokens since ${since}`
            : `Week of ${short(weekStart(at))} · ${compact(SUM[at])} · ${dollars(WEEK[at].usd)} · ${topModels(at)}`}
        </p>
      </div>

      <ByModel />

      {/* Every week's numbers, for readers who cannot see the plan; a table hides inside a box, not by itself. */}
      <div className="visually-hidden">
        <table>
          <caption>Tokens a week, by model</caption>
          <thead>
            <tr>
              <th scope="col">Week of</th>
              {T.models.map((m) => (
                <th key={m} scope="col">
                  {m}
                </th>
              ))}
              <th scope="col">All tokens</th>
              <th scope="col">Value at list prices</th>
            </tr>
          </thead>
          <tbody>
            {COLUMNS.map(({ week }) => (
              <tr key={week}>
                <th scope="row">{short(weekStart(week))}</th>
                {WEEK[week].models.map((n, k) => (
                  <td key={k}>{thousands(n)}</td>
                ))}
                <td>{thousands(SUM[week])}</td>
                <td>{dollars(WEEK[week].usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Flow />

      <figcaption>
        <span lang="ja">週</span>, weeks: one column for each week with tokens, every column filled to full height with that
        week's mix of models, so a week of a few thousand tokens still shows what it was spent on. Weeks with none are left
        out; a break in the axis marks where.
        The bar above a column is how many tokens the week used, on a square-root scale so the small weeks show beside the huge ones.
        Under it, each agent's tokens run to what they were: read back from the cache, fresh input, written to the
        cache, or written back as output. Counted by cc-switch on {MACHINES}, and from Cursor's own usage exports, cache reads included, to {long(new Date(T.fetched))}. The money is what the
        tokens are worth at API list prices, not what I paid; models no price table knows, Cursor's Auto among them, count at nothing, so it is a
        floor. The typist types 40 words a minute, 230 days a year, and a token is about three-quarters of a word.
      </figcaption>
    </figure>
  );
}
