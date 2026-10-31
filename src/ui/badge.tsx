import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { Glyph, type Status } from "./glyph";
import "./tokens.css";
import "./badge.css";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** neutral: a hairline; info: dotted; ok: in ink with a tick; warn: hatched, a triangle; bad: in reverse, a cross. */
  status?: Status;
  /** Leave out the shape before the words. */
  plain?: boolean;
  /** The status in words: "Active", "Expired". */
  children: ReactNode;
};

/**
 * A status in a word, in mono caps in a small box. Each status differs in its
 * line, its fill and its shape, never in hue alone, so it reads in one ink, in
 * greyscale and to anyone who does not see colour; the words say it to a
 * screen reader. An app that wants hues sets `--s1-ok`, `--s1-warn`, `--s1-bad`
 * and `--s1-info` (and their `-tint`s); unset, every status is drawn in ink.
 */
export function Badge({ status = "neutral", plain = false, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cn("s1-badge", `s1-badge--${status}`, className)} {...rest}>
      {!plain && <Glyph status={status} />}
      {children}
    </span>
  );
}
