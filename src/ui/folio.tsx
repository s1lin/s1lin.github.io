import { cn } from "./cn";
import "./tokens.css";
import "./folio.css";

/** A page number, "— 04 —", centred at the foot of the nearest positioned box, as on a printed page. */
export function Folio({ page, className }: { page: string; className?: string }) {
  return <span className={cn("s1-folio", className)}>— {page} —</span>;
}
