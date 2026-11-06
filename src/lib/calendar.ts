import github from "@/content/github.json";

/*
 * The year the GitHub heatmap draws, and its grid: a row a week, Sunday to
 * Saturday left to right, as on a wall calendar, and the weeks downwards. A
 * year is 53 rows, so it is set in two columns, like the page's type: the first
 * half of the year down the left, the second down the right.
 */

export type Calendar = { login: string; total: number; start: string; counts: number[]; levels: number[] };
export const CAL: Calendar = github;

export const CELL = 13; // a day's square
export const STEP = 16; // square to square
export const LEFT = 26; // room for the month names, left of each column of weeks
export const TOP = 16; // room for the weekday letters, over each column
export const GAP = 18; // between the two columns

export const MONTHS = "January February March April May June July August September October November December".split(" ");
export const WEEKDAYS = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" ");
export const DAY = 86_400_000;

export const FIRST = Date.parse(CAL.start);
export const OFFSET = new Date(FIRST).getUTCDay();
export const DAYS = CAL.counts.length;
export const WEEKS = Math.ceil((OFFSET + DAYS) / 7);
/** Weeks in a column: the first column has the odd one. */
export const ROWS = Math.ceil(WEEKS / 2);
/** A column of weeks with its month names, and how far the second stands from the first. */
export const BLOCK = LEFT + 7 * STEP;
export const SHIFT = BLOCK + GAP;
// The last gaps stay, as room for the outline round the day under the pointer.
export const W = SHIFT + BLOCK;
export const H = TOP + ROWS * STEP;

/* Dates in UTC and spelt out by hand, so the server and every browser print the same. */
export const dayOf = (i: number) => new Date(FIRST + i * DAY);
export const long = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
export const short = (d: Date) =>
  `${WEEKDAYS[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;
export const thousands = (n: number) => n.toLocaleString("en-US");

/** The week a day falls in, counted from the first. */
export const weekOf = (i: number) => Math.floor((i + OFFSET) / 7);
/** Where a week's row starts: its column's left edge (before the month names) and its top. */
export const rowAt = (week: number) => {
  const col = week < ROWS ? 0 : 1;
  return { x: col * SHIFT, y: TOP + (week - col * ROWS) * STEP };
};
/** The top left corner of a day's square. */
export const squareAt = (i: number) => {
  const { x, y } = rowAt(weekOf(i));
  return { x: x + LEFT + ((i + OFFSET) % 7) * STEP, y };
};
/**
 * The day under a point of the drawing, in its own units, or null off the squares. The gap after a square is its
 * own, so the pointer never falls between two days.
 */
export const dayAt = (x: number, y: number): number | null => {
  const col = x >= SHIFT ? 1 : 0;
  const d = Math.floor((x - col * SHIFT - LEFT) / STEP);
  const row = Math.floor((y - TOP) / STEP);
  if (d < 0 || d > 6 || row < 0 || row >= ROWS) return null;
  const i = (col * ROWS + row) * 7 + d - OFFSET;
  return i >= 0 && i < DAYS ? i : null;
};

/** The month a week's row is in, by its first day. */
export const monthOf = (week: number) => dayOf(Math.max(0, week * 7 - OFFSET)).getUTCMonth();

/**
 * The month names down the left of each column: one where a month begins, and one at the head of a column for the
 * month it opens in, unless a new one begins in its next row. Never two in rows next to each other.
 */
export function monthRows() {
  const names: { week: number; month: number }[] = [];
  for (const [first, last] of [
    [0, ROWS],
    [ROWS, WEEKS],
  ]) {
    const col: { week: number; month: number }[] = [];
    for (let week = first; week < last; week++) {
      const month = monthOf(week);
      if (week === first || month !== monthOf(week - 1)) col.push({ week, month });
    }
    names.push(...col.filter((n, i) => i === col.length - 1 || col[i + 1].week - n.week >= 2));
  }
  return names;
}
