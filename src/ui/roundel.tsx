import type { ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./roundel.css";

/** A metro-style station roundel: a line's letter in a ring, sized to the type around it. */
export function Roundel({ children, hidden, className }: { children: ReactNode; hidden?: boolean; className?: string }) {
  return (
    <span className={cn("s1-roundel", className)} aria-hidden={hidden || undefined}>
      {children}
    </span>
  );
}
