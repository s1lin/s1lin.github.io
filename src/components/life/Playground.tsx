import { useCallback, useEffect, useRef, useState } from "react";
import { Board } from "@/components/life/Board";
import { ARC } from "@/lib/life/palette";
import { PATTERNS, pattern } from "@/lib/life/patterns";
import { clone, make, parse, population, step, type Grid } from "@/lib/life/life";
import gliderGun from "@/lib/life/seeds/glider-gun.txt?raw";
import twoGliderGuns from "@/lib/life/seeds/two-glider-guns.txt?raw";

const W = 160;
const H = 135;
type Tool = "draw" | string;

/** Next ages: a cell that lived on is a generation older, a newborn is 1. */
function aged(prev: Grid, ages: Uint16Array, next: Grid): Uint16Array {
  return Uint16Array.from(next.cells, (v, i) => (v ? (prev.cells[i] ? ages[i] + 1 : 1) : 0));
}

/** A big board to play on: draw, stamp creatures, scatter a soup, load the two guns, run it, step it. */
export function Playground() {
  const [grid, setGrid] = useState<Grid>(() => parse(gliderGun));
  const [ages, setAges] = useState<Uint16Array>(() => Uint16Array.from(parse(gliderGun).cells));
  const [gen, setGen] = useState(0);
  const [run, setRun] = useState(true);
  const [wrap, setWrap] = useState(false);
  const [fps, setFps] = useState(24);
  const [tool, setTool] = useState<Tool>("draw");
  const [trail, setTrail] = useState<number[]>([]);
  const ref = useRef({ grid, ages, wrap });
  useEffect(() => {
    ref.current = { grid, ages, wrap };
  });

  const put = useCallback((g: Grid, a?: Uint16Array) => {
    setGrid(g);
    setAges(a ?? Uint16Array.from(g.cells));
  }, []);
  const advance = useCallback(() => {
    const { grid: g, ages: a, wrap: w } = ref.current;
    const n = step(g, w);
    setAges(aged(g, a, n));
    setGrid(n);
    setGen((x) => x + 1);
    setTrail((t) => [...t.slice(-239), population(n)]);
  }, []);
  useEffect(() => {
    if (!run) return;
    const t = setInterval(advance, 1000 / fps);
    return () => clearInterval(t);
  }, [run, fps, advance]);

  const load = (g: Grid) => {
    put(g);
    setGen(0);
    setTrail([population(g)]);
  };
  const soup = () => {
    const g = make(W, H);
    for (let i = 0; i < g.cells.length; i++) g.cells[i] = Math.random() < 0.22 ? 1 : 0;
    load(g);
  };
  const point = (x: number, y: number, e: React.PointerEvent) => {
    const { grid: g, ages: a } = ref.current;
    const n = clone(g);
    const na = a.slice();
    if (tool === "draw") {
      const on = e.type === "pointerdown" ? (g.cells[y * W + x] ? 0 : 1) : e.shiftKey || e.buttons === 2 ? 0 : 1;
      n.cells[y * W + x] = on;
      na[y * W + x] = on ? 1 : 0;
    } else if (e.type === "pointerdown") {
      pattern(tool).art.forEach((row, j) =>
        [...row].forEach((c, i) => {
          const px = x + i;
          const py = y + j;
          if (c === "#" && px < W && py < H) {
            n.cells[py * W + px] = 1;
            na[py * W + px] = 1;
          }
        }),
      );
    }
    put(n, na);
  };

  return (
    <div className="life__playground">
      <div className="life__bar">
        <button type="button" className="life__btn life__btn--go" onClick={() => setRun((r) => !r)}>
          {run ? "Pause" : "Run"}
        </button>
        <button type="button" className="life__btn" onClick={() => { setRun(false); advance(); }}>
          Step
        </button>
        <button type="button" className="life__btn" onClick={soup}>
          Soup
        </button>
        <button type="button" className="life__btn" onClick={() => load(make(W, H))}>
          Clear
        </button>
        <button type="button" className="life__btn" onClick={() => load(parse(gliderGun))}>
          Gun
        </button>
        <button type="button" className="life__btn" onClick={() => load(parse(twoGliderGuns))}>
          Two guns
        </button>
        <label className="life__opt">
          <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} /> wrap edges
        </label>
        <label className="life__opt">
          speed <input type="range" min={2} max={60} value={fps} onChange={(e) => setFps(Number(e.target.value))} />
        </label>
      </div>
      <div className="life__stamps" role="group" aria-label="Brush">
        <button type="button" aria-pressed={tool === "draw"} onClick={() => setTool("draw")}>
          ✎ draw
        </button>
        {PATTERNS.map((p) => (
          <button key={p.id} type="button" aria-pressed={tool === p.id} onClick={() => setTool(p.id)} title={p.note}>
            {p.name}
          </button>
        ))}
      </div>
      <Board grid={grid} ages={ages} color={ARC.green} cell={5} onPointer={point} label="Life board, 160 by 135: draw, or stamp a creature" className="life__big" />
      <p className="life__stats">
        <span>gen {gen}</span>
        <span>alive {population(grid)}</span>
        <span className="life__legend">
          <i style={{ background: ARC.yellow }} />new <i style={{ background: ARC.green }} />young <i style={{ background: ARC.blue }} />settled <i style={{ background: ARC.magenta }} />ancient
        </span>
        <Spark values={trail} />
      </p>
    </div>
  );
}

/** The population over the last 240 generations. */
function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${i},${(24 - (24 * v) / max).toFixed(1)}`).join(" ");
  return (
    <svg className="life__spark" viewBox="0 0 240 24" preserveAspectRatio="none" role="img" aria-label="Population over time">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
