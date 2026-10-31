import type { HTMLAttributes, Ref } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./plate.css";

type Props = HTMLAttributes<HTMLElement> & {
  /** The element the plate is. */
  as?: "div" | "section" | "figure" | "article" | "aside";
  ref?: Ref<HTMLElement>;
};

/**
 * A box in a strong hairline with a "+" registration mark at each corner, in
 * its own ink, as on a drawing sheet. It sets no padding: give it room in CSS.
 */
export function Plate({ as: Tag = "div", className, ref, ...rest }: Props) {
  return <Tag ref={ref as Ref<HTMLDivElement>} className={cn("s1-plate", className)} {...rest} />;
}
