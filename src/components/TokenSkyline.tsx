import { useEffect, useRef, useState, type PointerEvent } from "react";
import { LOGOS } from "@/content/logos";
import tokens from "@/content/tokens.json";
import { useMedia } from "@/hooks/useMedia";
import { useScale } from "@/hooks/useScale";
import { useNear } from "@/hooks/useNear";
import { DAY, MONTHS, long, short, thousands } from "@/lib/calendar";

/*
 * The editor's tokens with coding agents, under the GitHub heatmap: the total
 * and its value at API list prices, a town plan of the weeks from the first
 * there was any (a treemap: a month to a district, a week to a block, divided
 * among the agents), and a flow from each agent to
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
  /** Models, in the order the town stacks them, and the company that makes each; the last is "Other". */
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

// ---------------------------------------------------------------- the town's blocks

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
 * The weeks as a town seen from above, a treemap kept in time order: a month
 * to a district, left to right, as wide as its tokens; its weeks as blocks
 * down it, each as tall as its tokens; each block divided among the models,
 * a company to a hue and its models in shades of it (MODEL_FILL), Other in grey.
 * The streets between are paper: two units between blocks, twice that
 * between districts, a hairline between one agent's lot and the next.
 */
const W = 556;
const TOP = 22; // over the districts, their names
const PLAN = 200;
const H = TOP + PLAN;
const STREET = 2;
const r2 = (n: number) => Math.round(n * 100) / 100;

type Block = { week: number; x: number; y: number; w: number; h: number; lots: { k: number; x: number; w: number }[] };
type District = { month: number; total: number; x: number; w: number; blocks: Block[] };

/** Each week goes to the month it starts in (the first week, to the first day's month). */
const DISTRICTS: District[] = (() => {
  const months: { month: number; weeks: number[]; total: number }[] = [];
  SUM.forEach((total, w) => {
    if (!total) return;
    const month = (w === 0 ? new Date(FIRST) : weekStart(w)).getUTCMonth();
    const last = months.at(-1);
    if (last?.month === month) {
      last.weeks.push(w);
      last.total += total;
    } else months.push({ month, weeks: [w], total });
  });
  const wide = W - (months.length - 1) * 2 * STREET;
  let x = 0;
  return months.map(({ month, weeks, total }) => {
    const w = (wide * total) / T.total;
    const tall = PLAN - (weeks.length - 1) * STREET;
    let y = TOP;
    const blocks = weeks.map((week) => {
      const h = (tall * SUM[week]) / total;
      const models = WEEK[week].models.filter(Boolean).length;
      const room = Math.max(0, w - (models - 1));
      let lx = x;
      const lots = WEEK[week].models.flatMap((n, k) => {
        if (!n) return [];
        const lot = { k, x: lx, w: (room * n) / SUM[week] };
        lx += lot.w + 1;
        return [lot];
      });
      const block = { week, x, y, w, h, lots };
      y += h + STREET;
      return block;
    });
    const district = { month, total, x, w, blocks };
    x += w + 2 * STREET;
    return district;
  });
})();
const BLOCKS = DISTRICTS.flatMap((d) => d.blocks);
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
  const step = kin.length > 1 ? Math.min(30, 60 / (kin.length - 1)) : 0;
  return `color-mix(in oklab, ${hue} ${92 - kin.indexOf(k) * step}%, var(--paper))`;
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
 * The key to the town, as a chart of its own: the champion in a row of its
 * own, then each company under its mark, each other model a bar on one scale.
 */
function ByModel() {
  const champ = T.models[CHAMPION];
  const n = T.byModel[champ] ?? 0;
  return (
    <div className="models">
      <p className="flows__title mono">By model</p>
      <div className="champion">
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
      </div>
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
/** A week's three biggest families, for the line under the town. */
const topModels = (week: number) =>
  WEEK[week].models
    .map((n, k) => [T.models[k], n] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m, n]) => `${m} ${compact(n)}`)
    .join(", ");
