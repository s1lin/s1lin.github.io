/** Named creatures, as rows of "." and "#". Period and shift are checked by the tests. */
export interface Pattern {
  id: string;
  name: string;
  art: string[];
  kind: "still life" | "oscillator" | "spaceship" | "methuselah";
  /** Generations until it repeats, up to a move. 0 for one that settles or dies. */
  period: number;
  /** Cells moved per period, [dx, dy]; [0, 0] when it stays. */
  shift: [number, number];
  note: string;
}

export const PATTERNS: Pattern[] = [
  { id: "block", name: "Block", kind: "still life", period: 1, shift: [0, 0], art: ["##", "##"], note: "The smallest square of four that nothing can break." },
  { id: "beehive", name: "Beehive", kind: "still life", period: 1, shift: [0, 0], art: [".##.", "#..#", ".##."], note: "Six cells, each held by exactly two or three friends." },
  { id: "blinker", name: "Blinker", kind: "oscillator", period: 2, shift: [0, 0], art: ["###"], note: "Three in a row; it stands up, lies down, forever." },
  { id: "toad", name: "Toad", kind: "oscillator", period: 2, shift: [0, 0], art: [".###", "###."], note: "Two rows of three, offset by one, swapping places." },
  {
    id: "pulsar",
    name: "Pulsar",
    kind: "oscillator",
    period: 3,
    shift: [0, 0],
    art: [
      "..###...###..",
      ".............",
      "#....#.#....#",
      "#....#.#....#",
      "#....#.#....#",
      "..###...###..",
      ".............",
      "..###...###..",
      "#....#.#....#",
      "#....#.#....#",
      "#....#.#....#",
      ".............",
      "..###...###..",
    ],
    note: "Forty-eight cells in four mirrored arms, period 3.",
  },
  { id: "glider", name: "Glider", kind: "spaceship", period: 4, shift: [1, 1], art: [".#.", "..#", "###"], note: "Five cells that walk one square diagonally every four generations." },
  { id: "lwss", name: "Lightweight spaceship", kind: "spaceship", period: 4, shift: [-2, 0], art: [".#..#", "#....", "#...#", "####."], note: "Two squares to the left in four generations: half the speed of light, the fastest a straight mover can go." },
  { id: "r-pentomino", name: "R-pentomino", kind: "methuselah", period: 0, shift: [0, 0], art: [".##", "##.", ".#."], note: "Five cells that take 1,103 generations to settle, shedding gliders on the way." },
  { id: "diehard", name: "Diehard", kind: "methuselah", period: 0, shift: [0, 0], art: ["......#.", "##......", ".#...###"], note: "Seven cells that vanish, but not before generation 130." },
];

export const pattern = (id: string): Pattern => {
  const p = PATTERNS.find((q) => q.id === id);
  if (!p) throw new Error(`no pattern ${id}`);
  return p;
};
