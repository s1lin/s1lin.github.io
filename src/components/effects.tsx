import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { createFrost, type FrostInstance, type FrostOptions } from "@/components/canvasui/Frost";
import { createGlitch, type GlitchInstance, type GlitchOptions } from "@/components/canvasui/Glitch";
import { Magnify } from "@/components/canvasui/Magnify";
import { createParticleScroll } from "@/components/canvasui/ParticleScroll";
import { Ripple } from "@/components/canvasui/Ripple";
import { useDark } from "@/hooks/useDark";
import { useHydrated } from "@/hooks/useHydrated";
import { useMedia } from "@/hooks/useMedia";
import { useNear } from "@/hooks/useNear";
import { paintPage, planPage, type PagePlan } from "@/lib/page-paint";
import { cn } from "@/lib/utils";

/*
 * Canvas UI effects over photographs. The components in components/canvasui
 * are patched to paint their <img> into WebGL (scripts/patch-canvasui.py), so
 * they run in every WebGL2 browser rather than only in Chrome's HTML-in-Canvas
 * trial. Each effect mounts near the viewport and unmounts away from it, which
 * keeps the number of live WebGL contexts small. Frost is the exception: one
 * pane in front of the whole page. Glitch tears the section titles, from
 * their own words (scripts/patch-glitch.py). ParticleScroll turns the last
 * fifth of the screen to sand, over the whole page (scripts/patch-particle-scroll.py).
 */

const INK: [number, number, number] = [0.067, 0.067, 0.067];

