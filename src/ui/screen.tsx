import type { ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./screen.css";

/** A screenshot in a hairline browser frame: a bar with three dots and the address, an offset plate behind. */
export function Screen({ bar, children, className }: { bar: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("s1-screen", className)}>
      <div className="s1-screen__bar">{bar}</div>
      {children}
    </div>
  );
}
