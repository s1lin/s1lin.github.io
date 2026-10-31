import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./visually-hidden.css";

type Props = HTMLAttributes<HTMLElement> & {
  /** The element: a span in a line of text, a div or a paragraph for a block. */
  as?: "span" | "div" | "p";
  children: ReactNode;
};

/**
 * Words for screen readers only: off the screen, still read. For the name of a
 * column of buttons, the status a shape stands for, a hint a picture gives.
 */
export function VisuallyHidden({ as: Tag = "span", className, ...rest }: Props) {
  return <Tag className={cn("s1-visually-hidden", className)} {...rest} />;
}
