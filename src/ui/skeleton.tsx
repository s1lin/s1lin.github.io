import type { CSSProperties } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./skeleton.css";

type Props = {
  /** "line", a bar the height of a line of text; "block", a box (`height` it); "circle", a disc. */
  shape?: "line" | "block" | "circle";
  /** Lines of text: each a bar, the last one shorter. */
  lines?: number;
  /** Any CSS length; lines and blocks fill their box by default. */
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  className?: string;
};

/**
 * Where something is still coming: grey bars in the shape of the text or box
 * it will be, a lighter band passing over them. Hidden from screen readers;
 * mark the region that is loading with aria-busy, or say "Loading" once.
 */
export function Skeleton({ shape = "line", lines = 1, width, height, className }: Props) {
  if (shape === "line" && lines > 1) {
    return (
      <span className={cn("s1-skeleton-lines", className)} aria-hidden="true" style={{ width }}>
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className="s1-skeleton" style={i === lines - 1 ? { width: "62%" } : undefined} />
        ))}
      </span>
    );
  }
  return <span className={cn("s1-skeleton", `s1-skeleton--${shape}`, className)} aria-hidden="true" style={{ width, height }} />;
}
