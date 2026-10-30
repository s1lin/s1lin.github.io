import { MAX_SHAPE } from "./client.ts";

export interface ShapeData {
  w: number;
  h: number;
  /** Row strings of 0 and 1. */
  cells: string[];
}

export type CropResult = { ok: true; shape: ShapeData } | { ok: false; why: "empty" | "big"; w?: number; h?: number };

/** The live cells cut to their bounding box, as rows of 0 and 1. */
export function cropShape(grid: { w: number; h: number; cells: ArrayLike<number> }): CropResult {
  let x0 = grid.w;
  let y0 = grid.h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < grid.h; y++) {
    for (let x = 0; x < grid.w; x++) {
      if (!grid.cells[y * grid.w + x]) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return { ok: false, why: "empty" };
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  if (w > MAX_SHAPE || h > MAX_SHAPE) return { ok: false, why: "big", w, h };
  const cells = Array.from({ length: h }, (_, j) => Array.from({ length: w }, (_, i) => (grid.cells[(y0 + j) * grid.w + x0 + i] ? "1" : "0")).join(""));
  return { ok: true, shape: { w, h, cells } };
}

/** A shape put in the middle of an empty grid of the given size, as 0/1 cells; null if it does not fit. */
export function centre(shape: ShapeData, w: number, h: number): Uint8Array | null {
  if (shape.w > w || shape.h > h) return null;
  const out = new Uint8Array(w * h);
  const ox = Math.floor((w - shape.w) / 2);
  const oy = Math.floor((h - shape.h) / 2);
  shape.cells.forEach((row, j) => [...row].forEach((c, i) => (out[(oy + j) * w + ox + i] = c === "1" ? 1 : 0)));
  return out;
}

// A shape picked in the gallery waits here until the launch pad is open to take it.
let pending: ShapeData | null = null;

/** Ask the launch pad to load a shape; the Life page opens it if it is not open. */
export function requestShape(d: ShapeData): void {
  pending = d;
  window.dispatchEvent(new CustomEvent("life:load-shape", { detail: d }));
}

export function takePendingShape(): ShapeData | null {
  const p = pending;
  pending = null;
  return p;
}
