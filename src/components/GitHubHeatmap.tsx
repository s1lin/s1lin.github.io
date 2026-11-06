import { useState, type PointerEvent } from "react";
import {
  CAL,
  CELL,
  DAYS,
  H,
  LEFT,
  MONTHS,
  SHIFT,
  STEP,
  TOP,
  W,
  WEEKDAYS,
  dayAt,
  dayOf,
  long,
  monthRows,
  rowAt,
  short,
  squareAt,
  thousands,
} from "@/lib/calendar";
import { SectionLabel } from "@/ui/section-label";

/*
 * The editor's last year on GitHub, a square a day, shaded as the profile page
 * shades it. scripts/github-data.py copies the counts into src/content/github.json
 * when the issue is built, so the squares are in the prerendered page and the
 * reader's browser never asks GitHub for anything. The grid is lib/calendar.ts:
 * a week to a row, read down the first column and then the second.
 */

const contributions = (n: number) =>
  n === 0 ? "No contributions" : n === 1 ? "1 contribution" : `${thousands(n)} contributions`;

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
    {monthRows().map(({ week, month }) => (
      <text key={week} x={rowAt(week).x + LEFT - 6} y={rowAt(week).y + CELL - 3} textAnchor="end">
        {MONTHS[month].slice(0, 3).toUpperCase()}
      </text>
    ))}
    {[0, 1].map((col) =>
      WEEKDAYS.map((d, i) => (
        <text key={`${col}${i}`} x={col * SHIFT + LEFT + i * STEP + CELL / 2} y={TOP - 5} textAnchor="middle">
          {d[0]}
        </text>
      )),
    )}
  </g>
);

const SQUARES = (
  <g>
    {CAL.counts.map((c, i) => {
      const { x, y } = squareAt(i);
      return (
        <rect key={i} className={`l${CAL.levels[i]}`} x={x} y={y} width={CELL} height={CELL}>
          <title>{`${contributions(c)} on ${WEEKDAYS[dayOf(i).getUTCDay()]}, ${long(dayOf(i))}`}</title>
        </rect>
      );
    })}
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
    setAt(dayAt(((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * H) / r.height));
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
          {at !== null && <rect className="heatmap__at" x={squareAt(at).x - 1} y={squareAt(at).y - 1} width={CELL + 2} height={CELL + 2} />}
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
        <span lang="ja">草</span>, grass: what programmers in Japan call this chart. A square a day and a week to a
        row, down one column and then the other, the greener the busier, to {LAST}. More at{" "}
        <a href={`https://github.com/${CAL.login}`}>github.com/{CAL.login} ↗</a>
      </figcaption>
    </figure>
  );
}
