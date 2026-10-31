import { useState, type PointerEvent } from "react";
import {
  CAL,
  CELL,
  DAYS,
  LEFT,
  MONTHS,
  OFFSET,
  STEP,
  TOP,
  W,
  WEEKDAYS,
  WEEKS,
  dayOf,
  long,
  short,
  thousands,
  weekOf,
} from "@/lib/calendar";
import { SectionLabel } from "@/ui/section-label";

/*
 * The editor's last year on GitHub, a square a day, shaded as the profile page
 * shades it. scripts/github-data.py copies the counts into src/content/github.json
 * when the issue is built, so the squares are in the prerendered page and the
 * reader's browser never asks GitHub for anything. The grid is lib/calendar.ts.
 */

const H = TOP + 7 * STEP;

const contributions = (n: number) =>
  n === 0 ? "No contributions" : n === 1 ? "1 contribution" : `${thousands(n)} contributions`;

const x = (i: number) => LEFT + weekOf(i) * STEP;
const y = (i: number) => TOP + ((i + OFFSET) % 7) * STEP;

/** Each month's name over the first week that starts in it, where there is room before the next. */
function months() {
  const starts: { week: number; month: number }[] = [];
  for (let week = 0; week < WEEKS; week++) {
    const month = dayOf(Math.max(0, week * 7 - OFFSET)).getUTCMonth();
    if (month !== starts.at(-1)?.month) starts.push({ week, month });
  }
  return starts.filter((s, i) => (starts[i + 1]?.week ?? WEEKS) - s.week >= 3);
}

/** The figure in a sentence or two, for readers who cannot see the squares. */
function summary() {
  const { counts } = CAL;
  let busiest = 0;
  let run = 0;
  let streak = 0;
  counts.forEach((c, i) => {
    if (c > counts[busiest]) busiest = i;
    run = c > 0 ? run + 1 : 0;
    streak = Math.max(streak, run);
  });
  const active = counts.filter((c) => c > 0).length;
  return (
    `${contributions(CAL.total)} from ${long(dayOf(0))} to ${long(dayOf(DAYS - 1))}, on ${active} of ${DAYS} days. ` +
    `The busiest day was ${long(dayOf(busiest))}, with ${counts[busiest]}; the longest run of days in a row, ${streak}.`
  );
}

/* The drawing never changes, so it is made once and React passes over it on every hover. */
const AXIS = (
  <g>
    {months().map(({ week, month }) => (
      <text key={week} x={LEFT + week * STEP} y={TOP - 5}>
        {MONTHS[month].slice(0, 3).toUpperCase()}
      </text>
    ))}
    {[1, 3, 5].map((d) => (
      <text key={d} x={0} y={TOP + d * STEP + CELL - 0.5}>
        {WEEKDAYS[d].slice(0, 3).toUpperCase()}
      </text>
    ))}
  </g>
);

const SQUARES = (
  <g>
    {CAL.counts.map((c, i) => (
      <rect key={i} className={`l${CAL.levels[i]}`} x={x(i)} y={y(i)} width={CELL} height={CELL}>
        <title>{`${contributions(c)} on ${WEEKDAYS[dayOf(i).getUTCDay()]}, ${long(dayOf(i))}`}</title>
      </rect>
    ))}
  </g>
);

const SUMMARY = summary();
const LAST = long(dayOf(DAYS - 1));

/**
 * A year of contributions as a calendar of squares in GitHub's greens, from
 * bare to deep. The line under it reads out the day the pointer is on; on a
 * phone, the day last tapped.
 */
export function GitHubHeatmap() {
  const [at, setAt] = useState<number | null>(null);

  /** The day under the pointer, from where it is on the drawing. */
  function pick(e: PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const week = Math.floor((((e.clientX - r.left) * W) / r.width - LEFT) / STEP);
    const d = Math.floor((((e.clientY - r.top) * H) / r.height - TOP) / STEP);
    const i = week * 7 + d - OFFSET;
    setAt(week >= 0 && d >= 0 && d < 7 && i >= 0 && i < DAYS ? i : null);
  }

  return (
    <figure className="heatmap">
      <SectionLabel as="h3" ja="草">
        On GitHub
      </SectionLabel>
      <div className="heatmap__plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby="hm-t"
          aria-describedby="hm-d"
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setAt(null);
          }}
        >
          <title id="hm-t">{`Contributions on GitHub by ${CAL.login}, a square a day, the year to ${LAST}`}</title>
          <desc id="hm-d">{SUMMARY}</desc>
          {AXIS}
          {SQUARES}
          {at !== null && <rect className="heatmap__at" x={x(at) - 1} y={y(at) - 1} width={CELL + 2} height={CELL + 2} />}
        </svg>
      </div>
      <div className="heatmap__foot mono">
        <p>
          {at === null
            ? `${thousands(CAL.total)} contributions in the last year`
            : `${short(dayOf(at))} · ${contributions(CAL.counts[at])}`}
        </p>
        <p className="heatmap__key" aria-hidden>
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <i key={l} className={`l${l}`} />
          ))}
          More
        </p>
      </div>
      <figcaption>
        <span lang="ja">草</span>, grass: what programmers in Japan call this chart. A square a day, the greener the
        busier, to {LAST}. More at <a href={`https://github.com/${CAL.login}`}>github.com/{CAL.login} ↗</a>
      </figcaption>
    </figure>
  );
}