/** A photograph under water: rings follow the cursor and bend the city below. */
export function RipplePhoto({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNear(ref);
  return (
    <div ref={ref} className={className} data-fx="ripple">
      {near ? (
        <Ripple
          className="fx-paint"
          trigger="hover"
          amplitude={0.6}
          wavelength={70}
          rings={3}
          refraction={60}
          dispersion={0.3}
          shine={0.6}
        >
          {children}
        </Ripple>
      ) : (
        children
      )}
    </div>
  );
}

/** A printer's loupe over a screenshot, for readers with a mouse. */
export function LoupeShot({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNear(ref, "300px");
  const mouse = useMedia("(hover: hover) and (pointer: fine)");
  return (
    <div ref={ref} className="screen__view" data-fx="loupe">
      {near && mouse ? (
        <Magnify
          size={110}
          zoom={2.2}
          color={INK}
          hud={1}
          ring
          ticks
          crosshair={false}
          brackets={false}
          dot={false}
          readout={false}
          grid={false}
          aberration={0}
          haze={0}
          ripples={false}
          follow={0.35}
        >
          {children}
        </Magnify>
      ) : (
        children
      )}
    </div>
  );
}

/* A short tear with a wide colour split, never on a timer: only as the title comes into view or the pointer reaches it. */
const TEAR: GlitchOptions = {
  interval: Infinity,
  duration: 0.45,
  slices: 14,
  shift: 18,
  rgbShift: 7,
  blocks: 0.35,
  noise: 0.25,
};

/**
 * A section title in ink that tears into RGB-split slices for a moment, in
 * colour, as it comes into view and again under the pointer, then settles.
 */
export function GlitchTitle({ className, style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const out = useRef<HTMLCanvasElement>(null);
  const tear = useRef<GlitchInstance | null>(null);
  const near = useNear(ref);

  useEffect(() => {
    const content = ref.current;
    const output = out.current;
    if (!near || !content || !output) return;
    // Nothing is captured: the patch sets the title's own words into a detached canvas.
    const glitch = createGlitch({ source: document.createElement("canvas"), content, output }, TEAR);
    tear.current = glitch;
    return () => {
      glitch?.destroy();
      tear.current = null;
    };
  }, [near]);

  return (
    <h2 ref={ref} className={cn("glitch", className)} style={style} onPointerEnter={() => tear.current?.burst()}>
      {children}
      <canvas ref={out} className="glitch__out" aria-hidden />
    </h2>
  );
}

/* Grey rime on paper, which white frost would vanish into; paler ice at night. No blue: the issue is one ink. */
const RIME_PAPER: FrostOptions = {
  tintThin: [0.74, 0.74, 0.74],
  tintThick: [0.86, 0.86, 0.86],
  brightness: 0.9,
  opacity: 0.3,
};
const RIME_NIGHT: FrostOptions = {
  tintThin: [0.86, 0.86, 0.86],
  tintThick: [0.96, 0.96, 0.96],
  brightness: 0.85,
  opacity: 0.14,
};

/**
 * Frost on the glass in front of the whole issue, like a Montreal window in
 * January. It grows in from the edges, the cursor melts a path through it, and
 * the path freezes over again. The canvas sits in <body>, so the pointer melts
 * it from anywhere on the page; it takes no clicks.
 */
export function FrostPane() {
  const live = useHydrated();
  const dark = useDark();
  const narrow = useMedia("(max-width: 760px)");
  const ref = useRef<HTMLCanvasElement>(null);
  const pane = useRef<FrostInstance | null>(null);

  useEffect(() => {
    const output = ref.current;
    if (!output) return;
    // Nothing is captured: the pane frosts the glass, and the page stays live underneath.
    const frost = createFrost(
      { source: document.createElement("canvas"), content: document.createElement("div"), output },
      // Fine crystals that stop short of the reading column.
      { reach: 0.4, textureScale: 0.7 },
    );
    pane.current = frost;
    return () => {
      frost?.destroy();
      pane.current = null;
    };
  }, [live]);

  useEffect(() => {
    // A phone has little margin to spare, so the frost keeps closer to the edges.
    pane.current?.setOptions({ ...(dark ? RIME_NIGHT : RIME_PAPER), reach: narrow ? 0.3 : 0.4 });
  }, [dark, narrow, live]);

  return live ? createPortal(<canvas ref={ref} className="frost-pane" aria-hidden />, document.body) : null;
}

/* The sand lies on the last fifth of the screen: formed at 80% down, fully loose at the bottom edge. */
const SAND_LINE = 0.8;

/**
 * The whole issue as sand below the last fifth of the screen. Whatever scrolls
 * up from the bottom edge arrives as drifting grains and settles into the page
 * as it rises past four-fifths of the way down; scroll back and it loosens
 * again. Nothing is captured: the page is read once (lib/page-paint.ts) and
 * the view painted from that as it scrolls. Where the sand has landed the
 * canvas is clear, so the page itself shows, sharp and clickable. Readers who
 * prefer reduced motion get the page as it is.
 */
export function SandPane() {
  const live = useHydrated();
  const still = useMedia("(prefers-reduced-motion: reduce)");
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const output = ref.current;
    const main = document.querySelector("main");
    if (!output || !main || still) return;
    const source = document.createElement("canvas");
    const ground = document.createElement("canvas");
    let plan: PagePlan | null = null;
    const sand = createParticleScroll(
      {
        source,
        content: document.documentElement,
        output,
        ground,
        paint: () => {
          if (plan) paintPage(plan, source, ground);
          return plan !== null;
        },
      },
      // No damped scroll: across a whole page its lag dissolved most of the screen on every wheel turn.
      // Grains land in 0.6 s, so the sand does not climb far up the screen while it scrolls.
      { point: SAND_LINE, band: innerHeight * (1 - SAND_LINE), smoothing: 0, settle: 0.6 },
    );
    if (!sand) return;

    // Re-read the page when its layout, its fonts or its theme change.
    let timer = 0;
    let gone = false;
    const reread = () => {
      clearTimeout(timer);
      timer = window.setTimeout(async () => {
        const next = await planPage(main);
        if (gone) return;
        plan = next;
        sand.setOptions({ band: innerHeight * (1 - SAND_LINE) });
        sand.resize();
      }, 250);
    };
    reread();
    void document.fonts?.ready.then(reread);
    const size = new ResizeObserver(reread);
    size.observe(main);
    const theme = new MutationObserver(reread);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const scheme = matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", reread);
    // A photo that finishes loading, or that an effect re-creates as it mounts, repaints the view.
    const loaded = () => sand.resize();
    main.addEventListener("load", loaded, true);
    return () => {
      gone = true;
      clearTimeout(timer);
      main.removeEventListener("load", loaded, true);
      size.disconnect();
      theme.disconnect();
      scheme.removeEventListener("change", reread);
      sand.destroy();
    };
  }, [live, still]);

  return live && !still ? createPortal(<canvas ref={ref} className="sand-pane" aria-hidden />, document.body) : null;
}
