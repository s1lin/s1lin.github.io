import { useCallback, useEffect, useRef, useState } from "react";
import { Board } from "@/components/life/Board";
import { ARC } from "@/lib/life/palette";
import { useCopy } from "@/components/life/lang";
import { Thumb } from "@/components/life/Thumb";
import { PATTERNS, pattern } from "@/lib/life/patterns";
import { clone, make, parse, population, step, type Grid } from "@/lib/life/life";
import gliderGun from "@/lib/life/seeds/glider-gun.txt?raw";
import twoGliderGuns from "@/lib/life/seeds/two-glider-guns.txt?raw";

/** The launch pad grows with the player: a bigger board and more in the toolbox at each stage. */
const STAGES: { w: number; h: number; cell: number; tools: string[]; soup: boolean; seeds: boolean }[] = [
  { w: 16, h: 12, cell: 26, tools: ["block", "blinker", "glider"], soup: false, seeds: false },
  { w: 40, h: 30, cell: 14, tools: ["block", "blinker", "glider", "beehive", "toad", "pulsar", "lwss"], soup: false, seeds: false },
  { w: 80, h: 60, cell: 9, tools: ["block", "blinker", "glider", "beehive", "toad", "pulsar", "lwss", "r-pentomino", "diehard"], soup: true, seeds: false },
  { w: 160, h: 135, cell: 5, tools: PATTERNS.map((p) => p.id), soup: true, seeds: true },
];

/** Next ages: a cell that lived on is a generation older, a newborn is 1. */
function aged(prev: Grid, ages: Uint16Array, next: Grid): Uint16Array {
  return Uint16Array.from(next.cells, (v, i) => (v ? (prev.cells[i] ? ages[i] + 1 : 1) : 0));
}

/** The launch pad: a stepper over the four stages, and the stage in play. */
export function Playground() {
  const copy = useCopy().pad;
  // ?stage=4 opens every stage, for testing.
  const [open, first] = (() => {
    const n = Number(new URLSearchParams(location.search).get("stage"));
    return n >= 1 && n <= 4 ? [4, n - 1] : [1, 0];
  })();
  const [stage, setStage] = useState(first);
  const [unlocked, setUnlocked] = useState(open);
  return (
    <div className="pad">
      <ol className="pad__stages" aria-label={copy.stageLabel}>
        {copy.stages.map((s, i) => (
          <li key={s.name}>
            <button
              type="button"
              aria-current={i === stage ? "step" : undefined}
              disabled={i >= unlocked}
              title={i >= unlocked ? copy.locked : undefined}
              onClick={() => setStage(i)}
            >
              <b>{i + 1}</b>
              {s.name}
            </button>
          </li>
        ))}
      </ol>
      <p className="pad__goal">{copy.stages[stage].goal}</p>
      <Pad key={stage} index={stage} onRan={() => setUnlocked((u) => Math.max(u, stage + 2))} />
    </div>
  );
}

