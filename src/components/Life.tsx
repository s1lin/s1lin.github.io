import { useEffect, useState } from "react";
import { Board } from "@/components/life/Board";
import { ARC } from "@/lib/life/palette";
import { LANGS } from "@/components/life/copy";
import { useLang } from "@/components/life/lang";
import { LangProvider } from "@/components/life/LangProvider";
import { Playground } from "@/components/life/Playground";
import { Comments } from "@/components/social/Comments";
import { ShapeGallery } from "@/components/social/ShapeGallery";
import { Puzzle } from "@/components/life/Puzzle";
import { Rich } from "@/components/life/Rich";
import { Thumb } from "@/components/life/Thumb";
import { Runhead } from "@/components/Runhead";
import { make, step, stamp, type Grid } from "@/lib/life/life";
import { PATTERNS } from "@/lib/life/patterns";

/** The four rules as 3×3 neighbourhoods: the cell in the middle, how many are around it. Names and text are the copy's, in order. */
const RULES: { around: number; alive: boolean; tone: "red" | "blue" | "yellow" | "black" }[] = [
  { around: 1, alive: true, tone: "red" },
  { around: 2, alive: true, tone: "blue" },
  { around: 4, alive: true, tone: "yellow" },
  { around: 3, alive: false, tone: "black" },
];

/** The ring around the middle of a 3×3, clockwise from the top left. */
const RING = [0, 1, 2, 5, 8, 7, 6, 3];

function neighbourhood(around: number, alive: boolean): Grid {
  const g = make(3, 3);
  RING.slice(0, around).forEach((i) => (g.cells[i] = 1));
  g.cells[4] = alive ? 1 : 0;
  return g;
}

function RuleCard({ no, r }: { no: number; r: (typeof RULES)[number] }) {
  const { copy } = useLang();
  const item = copy.rules.items[no - 1];
  const before = neighbourhood(r.around, r.alive);
  // The engine decides: only the middle cell is shown after, the others have their own fates.
  const after = make(3, 3);
  after.cells[4] = step(before).cells[4];
  return (
    <article className={`life__rule life__rule--${r.tone}`}>
      <span className="life__rule-no">{no}</span>
      <div className="life__rule-pair">
        <Board grid={before} color={ARC.blue} cell={30} label={`${item.name}: ${copy.play.inLabel}`} />
        <span aria-hidden>→</span>
        <Board grid={after} color={ARC.green} cell={30} label={`${item.name}: ${copy.play.outLabel}`} />
      </div>
      <h3>{item.name}</h3>
      <p>{item.text}</p>
    </article>
  );
}

function Moves({ shift }: { shift: [number, number] }) {
  const { moves } = useLang().copy.study;
  const [dx, dy] = shift;
  if (!dx && !dy) return <>—</>;
  const n = Math.abs(dx) || Math.abs(dy);
  return <>{`${n} ${dx && dy ? moves.diag : dx < 0 ? moves.left : moves.right}`}</>;
}

function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="life__lang" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l.id} type="button" aria-pressed={lang === l.id} lang={l.id === "zh" ? "zh-Hans" : l.id} onClick={() => setLang(l.id)}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

