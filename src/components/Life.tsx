import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Runhead } from "@/components/Runhead";
import { advance, clone, equals, make, parse, step, type Grid } from "@/lib/life/life";
import { LEVELS, answer, given } from "@/lib/life/levels";
import gliderGun from "@/lib/life/seeds/glider-gun.txt?raw";
import twoGliderGuns from "@/lib/life/seeds/two-glider-guns.txt?raw";

/** The ARC palette: 0 black, 1 blue, 2 red, 3 green, 4 yellow. */
const ARC = { black: "#000000", blue: "#0074D9", red: "#FF4136", green: "#2ECC40", yellow: "#FFDC00", grid: "#3a3a3a" };

function Board({
  grid,
  color,
  cell,
  onToggle,
  ghost,
  label,
}: {
  grid: Grid;
  color: string;
  cell: number;
  onToggle?: (x: number, y: number) => void;
  ghost?: Grid | null;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lines = cell >= 8;
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = ARC.black;
    ctx.fillRect(0, 0, c.width, c.height);
    for (let y = 0; y < grid.h; y++) {
      for (let x = 0; x < grid.w; x++) {
        const on = grid.cells[y * grid.w + x];
        const bad = ghost && on !== ghost.cells[y * grid.w + x];
        if (!on && !bad) continue;
        ctx.fillStyle = bad ? ARC.red : color;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    if (lines) {
      ctx.fillStyle = ARC.grid;
      for (let i = 0; i <= grid.w; i++) ctx.fillRect(i * cell, 0, 1, c.height);
      for (let j = 0; j <= grid.h; j++) ctx.fillRect(0, j * cell, c.width, 1);
    }
  }, [grid, color, cell, ghost, lines]);
  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onToggle) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * grid.w);
    const y = Math.floor(((e.clientY - r.top) / r.height) * grid.h);
    if (x >= 0 && y >= 0 && x < grid.w && y < grid.h) onToggle(x, y);
  };
  return (
    <canvas
      ref={ref}
      className="life__board"
      width={grid.w * cell}
      height={grid.h * cell}
      role="img"
      aria-label={label}
      data-live={onToggle ? "" : undefined}
      onPointerDown={hit}
    />
  );
}

const store = {
  read(): number {
    try {
      return Math.min(LEVELS.length, Number(localStorage.getItem("life-level")) || 0);
    } catch {
      return 0;
    }
  },
  write(n: number) {
    try {
      localStorage.setItem("life-level", String(n));
    } catch {
      /* private mode: progress lasts until reload */
    }
  },
};

