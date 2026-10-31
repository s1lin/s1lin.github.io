"use client";

import { useRef, useState } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { Copy } from "./copy";
import { VisuallyHidden } from "./visually-hidden";
import "./tokens.css";
import "./secret.css";

type Props = {
  /** The secret: an API key, a token. */
  value: string;
  /** What it is, for the buttons' names and screen readers: "API key". */
  label?: string;
  /** Shown, when the reveal is controlled. */
  revealed?: boolean;
  /** Shown at first, when it is not. */
  defaultRevealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
  /** Characters left showing at the start and the end while it is hidden: [3, 4] shows "sk-••••…a1b2". None when they would show more than half of it. */
  keep?: [number, number];
  /** Leave out the Copy button. */
  noCopy?: boolean;
  /** The words for Show, Hide and the hidden value; translate them here. */
  words?: { show: string; hide: string; hidden: string };
  className?: string;
};

const DOTS = "••••••••••••";

/**
 * A secret shown as dots with its ends left showing, a Show button, and Copy,
 * which copies the whole value without showing it. While it is hidden the
 * page holds only the dots and the ends, so the value is not in the HTML, and
 * a screen reader hears "API key, hidden". If the copy fails, it is shown and
 * selected, for copying by hand.
 */
export function Secret({
  value,
  label = "Secret",
  revealed,
  defaultRevealed = false,
  onRevealedChange,
  keep = [0, 4],
  noCopy = false,
  words = { show: "Show", hide: "Hide", hidden: "hidden" },
  className,
}: Props) {
  const [own, setOwn] = useState(defaultRevealed);
  const shown = revealed ?? own;
  const text = useRef<HTMLElement>(null);
  const set = (next: boolean) => {
    if (revealed === undefined) setOwn(next);
    onRevealedChange?.(next);
  };
  // The ends show only while they leave at least half the value hidden, so a short secret is never shown whole.
  const [start, end] = keep[0] + keep[1] <= value.length / 2 ? keep : [0, 0];
  const head = value.slice(0, Math.max(0, start));
  const tail = end > 0 ? value.slice(-end) : "";

  function failed() {
    set(true);
    // after the value is in the page: select it for copying by hand
    requestAnimationFrame(() => {
      const el = text.current;
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
    });
  }

  return (
    <div className={cn("s1-secret", className)} role="group" aria-label={label} data-revealed={shown ? "" : undefined}>
      <code className="s1-secret__value" ref={text}>
        {shown ? (
          value
        ) : (
          <>
            <span aria-hidden="true">
              {head}
              <span className="s1-secret__dots">{DOTS}</span>
              {tail}
            </span>
            <VisuallyHidden>
              {label}, {words.hidden}
            </VisuallyHidden>
          </>
        )}
      </code>
      <span className="s1-secret__actions">
        <Button size="sm" aria-label={`${shown ? words.hide : words.show} ${label}`} onClick={() => set(!shown)}>
          {shown ? words.hide : words.show}
        </Button>
        {!noCopy && <Copy value={value} label={`Copy ${label}`} onCopy={(ok) => !ok && failed()} />}
      </span>
    </div>
  );
}
