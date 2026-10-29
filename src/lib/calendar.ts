import github from "@/content/github.json";

/*
 * The year the GitHub heatmap draws, and its grid: a column a week, Sunday to
 * Saturday top to bottom, as on GitHub. The token skyline under it stands on
 * the same columns (components/TokenSkyline.tsx).
 */

export type Calendar = { login: string; total: number; start: string; counts: number[]; levels: number[] };
export const CAL: Calendar = github;

export const CELL = 8; // a day's square
export const STEP = 10; // square to square
export const LEFT = 26; // room for the weekday names
export const TOP = 14; // room for the month names

export const MONTHS = "January February March April May June July August September October November December".split(" ");
export const WEEKDAYS = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" ");
export const DAY = 86_400_000;

export const FIRST = Date.parse(CAL.start);
export const OFFSET = new Date(FIRST).getUTCDay();
export const DAYS = CAL.counts.length;
export const WEEKS = Math.ceil((OFFSET + DAYS) / 7);
// The last gap stays, as room for the outline round the day under the pointer.
export const W = LEFT + WEEKS * STEP;

/* Dates in UTC and spelt out by hand, so the server and every browser print the same. */
export const dayOf = (i: number) => new Date(FIRST + i * DAY);
export const long = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
export const short = (d: Date) =>
  `${WEEKDAYS[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;
export const thousands = (n: number) => n.toLocaleString("en-US");

/** The column a day's square stands in. */
export const weekOf = (i: number) => Math.floor((i + OFFSET) / 7);
/** The week under a pointer on a drawing W units wide, or -1 off the columns. */
export const weekAt = (clientX: number, box: DOMRect) => {
  const w = Math.floor((((clientX - box.left) * W) / box.width - LEFT) / STEP);
  return w >= 0 && w < WEEKS ? w : -1;
};
