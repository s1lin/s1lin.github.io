import { cn } from "./cn";
import "./tokens.css";
import "./stack.css";

/** A line of small hairline tags in mono: what something is built with. */
export function Stack({ items, className }: { items: string[]; className?: string }) {
  return (
    <p className={cn("s1-stack", className)}>
      {items.map((s) => (
        <span key={s}>{s}</span>
      ))}
    </p>
  );
}
