import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./section-label.css";

type Props = HTMLAttributes<HTMLHeadingElement> & {
  /** A word in Japanese before the label, set large in mincho. */
  ja?: string;
  /** The element: a heading at the right level, or a paragraph. */
  as?: "h2" | "h3" | "h4" | "p";
  children: ReactNode;
};

/**
 * A section's label: mono caps over a strong hairline, a mincho word first.
 * Where the browser has scroll-driven animations, the label draws in from the
 * left as it comes into view; readers who prefer reduced motion see it drawn.
 */
export function SectionLabel({ ja, as: Tag = "h2", className, children, ...rest }: Props) {
  return (
    <Tag className={cn("s1-section-label", className)} {...rest}>
      {ja && <span lang="ja">{ja}</span>} {children}
    </Tag>
  );
}
