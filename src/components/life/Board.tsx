import { useEffect, useRef } from "react";
import type { Grid } from "@/lib/life/life";
import { ARC, byAge } from "@/lib/life/palette";

/** A grid drawn on black, cell by cell. `ages` colours a living cell by its age, else it takes `color`. */
export function Board({
  grid,
  color,
  cell,
  ages,
  onPointer,
  ghost,
  label,
  className = "",
}: {
  grid: Grid;
  color: string;
  cell: number;
  ages?: Uint16Array;
  onPointer?: (x: number, y: number, e: React.PointerEvent<HTMLCanvasElement>) => void;
  ghost?: Grid | null;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = ARC.black;
    ctx.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < grid.h; y++) {
      for (let x = 0; x < grid.w; x++) {
        const i = y * grid.w + x;
        const on = grid.cells[i];
        const bad = ghost && on !== ghost.cells[i];
        if (!on && !bad) continue;
        ctx.fillStyle = bad ? ARC.red : ages ? byAge(ages[i]) : color;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    if (cell >= 8) {
      ctx.fillStyle = ARC.grid;
      for (let i = 0; i <= grid.w; i++) ctx.fillRect(i * cell, 0, 1, c.height);
      for (let j = 0; j <= grid.h; j++) ctx.fillRect(0, j * cell, c.width, 1);
    }
  });
  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onPointer) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * grid.w);
    const y = Math.floor(((e.clientY - r.top) / r.height) * grid.h);
    if (x >= 0 && y >= 0 && x < grid.w && y < grid.h) onPointer(x, y, e);
  };
  return (
    <canvas
      ref={ref}
      className={`life__board ${className}`}
      width={grid.w * cell}
      height={grid.h * cell}
      role="img"
      aria-label={label}
      data-live={onPointer ? "" : undefined}
      onPointerDown={(e) => {
        if (onPointer) e.currentTarget.setPointerCapture(e.pointerId);
        hit(e);
      }}
      onPointerMove={(e) => e.buttons && hit(e)}
    />
  );
}
