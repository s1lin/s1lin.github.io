import { advance, stamp, type Grid } from "./life.ts";

/** A puzzle in the ARC manner: a grid in, a grid out, and no rule given. */
export interface Level {
  id: string;
  size: number;
  /** The given grid, as rows of "." and "#". */
  art: string[];
  at: [number, number];
  /** Generations to look ahead. */
  gens: number;
}

export const LEVELS: Level[] = [
  { id: "corner", size: 8, art: ["##", "#."], at: [3, 3], gens: 1 },
  { id: "blinker", size: 8, art: ["###"], at: [2, 3], gens: 1 },
  { id: "two-blinkers", size: 10, art: ["###..", ".....", ".....", ".....", "..###"], at: [2, 2], gens: 3 },
  { id: "toad", size: 10, art: [".###", "###."], at: [3, 4], gens: 1 },
  { id: "glider", size: 10, art: [".#.", "..#", "###"], at: [1, 1], gens: 4 },
  { id: "glider-far", size: 12, art: [".#.", "..#", "###"], at: [1, 1], gens: 12 },
  { id: "r-pentomino", size: 14, art: [".##", "##.", ".#."], at: [5, 5], gens: 5 },
  { id: "pi", size: 14, art: ["###", "#.#", "#.#"], at: [5, 5], gens: 6 },
];

export const given = (l: Level): Grid => stamp(l.size, l.size, l.art, l.at[0], l.at[1]);
export const answer = (l: Level): Grid => advance(given(l), l.gens);
