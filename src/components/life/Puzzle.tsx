import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Board } from "@/components/life/Board";
import { useCopy } from "@/components/life/lang";
import { ARC } from "@/lib/life/palette";
import { clone, equals, type Grid } from "@/lib/life/life";
import { LEVELS, answer, given } from "@/lib/life/levels";

const store = {
  read(): number {
    try {
      return Math.min(LEVELS.length - 1, Number(localStorage.getItem("life-level")) || 0);
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

/** The puzzles: a grid in, the grid it becomes out, and the rule left for you to find. */
export function Puzzle({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(store.read);
  const next = () => {
    const n = index + 1;
    store.write(n >= LEVELS.length ? 0 : n);
    if (n >= LEVELS.length) onDone();
    else setIndex(n);
  };
  // Keyed by level, so each starts with fresh state.
  return <Round key={index} index={index} next={next} jump={setIndex} />;
}

function Round({ index, next, jump }: { index: number; next: () => void; jump: (n: number) => void }) {
  const copy = useCopy().play;
  const level = LEVELS[index];
  const start = useMemo(() => given(level), [level]);
  const target = useMemo(() => answer(level), [level]);
  const [mine, setMine] = useState<Grid>(() => clone(start));
  const [actions, setActions] = useState(0);
  const [tries, setTries] = useState(0);
  const [verdict, setVerdict] = useState<"" | "no" | "yes">("");
  const undo = useRef<Grid[]>([]);

  const flip = useCallback((x: number, y: number) => {
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
  const reset = useCallback(() => {
    setMine(clone(start));
    undo.current = [];
    setVerdict("");
  }, [start]);
  const submit = useCallback(() => {
    if (equals(mine, target)) setVerdict("yes");
    else {
      setVerdict("no");
      setTries((t) => t + 1);
    }
  }, [mine, target]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === "Enter") (verdict === "yes" ? next : submit)();
      else if (e.key === "z" || e.key === "Z") back();
      else if (e.key === "r" || e.key === "R") reset();
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  const cell = start.w > 10 ? 24 : 32;
  return (
    <div className="life__puzzle">
      <ol className="life__steps" aria-label={copy.levels}>
        {LEVELS.map((l, i) => (
          <li key={l.id}>
            <button type="button" aria-current={i === index ? "step" : undefined} onClick={() => jump(i)}>
              {i + 1}
            </button>
          </li>
        ))}
      </ol>
      <div className="life__pair">
        <figure>
          <Board grid={start} color={ARC.blue} cell={cell} label={copy.inLabel} />
          <figcaption>{copy.inLabel}</figcaption>
        </figure>
        <span className="life__arrow" aria-label={`${level.gens} ${copy.gens(level.gens)}`}>
          <b>{level.gens}</b>
          <i>{copy.gens(level.gens)}</i>
        </span>
        <figure>
          <Board grid={mine} color={ARC.green} cell={cell} onPointer={(x, y, e) => e.type === "pointerdown" && flip(x, y)} label={copy.outLabel} />
          <figcaption>{copy.outLabel}</figcaption>
        </figure>
      </div>
      <div className="life__bar">
        <button type="button" className="life__btn life__btn--go" onClick={verdict === "yes" ? next : submit}>
          {verdict === "yes" ? copy.next : copy.submit}
        </button>
        <button type="button" className="life__btn" onClick={back}>
          {copy.undo}
        </button>
        <button type="button" className="life__btn" onClick={reset}>
          {copy.reset}
        </button>
        <span className="life__verdict" aria-live="polite" data-v={verdict}>
          {verdict === "no" ? copy.wrong : verdict === "yes" ? copy.solved(actions, tries) : copy.status(actions, tries)}
        </span>
      </div>
    </div>
  );
}
