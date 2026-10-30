import { useEffect, useState } from "react";
import { Board } from "@/components/life/Board";
import { ARC } from "@/lib/life/palette";
import { Playground } from "@/components/life/Playground";
import { Puzzle } from "@/components/life/Puzzle";
import { Runhead } from "@/components/Runhead";
import { make, step, stamp, type Grid } from "@/lib/life/life";
import { PATTERNS } from "@/lib/life/patterns";

/** The four rules, each as a 3×3 neighbourhood: the cell in the middle, who is around it, what becomes of it. */
const RULES: { no: string; name: string; text: string; around: number; alive: boolean; tone: "red" | "blue" | "yellow" | "black" }[] = [
  { no: "1", name: "Loneliness", text: "A living cell with fewer than two living neighbours dies.", around: 1, alive: true, tone: "red" },
  { no: "2", name: "Company", text: "A living cell with two or three living neighbours lives on.", around: 2, alive: true, tone: "blue" },
  { no: "3", name: "Crowding", text: "A living cell with more than three living neighbours dies.", around: 4, alive: true, tone: "yellow" },
  { no: "4", name: "Birth", text: "A dead cell with exactly three living neighbours comes alive.", around: 3, alive: false, tone: "black" },
];

/** The ring around the middle of a 3×3, clockwise from the top left. */
const RING = [0, 1, 2, 5, 8, 7, 6, 3];

function neighbourhood(around: number, alive: boolean): Grid {
  const g = make(3, 3);
  RING.slice(0, around).forEach((i) => (g.cells[i] = 1));
  g.cells[4] = alive ? 1 : 0;
  return g;
}

function RuleCard({ r }: { r: (typeof RULES)[number] }) {
  const before = neighbourhood(r.around, r.alive);
  // The engine decides: only the middle cell is shown after, the others have their own fates.
  const after = make(3, 3);
  after.cells[4] = step(before).cells[4];
  return (
    <article className={`life__rule life__rule--${r.tone}`}>
      <span className="life__rule-no">{r.no}</span>
      <div className="life__rule-pair">
        <Board grid={before} color={ARC.blue} cell={30} label={`Before: the middle cell is ${r.alive ? "alive" : "dead"} with ${r.around} living neighbours`} />
        <span aria-hidden>→</span>
        <Board grid={after} color={ARC.green} cell={30} label={`After: the middle cell is ${after.cells[4] ? "alive" : "dead"}`} />
      </div>
      <h3>{r.name}</h3>
      <p>{r.text}</p>
    </article>
  );
}

function Thumb({ art }: { art: string[] }) {
  const w = Math.max(...art.map((r) => r.length)) + 2;
  const g = stamp(w, art.length + 2, art, 1, 1);
  return <Board grid={g} color={ARC.blue} cell={Math.max(4, Math.floor(84 / Math.max(w, art.length + 2)))} label="" />;
}

const TIMELINE: { year: string; text: React.ReactNode }[] = [
  { year: "1940s", text: "John von Neumann, with Stanislaw Ulam's idea of a grid of cells, designs a self-reproducing automaton: a machine on a grid that builds a copy of itself. It needs twenty-nine states per cell." },
  { year: "1970", text: "John Conway sets out to find a rule as simple as it can be that still does something. In October Martin Gardner puts it in Scientific American, and readers begin to explore it." },
  { year: "1970", text: "Bill Gosper finds the glider gun, a pattern that fires a glider every 30 generations for ever. Life's population can grow without bound." },
  { year: "1982", text: "Winning Ways, by Berlekamp, Conway and Guy, sketches why Life can compute anything a computer can: gliders carry signals, guns make clocks, collisions make logic." },
  { year: "1984", text: "Gosper's Hashlife remembers every pattern it has seen, so that it can skip a million generations at once." },
  { year: "2000", text: "Paul Rendell builds a working Turing machine out of Life's cells." },
  { year: "2006", text: "Brice Due's OTCA metapixel is a Life pattern, 2,058 cells to a side, that behaves as one cell of Life. Life runs inside Life." },
  { year: "2020", text: "Conway dies on 11 April. The game he called a toy has outlived the toys around it." },
];

