import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { MAKE_YOUR_OWN } from "@/components/Metro2Line";
import { METRO_CITIES } from "@/content/metro-cities";
import { clone, parse, step, type Grid } from "@/lib/life/life";
import { ARC, byAge } from "@/lib/life/palette";
import gliderGun from "@/lib/life/seeds/glider-gun.txt?raw";
import { lineColour, type MetroCity } from "@/lib/metro";
import { Roundel } from "@/ui/roundel";
import { useDark } from "@/ui/use-dark";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** True while `el` is within `margin` of the viewport; false until then and on the server. */
function useNearView(el: React.RefObject<HTMLElement | null>, margin = "200px") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      const t = setTimeout(() => setNear(true));
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: margin });
    io.observe(node);
    return () => io.disconnect();
  }, [el, margin]);
  return near;
}

const cities = new Map<string, Promise<MetroCity>>();
function loadCity(slug: string) {
  let p = cities.get(slug);
  if (!p) {
    p = fetch(`/data/metro/${slug}.json`).then((r) => {
      if (!r.ok) throw new Error(`metro ${slug}: ${r.status}`);
      return r.json() as Promise<MetroCity>;
    });
    p.catch(() => cities.delete(slug));
    cities.set(slug, p);
  }
  return p;
}

/** A real network, drawn line by line on the page's own plate; the next city every few seconds. */
function MetroMini() {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const near = useNearView(box);
  const dark = useDark();
  const [at, setAt] = useState(0);
  const [city, setCity] = useState<MetroCity | null>(null);
  const slug = METRO_CITIES[at].slug;

  useEffect(() => {
    if (!near) return;
    let live = true;
    loadCity(slug).then((c) => live && setCity(c), () => {});
    return () => {
      live = false;
    };
  }, [near, slug]);

  useEffect(() => {
    if (!near) return;
    const t = setInterval(() => setAt((a) => (a + 1) % METRO_CITIES.length), 7000);
    return () => clearInterval(t);
  }, [near]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !city || city.slug !== slug) return;
    const ctx = c.getContext("2d")!;
    const css = getComputedStyle(c);
    const paper = css.getPropertyValue("--paper-2").trim() || "#ececea";
    const sumi = css.getPropertyValue("--sumi").trim() || "#111";
    const [x0, y0, x1, y1] = city.view;
    const k = Math.min(c.width / (x1 - x0), c.height / (y1 - y0)) * 0.94;
    const ox = (c.width - (x1 - x0) * k) / 2 - x0 * k;
    const oy = (c.height - (y1 - y0) * k) / 2 - y0 * k;
    const lines = city.lines.map((l, i) => ({ l, colour: lineColour(l, i, dark) ?? sumi }));
    const draw = (shown: number) => {
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2;
      lines.forEach(({ l, colour }, i) => {
        if (i >= shown) return;
        ctx.strokeStyle = colour;
        for (const t of l.track) {
          ctx.beginPath();
          for (let j = 0; j < t.length; j += 2) {
            const x = t[j] * k + ox;
            const y = t[j + 1] * k + oy;
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      });
    };
    if (reduced()) {
      draw(lines.length);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 2200);
      draw(Math.ceil(p * lines.length));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [city, slug, dark]);

  return (
    <div className="ws-mini" ref={box}>
      <canvas ref={canvas} width={960} height={600} role="img" aria-label={`${METRO_CITIES[at].name}'s metro network, drawn line by line`} />
      <button type="button" className="ws-mini__tag" onClick={() => setAt((a) => (a + 1) % METRO_CITIES.length)}>
        {METRO_CITIES[at].name} · next city →
      </button>
    </div>
  );
}

const COLS = 100;
const ROWS = 60;
const CELL = 8;
const CROP = [22, 24];

/** The glider gun running in a window onto its board; starts over when the gliders have left. */
function LifeMini() {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const near = useNearView(box, "0px");

  useEffect(() => {
    const c = canvas.current;
    if (!near || !c) return;
    const ctx = c.getContext("2d")!;
    const seed = parse(gliderGun);
    let g: Grid = clone(seed);
    let ages = Uint16Array.from(g.cells);
    let gen = 0;
    const paint = () => {
      ctx.fillStyle = ARC.black;
      ctx.fillRect(0, 0, c.width, c.height);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const i = (y + CROP[1]) * g.w + x + CROP[0];
          if (!g.cells[i]) continue;
          ctx.fillStyle = byAge(ages[i]);
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
      ctx.fillStyle = ARC.grid;
      for (let x = 0; x <= COLS; x++) ctx.fillRect(x * CELL, 0, 1, c.height);
      for (let y = 0; y <= ROWS; y++) ctx.fillRect(0, y * CELL, c.width, 1);
    };
    paint();
    if (reduced()) {
      for (let n = 0; n < 60; n++) {
        const next = step(g);
        ages = Uint16Array.from(next.cells, (v, i) => (v ? (g.cells[i] ? ages[i] + 1 : 1) : 0));
        g = next;
      }
      paint();
      return;
    }
    const t = setInterval(() => {
      const next = step(g);
      ages = Uint16Array.from(next.cells, (v, i) => (v ? (g.cells[i] ? ages[i] + 1 : 1) : 0));
      g = next;
      if (++gen > 220) {
        g = clone(seed);
        ages = Uint16Array.from(g.cells);
        gen = 0;
      }
      paint();
    }, 80);
    return () => clearInterval(t);
  }, [near]);

  return (
    <div className="ws-mini ws-mini--life" ref={box}>
      <canvas ref={canvas} width={COLS * CELL} height={ROWS * CELL} role="img" aria-label="Gosper's glider gun firing gliders across a Life board" />
    </div>
  );
}

type Slide = { id: string; letter: string; kicker: string; title: string; text: string; body: React.ReactNode; links: { href: string; label: string }[] };

const SLIDES: Slide[] = [
  {
    id: "metro2line",
    letter: "M",
    kicker: "No. 01 · 2025.12 · Flask · Overpass · Leaflet",
    title: "Metro2Line",
    text: "Pulls metro lines out of OpenStreetMap and redraws a city's network, line by line. Five cities are on the cover; to draw your own, explore it and adjust it, take it to aha.tokensbeat.com.",
    body: <MetroMini />,
    links: [
      { href: "#cover", label: "Play it on the cover ↑" },
      { href: MAKE_YOUR_OWN, label: "Build your own ↗" },
    ],
  },
  {
    id: "life",
    letter: "L",
    kicker: "No. 02 · 2026 · TypeScript · lifted from Java · MIT",
    title: "Life",
    text: "Conway's Game of Life, lifted from a Java program and its glider-gun seeds into TypeScript, set as an ARC-style puzzle: a grid in, the grid it becomes out, the rule left to find. The rules, a playground, and a short study of the game.",
    body: <LifeMini />,
    links: [{ href: "/life/", label: "Play Life →" }],
  },
];

/** Two playable things side by side: swipe, drag, use the arrows or the keys. */
export function WorkshopSlider() {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const go = useCallback((to: number) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(SLIDES.length - 1, to));
    const slide = el.children[n] as HTMLElement;
    el.scrollTo({ left: slide.offsetLeft - el.offsetLeft, behavior: reduced() ? "auto" : "smooth" });
  }, []);

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    let best = 0;
    let gap = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const d = Math.abs((c as HTMLElement).offsetLeft - el.offsetLeft - el.scrollLeft);
      if (d < gap) {
        gap = d;
        best = i;
      }
    });
    setIndex(best);
  };

  const down = (e: RPointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || (e.target as HTMLElement).closest("a, button")) return;
    drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft };
  };
  const move = (e: RPointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!dragging && Math.abs(e.clientX - d.x) > 4) setDragging(true);
    e.currentTarget.scrollLeft = d.left - (e.clientX - d.x);
  };
  const up = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    go(index);
  };

  return (
    <section className="ws-slider" aria-roledescription="carousel" aria-label="Playable builds: Metro2Line and Life">
      <header className="ws-slider__head">
        <p className="ws-slider__label">Playable · swipe</p>
        <div className="ws-slider__nav">
          <button type="button" aria-label="Previous" disabled={index === 0} onClick={() => go(index - 1)}>
            ←
          </button>
          <span aria-hidden="true">
            {index + 1} / {SLIDES.length}
          </span>
          <button type="button" aria-label="Next" disabled={index === SLIDES.length - 1} onClick={() => go(index + 1)}>
            →
          </button>
        </div>
      </header>
      <ul
        ref={track}
        className={`ws-slider__track${dragging ? " is-dragging" : ""}`}
        tabIndex={0}
        onScroll={onScroll}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            go(index + (e.key === "ArrowRight" ? 1 : -1));
          }
        }}
      >
        {SLIDES.map((s, i) => (
          <li key={s.id} id={s.id} className="ws-slide" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}: ${s.title}`}>
            {s.body}
            <p className="item__meta">{s.kicker}</p>
            <h3>
              <Roundel>{s.letter}</Roundel> {s.title}
            </h3>
            <p>{s.text}</p>
            <p className="item__link">
              {s.links.map((l, j) => (
                <span key={l.href}>
                  {j > 0 && "  ·  "}
                  <a href={l.href}>{l.label}</a>
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
      <div className="ws-slider__dots" role="tablist" aria-label="Slides">
        {SLIDES.map((s, i) => (
          <button key={s.id} type="button" role="tab" aria-selected={i === index} aria-label={s.title} onClick={() => go(i)} />
        ))}
      </div>
    </section>
  );
}