function Puzzle({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(() => store.read());
  const next = () => {
    const n = index + 1;
    store.write(n);
    if (n >= LEVELS.length) onDone();
    else setIndex(n);
  };
  // Keyed by level, so each starts with fresh state.
  return <Round key={index} index={index} next={next} />;
}

function Round({ index, next }: { index: number; next: () => void }) {
  const [actions, setActions] = useState(0);
  const [tries, setTries] = useState(0);
  const [verdict, setVerdict] = useState<"" | "no" | "yes">("");
  const level = LEVELS[Math.min(index, LEVELS.length - 1)];
  const start = useMemo(() => given(level), [level]);
  const target = useMemo(() => answer(level), [level]);
  const [mine, setMine] = useState<Grid>(() => clone(start));
  const undo = useRef<Grid[]>([]);

  const toggle = useCallback((x: number, y: number) => {
    setMine((g) => {
      undo.current.push(g);
      const n = clone(g);
      n.cells[y * g.w + x] ^= 1;
      return n;
    });
    setActions((a) => a + 1);
    setVerdict("");
  }, []);
  const back = useCallback(() => {
    const prev = undo.current.pop();
    if (prev) {
      setMine(prev);
      setActions((a) => a + 1);
    }
  }, []);
  const submit = useCallback(() => {
    if (equals(mine, target)) {
      setVerdict("yes");
    } else {
      setVerdict("no");
      setTries((t) => t + 1);
    }
  }, [mine, target]);
  const reset = () => {
    setMine(clone(start));
    undo.current = [];
    setVerdict("");
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") (verdict === "yes" ? next : submit)();
      else if (e.key === "z" || e.key === "Z") back();
      else if (e.key === "r" || e.key === "R") reset();
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  const cell = start.w > 10 ? 22 : 28;
  return (
    <div className="life__puzzle">
      <p className="life__meta">
        <span>
          Level {index + 1} / {LEVELS.length}
        </span>
        <span>Actions {actions}</span>
        <span>Wrong {tries}</span>
      </p>
      <div className="life__pair">
        <figure>
          <Board grid={start} color={ARC.blue} cell={cell} label="Given grid" />
          <figcaption>in</figcaption>
        </figure>
        <span className="life__arrow" aria-hidden>
          → {level.gens}
        </span>
        <figure>
          <Board grid={mine} color={ARC.green} cell={cell} onToggle={toggle} label="Your grid: click cells to flip them" />
          <figcaption>out</figcaption>
        </figure>
      </div>
      <div className="life__bar">
        {verdict === "yes" ? (
          <button type="button" className="life__btn life__btn--go" onClick={next}>
            Solved · next ⏎
          </button>
        ) : (
          <button type="button" className="life__btn life__btn--go" onClick={submit}>
            Submit ⏎
          </button>
        )}
        <button type="button" className="life__btn" onClick={back}>
          Undo Z
        </button>
        <button type="button" className="life__btn" onClick={reset}>
          Reset R
        </button>
        <span className="life__verdict" aria-live="polite" data-v={verdict}>
          {verdict === "no" ? "Not that." : verdict === "yes" ? `Solved in ${actions} actions.` : ""}
        </span>
      </div>
    </div>
  );
}

const SEEDS = { "Glider gun": gliderGun, "Two glider guns": twoGliderGuns, Empty: "" } as const;

function Sandbox() {
  const [seed, setSeed] = useState<keyof typeof SEEDS>("Glider gun");
  const [grid, setGrid] = useState<Grid>(() => parse(SEEDS["Glider gun"]));
  const [gen, setGen] = useState(0);
  const [run, setRun] = useState(true);
  const [wrap, setWrap] = useState(false);
  const [fps, setFps] = useState(20);
  const load = (s: keyof typeof SEEDS) => {
    setSeed(s);
    setGrid(s === "Empty" ? make(160, 135) : parse(SEEDS[s]));
    setGen(0);
  };
  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => {
      setGrid((g) => step(g, wrap));
      setGen((n) => n + 1);
    }, 1000 / fps);
    return () => clearInterval(t);
  }, [run, wrap, fps]);
  const flip = useCallback((x: number, y: number) => {
    setGrid((g) => {
      const n = clone(g);
      n.cells[y * g.w + x] ^= 1;
      return n;
    });
  }, []);
  return (
    <div className="life__sandbox">
      <div className="life__bar">
        {Object.keys(SEEDS).map((s) => (
          <button key={s} type="button" className="life__btn" aria-pressed={seed === s} onClick={() => load(s as keyof typeof SEEDS)}>
            {s}
          </button>
        ))}
        <button type="button" className="life__btn life__btn--go" onClick={() => setRun((r) => !r)}>
          {run ? "Pause" : "Run"}
        </button>
        <button
          type="button"
          className="life__btn"
          onClick={() => {
            setRun(false);
            setGrid((g) => step(g, wrap));
            setGen((n) => n + 1);
          }}
        >
          Step
        </button>
        <label className="life__opt">
          <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} /> wrap edges
        </label>
        <label className="life__opt">
          speed <input type="range" min={2} max={60} value={fps} onChange={(e) => setFps(Number(e.target.value))} />
        </label>
        <span className="life__verdict">gen {gen}</span>
      </div>
      <Board grid={grid} color={ARC.green} cell={5} onToggle={flip} label="Life board, 160 by 135: click to flip a cell" />
    </div>
  );
}

export function LifePage() {
  const [mode, setMode] = useState<"puzzle" | "sandbox">("puzzle");
  // Kept so a solver can check their own reading of the rule against the engine.
  useEffect(() => {
    (window as unknown as { life: object }).life = { step, advance, parse };
  }, []);
  return (
    <>
      <Runhead label="ライフ · Life — a grid, a rule, no instructions" home="/" />
      <main className="life wrap">
        <h1 className="life__title">Life</h1>
        <p className="life__lede">
          A grid goes in. Work out what it becomes. The rule is not stated; the grid is the only evidence you get.
        </p>
        <nav className="life__tabs" aria-label="Mode">
          <button type="button" aria-pressed={mode === "puzzle"} onClick={() => setMode("puzzle")}>
            Puzzles
          </button>
          <button type="button" aria-pressed={mode === "sandbox"} onClick={() => setMode("sandbox")}>
            Glider guns
          </button>
        </nav>
        {mode === "puzzle" ? <Puzzle onDone={() => setMode("sandbox")} /> : <Sandbox />}
        <p className="life__foot">
          Lifted from a Java Game of Life built on the ACM graphics library, and its two glider-gun seeds, into TypeScript. The
          engine is MIT-licensed and has no dependencies.
        </p>
      </main>
    </>
  );
}
