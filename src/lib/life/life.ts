/** Conway's Game of Life on a rectangular grid. Zero dependencies. */

export interface Grid {
  readonly w: number;
  readonly h: number;
  /** Row-major, 1 = alive. */
  readonly cells: Uint8Array;
}

export const make = (w: number, h: number): Grid => ({ w, h, cells: new Uint8Array(w * h) });

export const clone = (g: Grid): Grid => ({ w: g.w, h: g.h, cells: g.cells.slice() });

export const get = (g: Grid, x: number, y: number): number =>
  x < 0 || y < 0 || x >= g.w || y >= g.h ? 0 : g.cells[y * g.w + x];

export const equals = (a: Grid, b: Grid): boolean =>
  a.w === b.w && a.h === b.h && a.cells.every((v, i) => v === b.cells[i]);

export const population = (g: Grid): number => g.cells.reduce((n, v) => n + v, 0);

/**
 * One generation. Rule B3/S23. With `wrap` the edges meet (a torus); without it
 * everything outside the grid is dead, as in the original Java assignment.
 */
export function step(g: Grid, wrap = false): Grid {
  const { w, h } = g;
  const out = make(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          n += wrap ? g.cells[((y + dy + h) % h) * w + ((x + dx + w) % w)] : get(g, x + dx, y + dy);
        }
      }
      out.cells[y * w + x] = n === 3 || (n === 2 && g.cells[y * w + x] === 1) ? 1 : 0;
    }
  }
  return out;
}

export function advance(g: Grid, n: number, wrap = false): Grid {
  for (let i = 0; i < n; i++) g = step(g, wrap);
  return g;
}

/** Text grid of 0/1 characters, one row per line (the format of the Java seed files). */
export function parse(text: string): Grid {
  const rows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
  const w = Math.max(...rows.map((r) => r.length));
  const g = make(w, rows.length);
  rows.forEach((r, y) => [...r].forEach((c, x) => (g.cells[y * w + x] = c === "1" || c === "#" || c === "O" ? 1 : 0)));
  return g;
}

export const serialize = (g: Grid): string =>
  Array.from({ length: g.h }, (_, y) => Array.from(g.cells.subarray(y * g.w, (y + 1) * g.w), String).join("")).join("\n");

/** Place a small pattern (rows of "." and "#") on a fresh grid at (x, y). */
export function stamp(w: number, h: number, art: string[], x = 0, y = 0): Grid {
  const g = make(w, h);
  art.forEach((row, j) => [...row].forEach((c, i) => c === "#" && (g.cells[(y + j) * w + x + i] = 1)));
  return g;
}