/**
 * A district's name over it, and its tokens beside the name, as much as fits
 * before the next district's name. Names are set at 9px whatever the plan's
 * width, about 5.9px a letter; `scale` is pixels to a unit.
 */
const districtName = (d: District, i: number, scale: number) => {
  const room = ((DISTRICTS[i + 1]?.x ?? W) - d.x) * scale;
  const name = MONTHS[d.month].slice(0, 3).toUpperCase();
  const full = `${name} ${compact(d.total)}`;
  return [full, name].find((s) => s.length * 5.9 + 10 <= room) ?? "";
};

function Town({ scale }: { scale: number }) {
  return (
  <g>
    {DISTRICTS.map((d, i) => (
      <g key={`${d.month}-${d.x}`}>
        <text className="sky-month" x={r2(d.x)} y={TOP - 6} style={{ fontSize: r2(9 / scale) }}>
          {districtName(d, i, scale)}
        </text>
        {d.blocks.map((b) =>
          b.lots.map((l) => (
            <rect key={`${b.week}-${l.k}`} style={{ fill: MODEL_FILL[l.k] }} x={r2(l.x)} y={r2(b.y)} width={r2(l.w)} height={r2(b.h)} />
          )),
        )}
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
const GAP = 10;
const PER = (FH - (KINDS.length - 1) * GAP) / T.total;

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
 * Tokens with coding agents: the total and what it is worth, the weeks as a
 * town, and the shares as a flow from agent to kind. The lines under the town
 * and the flow read out what the pointer is on.
 */
export function TokenSkyline() {
  const [at, setAt] = useState<number | null>(null);
  const sky = useRef<SVGSVGElement>(null);
  const scale = useScale(sky, W);

  /** The block under the pointer, its street included, so a thin block can still be found. */
  function pick(e: PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) * W) / box.width;
    const y = ((e.clientY - box.top) * H) / box.height;
    const b = BLOCKS.find((b) => x >= b.x - STREET && x <= b.x + b.w + STREET && y >= b.y - STREET && y <= b.y + b.h + STREET);
    setAt(b ? b.week : null);
  }
  const block = at === null ? undefined : BLOCKS.find((b) => b.week === at);

  const since = T.since ? long(new Date(T.since)) : "the start";
  return (
    <figure className="tokens">
      <h3 className="sect-label">
        <span lang="ja">街</span> With agents
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
        <title id="sky-t">{`${thousands(T.total)} tokens with coding agents since ${since}, as a town plan, a month to a district and a week to a block: ${DISTRICTS.map((d) => `${MONTHS[d.month]} ${compact(d.total)}`).join(", ")}. By model: ${T.models.map((m) => `${m} ${compact(T.byModel[m] ?? 0)}`).join(", ")}. The busiest week, from ${long(weekStart(PEAK))}, used ${compact(TALLEST)}.`}</title>
        <Town scale={scale} />
        {block && (
          <rect className="tokens__at" x={r2(block.x - 1.5)} y={r2(block.y - 1.5)} width={r2(block.w + 3)} height={r2(block.h + 3)} />
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
            {BLOCKS.map(({ week }) => (
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
        <span lang="ja">街</span>, town: the weeks from above, from the first there were any. A month of tokens is a
        district, as wide as its tokens; a week is a block in it, as tall as its tokens; each block is divided among the
        models, and the streets between are only paper. Under it, each agent's tokens run to what they were: read back from the cache, fresh input, written to the
        cache, or written back as output. Counted by cc-switch on {MACHINES}, and from Cursor's own usage exports, cache reads included, to {long(new Date(T.fetched))}. The money is what the
        tokens are worth at API list prices, not what I paid; models no price table knows, Cursor's Auto among them, count at nothing, so it is a
        floor. The typist types 40 words a minute, 230 days a year, and a token is about three-quarters of a word.
      </figcaption>
    </figure>
  );
}
