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

/* GitHub's mark (Octicons mark-github, MIT), on a 16-unit square, in the ink. */
const GITHUB_MARK = (
  <svg viewBox="0 0 16 16" focusable="false">
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
  </svg>
);

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
      <SectionLabel as="h3" mark={GITHUB_MARK}>
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
        Grass (<span lang="ja">草</span>) is what programmers in Japan call this chart. A square a day and a week to a
        row, down one column and then the other, the greener the busier, to {LAST}. More at{" "}
        <a href={`https://github.com/${CAL.login}`}>github.com/{CAL.login} ↗</a>
      </figcaption>
    </figure>
  );
}
