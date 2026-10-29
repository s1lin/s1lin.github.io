import type { ReactNode, RefObject } from "react";
import { METRO_CITIES } from "@/content/metro-cities";
import { nameOf, type Metro2Line } from "@/hooks/useMetro2Line";
import { cn } from "@/lib/utils";

/** Where anyone can draw, explore and adjust a network of their own: the Metro2Line toolbox. */
export const MAKE_YOUR_OWN = "https://aha.tokensbeat.com/#/metro";

/*
 * The parts of the Metro2Line player (hooks/useMetro2Line.ts), for a layout to
 * place: the control bar, the map, and a caption.
 */

/** Ride or guess, then the cities or the quiz. */
export function MetroBar({ m }: { m: Metro2Line }) {
  const { quiz } = m;
  return (
    <div className="m2l-bar">
      <div className="m2l-bar__group" role="group" aria-label="Mode">
        <button type="button" aria-pressed={!quiz} onClick={() => m.ride(m.slug)}>
          Ride
        </button>
        <button type="button" aria-pressed={quiz !== null} onClick={m.guess}>
          Guess the city
        </button>
      </div>
      {quiz ? (
        <div className="m2l-bar__quiz">
          <p>
            {quiz.picked
              ? quiz.picked === quiz.answer
                ? `Right, ${nameOf(quiz.answer)}.`
                : `No, this is ${nameOf(quiz.answer)}.`
              : "Which city runs these lines?"}
          </p>
          <div className="m2l-bar__group">
            {quiz.options.map((o) => (
              <button
                key={o}
                type="button"
                disabled={quiz.picked !== null}
                data-right={(quiz.picked !== null && o === quiz.answer) || undefined}
                data-wrong={(quiz.picked === o && o !== quiz.answer) || undefined}
                onClick={() => m.answer(o)}
              >
                {nameOf(o)}
              </button>
            ))}
            {quiz.picked && (
              <button type="button" className="m2l-bar__next" onClick={m.guess}>
                Next city →
              </button>
            )}
          </div>
          <span className="m2l-bar__streak mono">Streak {m.streak}</span>
        </div>
      ) : (
        <div className="m2l-bar__group" role="group" aria-label="City">
          {METRO_CITIES.map((c) => (
            <button key={c.slug} type="button" aria-pressed={c.slug === m.slug} onClick={() => m.ride(c.slug)}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      <a className="m2l-bar__make mono" href={MAKE_YOUR_OWN}>
        Make your own map ↗
      </a>
    </div>
  );
}

/** The network on a canvas, with its city's name. `children` sit on top. */
export function MetroMap({
  m,
  canvas,
  className,
  children,
}: {
  m: Metro2Line;
  canvas: RefObject<HTMLCanvasElement | null>;
  className?: string;
  children?: ReactNode;
}) {
  const label = m.riddle
    ? "A metro network drawn in ink. Which city is it?"
    : `${nameOf(m.shown)} metro network${m.numbers ? `: ${m.numbers.lines} lines, ${m.numbers.stops} stations` : ""}.`;
  return (
    <div className={cn("m2l-map", className)}>
      <canvas
        ref={canvas}
        role="img"
        aria-label={label}
        onPointerMove={m.onPointerMove}
        onPointerLeave={m.onPointerLeave}
        onClick={m.onClick}
        data-pointing={m.hovered ? true : undefined}
      />
      <p className="m2l-map__title" aria-hidden="true">
        {m.riddle ? "?" : nameOf(m.shown)}
      </p>
      {!m.ready && <p className="m2l-map__note mono">{m.failed ? "Could not load this city." : "Extracting lines…"}</p>}
      {m.ready && m.hovered && (
        <p className="m2l-map__note mono" aria-hidden="true">
          <i style={{ background: m.hoverColour }} />
          {m.hovered.name || m.hovered.ref}
        </p>
      )}
      {children}
    </div>
  );
}

/** What the map shows, and the credit OpenStreetMap's licence asks for. */
export function MetroCaption({ m, lead }: { m: Metro2Line; lead: string }) {
  const n = m.numbers;
  return (
    <figcaption>
      {lead && `${lead} `}
      {m.riddle
        ? "a metro network in ink. Which city is it?"
        : `${nameOf(m.shown)}'s metro${n ? `: ${n.lines} lines, ${n.km} km, ${n.stops} stations` : ""}, drawn by Metro2Line. Point at a line to name it, click to ride it alone.`}{" "}
      Lines © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, ODbL.
    </figcaption>
  );
}