const READING: React.ReactNode[] = [
  <>Martin Gardner, “Mathematical Games: The fantastic combinations of John Conway’s new solitaire game ‘life’”, <i>Scientific American</i> 223 (4), October 1970, pp. 120–123.</>,
  <>E. R. Berlekamp, J. H. Conway and R. K. Guy, <i>Winning Ways for your Mathematical Plays</i>, vol. 2, 1982, chapter 25, “What is Life?”.</>,
  <>R. W. Gosper, “Exploiting regularities in large cellular spaces”, <i>Physica D</i> 10, 1984, pp. 75–80.</>,
  <>Paul Rendell, “Turing universality of the Game of Life”, in A. Adamatzky (ed.), <i>Collision-Based Computing</i>, Springer, 2002.</>,
  <>The <a href="https://conwaylife.com/wiki/">LifeWiki</a>, the catalogue of everything found so far, and <a href="https://golly.sourceforge.io/">Golly</a>, the program that runs it fast.</>,
];

export function LifePage() {
  const [guides, setGuides] = useState(true);
  const [mode, setMode] = useState<"puzzle" | "play">("puzzle");
  useEffect(() => {
    // Kept so a solver can check their own reading of the rule against the engine.
    (window as unknown as { life: object }).life = { step, make, stamp };
  }, []);
  return (
    <>
      <Runhead label="ライフ · Life — a grid, a rule, no instructions" home="/" />
      <main className="life" data-guides={guides ? "on" : "off"}>
        <div className="life__cols" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <button type="button" className="life__guides" aria-pressed={guides} onClick={() => setGuides((g) => !g)}>
          Grid {guides ? "on" : "off"}
        </button>

        <header className="life__masthead wrap">
          <p className="life__kicker">
            <span lang="ja">ライフ</span> · A game with no players · 1970
          </p>
          <h1 className="life__title">
            Li<span className="life__o" aria-hidden />fe
          </h1>
          <p className="life__lede">
            A grid of cells, each alive or dead. Four rules, no dice, no players. Set it going and it does what it does:
            it blinks, it walks, it builds machines. You never get told which rule produces which.
          </p>
        </header>

        <section className="life__sec wrap" aria-labelledby="rules-h">
          <h2 id="rules-h" className="life__h">
            <span lang="ja">規則</span> The rules
          </h2>
          <p className="life__intro">
            Every cell has eight neighbours: up, down, left, right and the four corners. All cells change at the same
            moment, by looking at how many of those eight are alive. That is the whole game. In the pictures, the cell in
            the middle is the one that is judged.
          </p>
          <div className="life__rules">
            {RULES.map((r) => (
              <RuleCard key={r.no} r={r} />
            ))}
          </div>
          <p className="life__small">
            The same four sentences can be said as two: a cell is alive next time if it has three living neighbours, or
            if it is alive now and has two. In the notation the field uses, B3/S23: born on 3, survives on 2 or 3.
          </p>
        </section>

        <section className="life__sec wrap" aria-labelledby="play-h">
          <h2 id="play-h" className="life__h">
            <span lang="ja">遊</span> Play
          </h2>
          <nav className="life__tabs" aria-label="Mode">
            <button type="button" aria-pressed={mode === "puzzle"} onClick={() => setMode("puzzle")}>
              Puzzles: predict it
            </button>
            <button type="button" aria-pressed={mode === "play"} onClick={() => setMode("play")}>
              Playground: make it
            </button>
          </nav>
          <div key={mode} className="life__swap">
          {mode === "puzzle" ? (
            <>
              <p className="life__intro">
                A grid goes in. Paint the grid it becomes after the number of generations shown. As in the ARC-AGI
                puzzles, nothing is explained: the rules above are all the help there is, and a clean solve costs few
                actions.
              </p>
              <Puzzle onDone={() => setMode("play")} />
            </>
          ) : (
            <>
              <p className="life__intro">
                Draw with the mouse, shift-drag to rub out, or pick a creature and click to put it down. Start with the
                gun, then stand in its way. Cells are coloured by age: yellow for newborn, green, blue, and magenta for
                the ones that have outlasted everything.
              </p>
              <Playground />
            </>
          )}
          </div>
        </section>

        <section className="life__sec wrap" aria-labelledby="study-h">
          <h2 id="study-h" className="life__h">
            <span lang="ja">研究</span> The study of Life
          </h2>
          <div className="life__study">
            <div className="life__prose">
              <p className="life__drop">
                Conway was after a game that nobody could predict by looking: simple enough to play with pencil and
                graph paper, rich enough that no one could say whether a pattern would grow for ever. What he got is
                the best-known cellular automaton, and a quiet argument that complexity needs very little.
              </p>
              <p>
                Patterns fall into families. <b>Still lifes</b> do not change. <b>Oscillators</b> repeat in place.{" "}
                <b>Spaceships</b> repeat while moving; the glider is the smallest, and none can outrun one cell a
                generation, nor go straight faster than half of that. <b>Methuselahs</b> are small and take a very long time to
                settle. Of all of them the R-pentomino, five cells, is the most watched.
              </p>
              <blockquote className="life__pull">Rules that fit on a card, and a question no program can answer.</blockquote>
              <p>
                The last part is a theorem, not a figure of speech. Because Life can build a computer out of gliders
                and guns, asking whether an arbitrary pattern will ever reach a given state is the halting problem in
                disguise, and has no general answer. You can only run it and see. The same freedom produces patterns
                with no past: <i>Gardens of Eden</i>, which no earlier generation can lead to, and which can only appear if
                someone puts them there.
              </p>
              <p>
                That is also why it suits a puzzle in the ARC manner. Each puzzle here has a single, exact answer that
                you can reach by reasoning from four sentences; a solver that has only seen the examples would have to
                work the sentences out for itself.
              </p>
            </div>
            <aside className="life__time" aria-label="Timeline">
              <h3>Timeline</h3>
              <ol>
                {TIMELINE.map((t, i) => (
                  <li key={i}>
                    <b>{t.year}</b>
                    <span>{t.text}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>

          <table className="life__zoo">
            <caption>A few of them. Period and movement are checked against this page’s engine.</caption>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">Name</th>
                <th scope="col">Kind</th>
                <th scope="col">Cells</th>
                <th scope="col">Period</th>
                <th scope="col">Moves</th>
                <th scope="col">What it does</th>
              </tr>
            </thead>
            <tbody>
              {PATTERNS.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Thumb art={p.art} />
                  </td>
                  <th scope="row">{p.name}</th>
                  <td>{p.kind}</td>
                  <td>{p.art.join("").replace(/\./g, "").length}</td>
                  <td>{p.period || "—"}</td>
                  <td>{p.shift[0] || p.shift[1] ? `${Math.abs(p.shift[0]) || Math.abs(p.shift[1])} ${p.shift[0] && p.shift[1] ? "diag." : p.shift[0] < 0 ? "left" : "right"}` : "—"}</td>
                  <td>{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="life__sub">Reading</h3>
          <ul className="life__read">
            {READING.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>

        <footer className="life__foot wrap">
          <p>
            Lifted from a Java Game of Life built on the ACM graphics library, with its two glider-gun seeds, into
            TypeScript. The engine, the puzzles and the creatures are MIT-licensed and have no dependencies; the tests
            check the period of every creature in the table. <a href="/">← Back to the issue</a>
          </p>
        </footer>
      </main>
    </>
  );
}