function Page() {
  const { lang, copy } = useLang();
  const [guides, setGuides] = useState(true);
  const [mode, setMode] = useState<"puzzle" | "play">(() =>
    typeof location !== "undefined" && new URLSearchParams(location.search).get("tab") === "play" ? "play" : "puzzle",
  );
  useEffect(() => {
    // Kept so a solver can check their own reading of the rule against the engine.
    (window as unknown as { life: object }).life = { step, make, stamp };
    // A shape picked in the gallery: open the launch pad, which takes it, and scroll to it.
    const open = () => {
      setMode("play");
      const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("play-h")?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
    };
    window.addEventListener("life:load-shape", open);
    return () => window.removeEventListener("life:load-shape", open);
  }, []);
  const s = copy.study;
  return (
    <>
      <Runhead label={copy.run} home="/" />
      <main className="life" data-guides={guides ? "on" : "off"}>
        <div className="life__cols" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <button type="button" className="life__guides" aria-pressed={guides} onClick={() => setGuides((g) => !g)}>
          {copy.grid} {guides ? copy.gridOn : copy.gridOff}
        </button>

        <header className="life__masthead wrap">
          <p className="life__kicker">{copy.kicker}</p>
          <LangSwitch />
          <h1 className="life__title" data-lang={lang}>
            {lang === "en" ? (
              <>
                Li<span className="life__o" aria-hidden />fe
              </>
            ) : (
              <>
                {copy.title}
                <span className="life__o life__o--small" aria-hidden />
              </>
            )}
          </h1>
          <p className="life__lede">{copy.lede}</p>
        </header>

        <section className="life__sec life__why wrap" aria-labelledby="why-h">
          <h2 id="why-h" className="life__h">
            {copy.why.h}
          </h2>
          <div className="life__why-body">
            {copy.why.body.map((p, i) => (
              <p key={i} className={i === 0 ? "life__why-lead" : undefined}>
                <Rich text={p} />
              </p>
            ))}
          </div>
        </section>

        <section className="life__sec wrap" aria-labelledby="rules-h">
          <h2 id="rules-h" className="life__h">
            {copy.rules.h}
          </h2>
          <p className="life__intro">{copy.rules.intro}</p>
          <div className="life__rules">
            {RULES.map((r, i) => (
              <RuleCard key={i} no={i + 1} r={r} />
            ))}
          </div>
          <p className="life__small">{copy.rules.note}</p>
        </section>

        <section className="life__sec wrap" aria-labelledby="play-h">
          <h2 id="play-h" className="life__h">
            {copy.play.h}
          </h2>
          <nav className="life__tabs" aria-label={copy.play.h}>
            <button type="button" aria-pressed={mode === "puzzle"} onClick={() => setMode("puzzle")}>
              {copy.play.tabs[0]}
            </button>
            <button type="button" aria-pressed={mode === "play"} onClick={() => setMode("play")}>
              {copy.play.tabs[1]}
            </button>
          </nav>
          <div key={mode} className="life__swap">
            {mode === "puzzle" ? (
              <>
                <p className="life__intro">{copy.play.puzzleIntro}</p>
                <Puzzle onDone={() => setMode("play")} />
              </>
            ) : (
              <>
                <p className="life__intro">{copy.play.padIntro}</p>
                <Playground />
              </>
            )}
          </div>
        </section>

        <section className="life__sec wrap" aria-labelledby="study-h">
          <h2 id="study-h" className="life__h">
            {s.h}
          </h2>
          <div className="life__study">
            <div className="life__prose">
              {s.prose.map((p, i) => (
                <div key={i} className="life__block">
                  <p className={i === 0 ? "life__drop" : undefined}>
                    <Rich text={p} />
                  </p>
                  {i === 1 && <blockquote className="life__pull">{s.pull}</blockquote>}
                </div>
              ))}
            </div>
            <aside className="life__time" aria-label={s.timelineH}>
              <h3>{s.timelineH}</h3>
              <ol>
                {s.timeline.map((t, i) => (
                  <li key={i}>
                    <b>{t.year}</b>
                    <span>{t.text}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>

          <table className="life__zoo">
            <caption>{s.zooCaption}</caption>
            <thead>
              <tr>
                <th scope="col" />
                {s.cols.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PATTERNS.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Thumb art={p.art} />
                  </td>
                  <th scope="row">{copy.creatures[p.id].name}</th>
                  <td>{s.kinds[p.kind]}</td>
                  <td>{p.art.join("").replace(/\./g, "").length}</td>
                  <td>{p.period || "—"}</td>
                  <td>
                    <Moves shift={p.shift} />
                  </td>
                  <td>{copy.creatures[p.id].note}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="life__sub">{s.readingH}</h3>
          <ul className="life__read">
            {s.reading.map((r, i) => (
              <li key={i}>
                <Rich text={r} />
              </li>
            ))}
          </ul>
        </section>

        <div className="life__sec wrap life__social">
          <ShapeGallery lang={lang} />
          <Comments target="site:s1lin:life" lang={lang} />
        </div>

        <footer className="life__foot wrap">
          <p>
            {copy.footer} <a href="/">{copy.back}</a>
          </p>
        </footer>
      </main>
    </>
  );
}

export function LifePage() {
  return (
    <LangProvider>
      <Page />
    </LangProvider>
  );
}