function Pad({ index, onRan }: { index: number; onRan: () => void }) {
  const copy = useCopy();
  const t = copy.pad;
  const cfg = STAGES[index];
  const { w: W, h: H } = cfg;
  const empty = () => make(W, H);
  const [grid, setGrid] = useState<Grid>(empty);
  const [ages, setAges] = useState<Uint16Array>(() => new Uint16Array(W * H));
  const [gen, setGen] = useState(0);
  const [run, setRun] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [fps, setFps] = useState(index === 0 ? 4 : 12);
  const [tool, setTool] = useState<string>("draw");
  const [trail, setTrail] = useState<number[]>([]);
  const live = useRef({ grid, ages, wrap });

  const put = useCallback((g: Grid, a?: Uint16Array) => {
    const na = a ?? Uint16Array.from(g.cells);
    live.current = { ...live.current, grid: g, ages: na };
    setGrid(g);
    setAges(na);
  }, []);
  const advance = useCallback(() => {
    const { grid: g, ages: a, wrap: w } = live.current;
    const n = step(g, w);
    put(n, aged(g, a, n));
    setGen((x) => x + 1);
    setTrail((tr) => [...tr.slice(-239), population(n)]);
  }, [put]);
  useEffect(() => {
    if (!run) return;
    const id = setInterval(advance, 1000 / fps);
    return () => clearInterval(id);
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
    const { grid: g, ages: a } = live.current;
    const n = clone(g);
    const na = a.slice();
    if (tool === "draw") {
      const on = e.type === "pointerdown" ? (g.cells[y * W + x] ? 0 : 1) : e.shiftKey ? 0 : 1;
      n.cells[y * W + x] = on;
      na[y * W + x] = on ? 1 : 0;
    } else if (e.type === "pointerdown") {
      pattern(tool).art.forEach((row, j) =>
        [...row].forEach((c, i) => {
          if (c === "#" && x + i < W && y + j < H) {
            n.cells[(y + j) * W + x + i] = 1;
            na[(y + j) * W + x + i] = 1;
          }
        }),
      );
    }
    put(n, na);
  };
  const toggleRun = () => {
    if (!run) onRan();
    setRun((r) => !r);
  };

  return (
    <div className="pad__grid">
      <aside className="pad__tools" aria-label={t.toolbox}>
        <h3>{t.toolbox}</h3>
        <section>
          <h4>{t.draw.replace("✎ ", "")}</h4>
          <button type="button" className="pad__tool" aria-pressed={tool === "draw"} onClick={() => setTool("draw")}>
            {t.draw}
          </button>
          <p className="pad__hint">{t.drawHint}</p>
        </section>
        <section>
          <h4>{t.creatures}</h4>
          {PATTERNS.filter((p) => cfg.tools.includes(p.id)).map((p) => (
            <button key={p.id} type="button" className="pad__tool pad__tool--creature" aria-pressed={tool === p.id} onClick={() => setTool(p.id)} title={copy.creatures[p.id].note}>
              <Thumb art={p.art} box={30} />
              <span>{copy.creatures[p.id].name}</span>
            </button>
          ))}
        </section>
        <section>
          <h4>{t.seeds}</h4>
          <div className="pad__seeds">
            {cfg.soup && (
              <button type="button" className="life__btn" onClick={soup}>
                {t.soup}
              </button>
            )}
            {cfg.seeds && (
              <>
                <button type="button" className="life__btn" onClick={() => load(parse(gliderGun))}>
                  {t.gun}
                </button>
                <button type="button" className="life__btn" onClick={() => load(parse(twoGliderGuns))}>
                  {t.twoGuns}
                </button>
              </>
            )}
            <button type="button" className="life__btn" onClick={() => load(empty())}>
              {t.clear}
            </button>
          </div>
        </section>
      </aside>

      <div className="pad__stage">
        <div className="pad__transport" role="group" aria-label={t.transport}>
          <button type="button" className="life__btn life__btn--go" onClick={toggleRun}>
            {run ? t.pauseBtn : t.runBtn}
          </button>
          <button
            type="button"
            className="life__btn"
            onClick={() => {
              setRun(false);
              advance();
            }}
          >
            {t.stepBtn}
          </button>
          <label className="life__opt">
            {t.speed} <input type="range" min={1} max={60} value={fps} onChange={(e) => setFps(Number(e.target.value))} />
          </label>
        </div>
        <Board grid={grid} ages={ages} color={ARC.green} cell={cfg.cell} onPointer={point} label={t.stages[index].name} className="life__big" />
      </div>

      <aside className="pad__read" aria-label={t.readout}>
        <h3>{t.readout}</h3>
        <dl>
          <dt>{t.gen}</dt>
          <dd>{gen}</dd>
          <dt>{t.alive}</dt>
          <dd>{population(grid)}</dd>
        </dl>
        <ul className="pad__legend">
          {[ARC.yellow, ARC.green, ARC.blue, ARC.magenta].map((c, i) => (
            <li key={c}>
              <i style={{ background: c }} />
              {t.ages[i]}
            </li>
          ))}
        </ul>
        <Spark values={trail} />
        <label className="life__opt">
          <input
            type="checkbox"
            checked={wrap}
            onChange={(e) => {
              live.current.wrap = e.target.checked;
              setWrap(e.target.checked);
            }}
          />{" "}
          {t.wrap}
        </label>
      </aside>
    </div>
  );
}

/** The population over the last 240 generations. */
function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${i},${(24 - (24 * v) / max).toFixed(1)}`).join(" ");
  return (
    <svg className="life__spark" viewBox="0 0 240 24" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
