import { cn } from "./cn";
import "./tokens.css";
import "./glyph.css";

/** The five states a status can be in, the same in every part that shows one. */
export type Status = "neutral" | "info" | "ok" | "warn" | "bad";

/**
 * A status as a shape, in the ink around it: a dash (neutral), a ring (info),
 * a tick (ok), a triangle (warn), a cross (bad). Drawn in CSS, so it needs no
 * font and no icon set, and it reads without colour. It is decorative: the
 * words beside it must say the status.
 */
export function Glyph({ status, className }: { status: Status; className?: string }) {
  return <span className={cn("s1-glyph", `s1-glyph--${status}`, className)} aria-hidden="true" />;
}
