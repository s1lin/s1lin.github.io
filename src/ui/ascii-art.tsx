"use client";

import { useEffect, useRef, type Ref } from "react";
import { mount, type MountOptions, type Piece } from "ascii.rest";
import { cn } from "./cn";
import { useHydrated } from "./use-hydrated";
import "./ascii-art.css";

type Props = {
  piece: Piece;
  options?: MountOptions;
  /** What the picture shows, for screen readers. */
  label: string;
  /** A still frame, shown before the piece starts and without JavaScript. */
  still?: string;
  className?: string;
};

/**
 * An ascii.rest piece (https://ascii.rest). Text pieces draw into a <pre> that
 * holds the still until they start; coloured pieces switch to a canvas once the
 * page is live, since they draw in more than one ink.
 */
export function AsciiArt({ piece, options, label, still = "", className }: Props) {
  const ref = useRef<HTMLElement>(null);
  const onCanvas = Boolean(piece.meta.palette);
  const live = useHydrated();
  // An inline options object is new every render; only a real change restarts the piece.
  const key = JSON.stringify(options ?? {});

  useEffect(() => {
    const el = ref.current;
    if (!el || !live) return;
    return mount(el, piece, JSON.parse(key) as MountOptions);
  }, [piece, key, live]);

  const cls = cn("s1-ascii", className);
  if (onCanvas && live) {
    return <canvas ref={ref as Ref<HTMLCanvasElement>} className={cls} role="img" aria-label={label} />;
  }
  return (
    <pre ref={ref as Ref<HTMLPreElement>} className={cls} role="img" aria-label={label}>
      {still}
    </pre>
  );
}
