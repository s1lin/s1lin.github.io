import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/social/common";
import { when } from "@/components/social/helpers";
import { Reactions, type ReactionState } from "@/components/social/Reactions";
import { SOCIAL_COPY } from "@/components/social/copy";
import type { Lang } from "@/components/life/copy";
import { byAge } from "@/lib/life/palette";
import { make, step, type Grid } from "@/lib/life/life";
import type { Shape } from "@/lib/social/client.ts";
import { requestShape } from "@/lib/social/shape.ts";
import { social, useSession } from "@/lib/social/useSocial";

const MARGIN = 8;
const RESTART = 160;

/** A shape running on a small black board, a few generations a second, from where the reader put it. */
function MiniLife({ shape }: { shape: Shape }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const W = shape.w + MARGIN * 2;
  const H = shape.h + MARGIN * 2;
  const cell = Math.max(2, Math.floor(168 / Math.max(W, H)));

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const start = (): Grid => {
      const g = make(W, H);
      shape.cells.forEach((row, j) => [...row].forEach((ch, i) => (g.cells[(MARGIN + j) * W + MARGIN + i] = ch === "1" ? 1 : 0)));
      return g;
    };
    let grid = start();
    let ages = Uint16Array.from(grid.cells);
    let gen = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const draw = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < grid.cells.length; i++) {
        if (!grid.cells[i]) continue;
        ctx.fillStyle = byAge(ages[i]);
        ctx.fillRect((i % W) * cell, Math.floor(i / W) * cell, cell, cell);
      }
    };
    const tick = () => {
      const n = step(grid, false);
      ages = Uint16Array.from(n.cells, (v, i) => (v ? (grid.cells[i] ? ages[i] + 1 : 1) : 0));
      grid = n;
      gen++;
      if (gen >= RESTART || !n.cells.some(Boolean)) {
        grid = start();
        ages = Uint16Array.from(grid.cells);
        gen = 0;
      }
      draw();
    };
    draw();
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (still || !("IntersectionObserver" in window)) return;
    // Only while it is on screen.
    const io = new IntersectionObserver(([e]) => {
      clearInterval(timer);
      timer = e.isIntersecting ? setInterval(tick, 170) : undefined;
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      clearInterval(timer);
    };
  }, [shape, W, H, cell]);

  return <canvas ref={ref} className="soc__mini" width={W * cell} height={H * cell} role="img" aria-label={shape.title} />;
}

function Card({ shape, lang }: { shape: Shape; lang: Lang }) {
  const c = SOCIAL_COPY[lang];
  const [st, setSt] = useState<ReactionState>({ likes: shape.likes, reposts: shape.reposts, liked: shape.liked ?? false, reposted: shape.reposted ?? false });
  return (
    <li className="soc__shape">
      <button type="button" className="soc__shape-open" onClick={() => requestShape({ w: shape.w, h: shape.h, cells: shape.cells })} title={c.openInPad}>
        <MiniLife shape={shape} />
        <span className="soc__sr">{c.openInPad}</span>
      </button>
      <h3>{shape.title}</h3>
      <p className="soc__text">{shape.note}</p>
      <p className="soc__meta">
        <Avatar name={shape.author.name} />
        <span>{c.by(shape.author.name)}</span>
        <time dateTime={shape.at}>{when(shape.at, lang)}</time>
      </p>
      <Reactions target={`shape:${shape.id}`} state={st} onState={setSt} c={c} />
    </li>
  );
}

/** The shapes readers published: running boards with a name and a note; a click loads one into the launch pad. */
export function ShapeGallery({ lang }: { lang: Lang }) {
  const c = SOCIAL_COPY[lang];
  const { session } = useSession();
  const [shapes, setShapes] = useState<Shape[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const who = session?.token ?? "";

  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    social()
      .shapes()
      .then((p) => {
        if (!live) return;
        setFailed(false);
        setShapes(p.shapes);
        setNext(p.next ?? null);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [who, tick]);

  const more = async () => {
    if (!next || busy) return;
    setBusy(true);
    try {
      const p = await social().shapes(next);
      setShapes((s) => [...(s ?? []), ...p.shapes]);
      setNext(p.next ?? null);
    } catch {
      /* the button stays */
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="soc soc--gallery" aria-labelledby="shapes-h" lang={lang === "zh" ? "zh-Hans" : lang}>
      <h2 id="shapes-h">{c.shapesH}</h2>
      <p className="soc__small">{c.shapesIntro}</p>
      {failed && (
        <p className="soc__note soc__note--bad" role="alert">
          {c.loadError}{" "}
          <button type="button" className="soc__link" onClick={() => setTick((t) => t + 1)}>
            {c.retry}
          </button>
        </p>
      )}
      {!failed && shapes === null && <p className="soc__small">{c.loading}</p>}
      {shapes && shapes.length === 0 && <p className="soc__empty">{c.galleryEmpty}</p>}
      {shapes && shapes.length > 0 && (
        <ul className="soc__shapes">
          {shapes.map((s) => (
            <Card key={s.id} shape={s} lang={lang} />
          ))}
        </ul>
      )}
      {next && (
        <button type="button" className="soc__btn" onClick={more} disabled={busy}>
          {busy ? c.loading : c.more}
        </button>
      )}
    </section>
  );
}
