import { Folio, Kicker } from "@/components/bits";
import { GlitchTitle } from "@/components/effects";

/*
 * Route map of my work. The x axis is compressed before 2025:
 *   x = year < 2025 ? 80 + (year - 2020) * 60 : 380 + (year - 2025) * 305
 * so October 2026 (NOW) sits at x = 929. A line with `end` closed there.
 * Tokensbeat is drawn first; a dotted link drops from it to its tenants.
 */

type Station = { x: number; label: string; above?: boolean; lx?: number };
type Route = {
  letter: string;
  name: string;
  y: number;
  from: number;
  end?: { x: number; label: string; above?: boolean };
  stations: Station[];
  nameAtMargin?: boolean;
};

const NOW = 929;

const TENANCY = { x: 915, from: 70, to: [135, 200] };

const ROUTES: Route[] = [
  { letter: "T", name: "Tokensbeat", y: 70, from: 915, stations: [] },
  { letter: "W", name: "WorkGo", y: 135, from: 609, stations: [{ x: 868, label: "2.0" }] },
  { letter: "I", name: "InclusifAI", y: 200, from: 609, stations: [{ x: 877, label: "Partner Hub" }] },
  {
    letter: "H",
    name: "HiRain",
    y: 265,
    from: 697,
    stations: [
      { x: 776, label: "5 points" },
      { x: 905, label: "bird's-eye", lx: 896 },
    ],
  },
  {
    letter: "A",
    name: "AwakeAI",
    y: 320,
    from: 137,
    end: { x: 532, label: "July 2025", above: true },
    nameAtMargin: true,
    stations: [
      { x: 224, label: "Dobson Cup", above: true },
      { x: 308, label: "architect", above: true },
      { x: 380, label: "COO", above: true },
    ],
  },
];

const TICKS: [number, string][] = [
  [80, "2020"],
  [140, "21"],
  [200, "22"],
  [260, "23"],
  [320, "24"],
  [380, "2025"],
  [532, ".5"],
  [685, "2026"],
  [837, ".5"],
  [990, "2027"],
];

function RouteMap() {
  return (
    <svg viewBox="0 0 1040 380" role="img" aria-labelledby="rm-t rm-d">
      <title id="rm-t">Route map of my work, 2020 to 2026</title>
      <desc id="rm-d">
        Five lines. Tokensbeat, at the top, opened in October 2026, and a dotted link drops from it to WorkGo and
        InclusifAI, its first tenants. WorkGo and InclusifAI run from October 2025 to now, HiRain from January 2026.
        AwakeAI ran from December 2020 to July 2025, when it closed. The axis is compressed before 2025.
      </desc>
      <g className="rm-axis-g">
        <line className="rm-axis" x1="80" y1="350" x2="1000" y2="350" />
        <g className="rm-tick">
          {TICKS.map(([x, t]) => (
            <text key={x} x={x} y="370">
              {t}
            </text>
          ))}
        </g>
        <path className="rm-axis" d="M350 344 l8 12 M356 344 l8 12" />
      </g>
      <line className="rm-now" x1={NOW} y1="28" x2={NOW} y2="350" />
      <path className="rm-tenancy" d={`M${TENANCY.x} ${TENANCY.from} V${Math.max(...TENANCY.to)}`} />
      <text className="rm-nowlbl" x={NOW} y="20" textAnchor="middle">
        NOW · 2026.10
      </text>

      {ROUTES.map((r) => (
        <g key={r.letter} className={r.end ? "rm-closed" : undefined}>
          <path className="rm-line" d={`M${r.from} ${r.y} H${r.end?.x ?? NOW}`} />
          {r.end && (
            <>
              <path className="rm-end" d={`M${r.end.x} ${r.y - 10} V${r.y + 10}`} />
              <text className="rm-lbl" x={r.end.x} y={r.end.above ? r.y - 18 : r.y + 26} textAnchor="middle">
                {r.end.label}
              </text>
            </>
          )}
          {r.stations.map((s) => (
            <g key={s.x}>
              <circle className="rm-st" cx={s.x} cy={r.y} r="5" />
              <text className="rm-lbl" x={s.lx ?? s.x} y={s.above ? r.y - 18 : r.y + 26} textAnchor="middle">
                {s.label}
              </text>
            </g>
          ))}
          <circle className="rm-roundel" cx={r.from} cy={r.y} r="15" />
          {TENANCY.to.includes(r.y) && <circle className="rm-st" cx={TENANCY.x} cy={r.y} r="5" />}
          <text className="rm-letter" x={r.from} y={r.y}>
            {r.letter}
          </text>
          {r.nameAtMargin ? (
            <text className="rm-name" x="38" y={r.y + 5}>
              {r.name}
            </text>
          ) : (
            <text className="rm-name" x={r.from - 26} y={r.y + 5} textAnchor="end">
              {r.name}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export function FeatureOpener() {
  return (
    <section className="spread feature-open" id="feature" data-run="特集 · Architecture">
      <div className="wrap">
        <Kicker ja="特集">Feature · pp. 06–27</Kicker>
        <GlitchTitle className="display">
          Five lines, <em>one proof.</em>
        </GlitchTitle>
        <p className="dek">
          I work on several lines at once, the way a city runs several metro lines, and each line is one lemma of the
          theorem on page 04. The newest, Tokensbeat, is the foundation: WorkGo and InclusifAI are moving onto it as
          tenants, each keeping its own gateway, its own agent and its own users. Here is the network as of October
          2026.
        </p>

        <figure className="routemap">
          <RouteMap />
          <figcaption>
            Route map, not to scale before 2025. The dotted link marks tenancy. The grey line closed in July 2025, when I
            resigned from AwakeAI, where I first held the title of architect.
          </figcaption>
        </figure>
      </div>
      <Folio page="06" />
    </section>
  );
}
