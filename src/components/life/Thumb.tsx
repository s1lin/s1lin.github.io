import { Board } from "@/components/life/Board";
import { stamp } from "@/lib/life/life";
import { ARC } from "@/lib/life/palette";

/** A creature drawn small on black, padded by a cell, fitting `box` pixels. */
export function Thumb({ art, box = 84 }: { art: string[]; box?: number }) {
  const w = Math.max(...art.map((r) => r.length)) + 2;
  const h = art.length + 2;
  return <Board grid={stamp(w, h, art, 1, 1)} color={ARC.blue} cell={Math.max(3, Math.floor(box / Math.max(w, h)))} label="" />;
}
