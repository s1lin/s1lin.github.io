/*
 * Brick Locator's sample, borrowed from /brick-locator/ on this same origin
 * (the s1lin/brick-locator repo): the booklet's index and the two pages that
 * add its sample part. Nothing is copied into this site, so the LEGO extract
 * stays in the one repo that tests it.
 */

export const BRICK = "/brick-locator/";

export type Box = [number, number, number, number];
export type Use = { step: number; page: number; last_page: number; quantity: number; bbox: Box };
export type Part = { id: string; quantity: number; page: number; image_bbox: Box; uses: Use[] };
export type Book = {
  title: string;
  set: string;
  width: number;
  height: number;
  sample_part: string;
  parts: Part[];
};

export async function loadBook(): Promise<Book> {
  const r = await fetch(`${BRICK}books/40517.json`);
  if (!r.ok) throw new Error(`brick-locator index: ${r.status}`);
  return r.json() as Promise<Book>;
}

/** The sample: the pages that add one part, and its picture, as printed. */
export const samplePage = (page: number) => `${BRICK}sample/page-${page}.png`;
export const samplePicture = (id: string) => `${BRICK}sample/part-${id}.png`;
