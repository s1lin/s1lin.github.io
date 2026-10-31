"use client";

import { useId, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";
import { Skeleton } from "./skeleton";
import { VisuallyHidden } from "./visually-hidden";
import { useS1Words } from "./words";
import "./tokens.css";
import "./stat.css";

export type StatProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** What is counted: "Spend this month". */
  label: ReactNode;
  /** The number, formatted: "$12.40", "1.2M". */
  value: ReactNode;
  /** A unit after the number, smaller: "USD", "tokens". */
  unit?: ReactNode;
  /** The change, with its sign: "+12.5%". */
  delta?: ReactNode;
  /** Which way the change goes: a triangle up or down, a bar for none. Whether up is good is for the words to say. */
  trend?: "up" | "down" | "flat";
  /** After the change, in grey: "vs last month". */
  note?: ReactNode;
  /** The number is still coming: a bar in its place. */
  loading?: boolean;
  /** What a screen reader hears before the change, by its direction (the triangle says it on screen); from S1Words by default. */
  trendLabels?: { up: string; down: string; flat: string };
};

/** One figure that matters: a label in mono caps, the number large in the display face, the change under it. */
export function Stat({ label, value, unit, delta, trend, note, loading = false, trendLabels, className, ...rest }: StatProps) {
  const id = useId();
  const w = useS1Words();
  const said = trendLabels ?? { up: w.trendUp, down: w.trendDown, flat: w.trendFlat };
  return (
    <div className={cn("s1-stat", className)} role="group" aria-labelledby={`${id}-label`} aria-busy={loading || undefined} {...rest}>
      <p className="s1-stat__label" id={`${id}-label`}>
        {label}
      </p>
      <p className="s1-stat__value">
        {loading ? (
          <Skeleton width="5ch" height="0.8em" />
        ) : (
          <>
            {value}
            {unit && <span className="s1-stat__unit">{unit}</span>}
          </>
        )}
      </p>
      {!loading && (delta || note) && (
        <p className="s1-stat__delta">
          {trend && <span className={cn("s1-stat__trend", `s1-stat__trend--${trend}`)} aria-hidden="true" />}
          {trend && delta && <VisuallyHidden>{said[trend]} </VisuallyHidden>}
          {delta && <span>{delta}</span>}
          {note && <span className="s1-stat__note">{note}</span>}
        </p>
      )}
    </div>
  );
}

/** A row of Stats with hairlines between them, wrapping to as many lines as the width needs. */
export function StatGroup({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("s1-stats", className)} {...rest} />;
}
