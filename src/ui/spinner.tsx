import { cn } from "./cn";
import { VisuallyHidden } from "./visually-hidden";
import "./tokens.css";
import "./spinner.css";

type Props = {
  /** What is happening, read by screen readers; shown beside the ring with `showLabel`. */
  label?: string;
  /** Show the label beside the ring, in mono caps. */
  showLabel?: boolean;
  /** 12, 16 or 28 pixels across. */
  size?: "sm" | "md" | "lg";
  /** Hide it from screen readers, where something else already says it is busy (aria-busy on a button). */
  decorative?: boolean;
  className?: string;
};

/**
 * Waiting, for a moment: a hairline ring with a quarter in ink, turning. A
 * status the screen reader reads ("Loading"), unless it is decorative.
 */
export function Spinner({ label = "Loading", showLabel = false, size = "md", decorative = false, className }: Props) {
  const ring = <span className={cn("s1-spinner__ring", `s1-spinner__ring--${size}`)} aria-hidden="true" />;
  if (decorative) return <span className={cn("s1-spinner", className)} aria-hidden="true">{ring}</span>;
  return (
    <span className={cn("s1-spinner", className)} role="status">
      {ring}
      {showLabel ? <span className="s1-spinner__label">{label}</span> : <VisuallyHidden>{label}</VisuallyHidden>}
    </span>
  );
}
