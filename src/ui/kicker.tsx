import type { ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./kicker.css";

/** The line over a heading: a Japanese label in mincho, then the rest in spaced mono caps. */
export function Kicker({ ja, children, className }: { ja?: string; children: ReactNode; className?: string }) {
  return (
    <p className={cn("s1-kicker", className)}>
      {ja && <span lang="ja">{ja}</span>} {children}
    </p>
  );
}
