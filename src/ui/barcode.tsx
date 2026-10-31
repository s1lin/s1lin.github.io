import { cn } from "./cn";
import "./tokens.css";
import "./barcode.css";

/**
 * An id as a barcode, the id printed under it. The bars are drawn from the
 * id's hex digits, two bars and two spaces a digit, between guards at the ends
 * and the middle; each id draws its own, but it is not a code a scanner reads.
 */
export function Barcode({ id, label = true, className }: { id: string; label?: boolean; className?: string }) {
  let x = 0;
  let d = "";
  const bar = (w: number) => {
    d += `M${x} 0h${w}v1h-${w}z`;
    x += w;
  };
  const guard = () => {
    bar(1);
    x += 1;
    bar(1);
    x += 1;
  };
  const hex = id.replace(/-/g, "");
  guard();
  [...hex].forEach((c, i) => {
    const n = parseInt(c, 16);
    if (i === hex.length / 2) guard();
    bar(1 + (n & 1));
    x += 1 + ((n >> 1) & 1);
    bar(1 + ((n >> 2) & 1));
    x += 1 + ((n >> 3) & 1);
  });
  guard();
  return (
    <span className={cn("s1-barcode", className)} title={id}>
      <svg viewBox={`0 0 ${x - 1} 1`} preserveAspectRatio="none" aria-hidden="true">
        <path d={d} />
      </svg>
      {label && <span className="s1-barcode__id">{id}</span>}
    </span>
  );
}
