import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from "react";
import { METRO_CITIES } from "@/content/metro-cities";
import { createPlayer, lineColour, stats, type Insets, type Look, type MetroCity, type Player } from "@/lib/metro";
import { useDark } from "@/ui/use-dark";
import { useNear } from "@/ui/use-near";

const cache = new Map<string, Promise<MetroCity>>();

function load(slug: string) {
  let city = cache.get(slug);
  if (!city) {
    city = fetch(`/data/metro/${slug}.json`).then((r) => {
      if (!r.ok) throw new Error(`metro ${slug}: ${r.status}`);
      return r.json() as Promise<MetroCity>;
    });
    city.catch(() => cache.delete(slug));
    cache.set(slug, city);
  }
  return city;
}

export const nameOf = (slug: string) => METRO_CITIES.find((c) => c.slug === slug)?.name ?? slug;

function shuffle<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Quiz = { answer: string; options: string[]; picked: string | null };

/** The plate's paper and ink in the current theme, from the tokens site.css sets on the map. */
function plateLook(el: HTMLElement, dark: boolean): Look {
  const css = getComputedStyle(el);
  return { paper: css.getPropertyValue("--paper-2").trim(), sumi: css.getPropertyValue("--sumi").trim(), dark };
}

function nextQuiz(previous?: string): Quiz {
  const pool = METRO_CITIES.filter((c) => c.slug !== previous);
  const answer = shuffle(pool.length ? pool : METRO_CITIES)[0].slug;
  const others = shuffle(METRO_CITIES.filter((c) => c.slug !== answer)).slice(0, 3);
  return { answer, options: shuffle([answer, ...others.map((c) => c.slug)]), picked: null };
}

/**
 * Metro2Line, playable. Ride: pick a city and watch its network go in line by
 * line, then run. Guess the city: the network in ink, four names, one is right.
 * `root` is the element around the player and `canvas` its map; the network is
 * drawn in the theme's ink on the plate and framed clear of `insets`.
 */
export function useMetro2Line({
  root,
  canvas,
  insets,
}: {
  root: RefObject<HTMLElement | null>;
  canvas: RefObject<HTMLCanvasElement | null>;
  insets?: (canvas: HTMLCanvasElement) => Insets;
}) {
  const player = useRef<Player | null>(null);
  const near = useNear(root, "300px");
  const dark = useDark();

  const [slug, setSlug] = useState("montreal");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [streak, setStreak] = useState(0);
  const [city, setCity] = useState<MetroCity | null>(null);
  const [only, setOnly] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  // The city whose network failed to load: its note must not follow the reader to the next city.
  const [failed, setFailed] = useState<string | null>(null);

  const shown = quiz ? quiz.answer : slug;
  const riddle = quiz !== null && quiz.picked === null;
  const ready = city?.slug === shown ? city : null;

  useEffect(() => {
    const el = canvas.current;
    if (!el || !near) return;
    player.current = createPlayer(el, insets && (() => insets(el)));
    return () => {
      player.current?.destroy();
      player.current = null;
    };
  }, [canvas, near, insets]);

  useEffect(() => {
    if (!near) return;
    let live = true;
    load(shown).then(
      (c) => live && setCity(c),
      () => live && setFailed(shown),
    );
    return () => {
      live = false;
    };
  }, [shown, near]);

  // The theme's tokens have changed by the time `dark` does, so read them afresh.
  useEffect(() => {
    const el = canvas.current;
    if (el) player.current?.setLook(plateLook(el, dark));
  }, [canvas, dark, near, insets]);

  useEffect(() => {
    if (ready) player.current?.setCity(ready);
  }, [ready, near, insets]);

  useEffect(() => {
    player.current?.setView({ ink: riddle, only });
  }, [riddle, only, ready, near, insets]);

  const numbers = useMemo(() => (ready ? stats(ready) : null), [ready]);
  const hovered = ready && hover !== null ? ready.lines[hover] : null;

  function lift(i: number | null) {
    player.current?.setHover(i);
    setHover(i);
  }

  function isolate(i: number) {
    setOnly(i === only ? null : i);
  }

  /** The line under the pointer, if any. */
  function under(e: PointerEvent<HTMLCanvasElement> | MouseEvent<HTMLCanvasElement>) {
    if (riddle || !player.current) return null;
    const r = e.currentTarget.getBoundingClientRect();
    return player.current.pick(e.clientX - r.left, e.clientY - r.top);
  }

  return {
    slug,
    quiz,
    streak,
    shown,
    riddle,
    ready,
    failed: failed === shown,
    numbers,
    hovered,
    hoverColour: (hovered && lineColour(hovered, hover!, dark)) ?? undefined,
    ride(next: string) {
      setQuiz(null);
      setSlug(next);
      setOnly(null);
      lift(null);
    },
    guess() {
      setQuiz(nextQuiz(quiz?.answer ?? slug));
      setOnly(null);
      lift(null);
    },
    answer(pick: string) {
      if (!quiz || quiz.picked) return;
      setQuiz({ ...quiz, picked: pick });
      setStreak(pick === quiz.answer ? streak + 1 : 0);
    },
    onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
      lift(under(e));
    },
    onPointerLeave() {
      lift(null);
    },
    onClick(e: MouseEvent<HTMLCanvasElement>) {
      // A tap on a touch screen has no hover before it, so look again.
      const i = under(e);
      lift(i);
      if (i !== null) isolate(i);
    },
  };
}

export type Metro2Line = ReturnType<typeof useMetro2Line>;
