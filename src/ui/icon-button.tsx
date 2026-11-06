import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Button, type ButtonSize } from "./button";
import { cn } from "./cn";
import "./tokens.css";
import "./icon-button.css";

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> & {
  /** The one picture: an svg (lucide's, or your own) at 16px (14px at "sm"), hidden from screen readers. */
  icon: ReactNode;
  /** What it does, to what: "Delete Qwen". Its only name, so it is required; it is the tooltip too unless `title` says otherwise. */
  "aria-label": string;
  /** "danger": in the bad hue, filled with it under the pointer, for an action that removes something. */
  tone?: "default" | "danger";
  size?: ButtonSize;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * A square with one icon and no words: the ghost Button without its line or its paper, in the second ink, the ink
 * fill under the pointer; `tone="danger"` in the bad hue (a row's delete beside its menu's dots). It has no words to
 * be read, so its name is its `aria-label`, which its type requires, and its tooltip the same unless `title` says
 * otherwise. 40px square, 30px at "sm".
 */
export function IconButton({ icon, tone = "default", size = "md", className, title, ...rest }: IconButtonProps) {
  return <Button variant="ghost" size={size} icon={icon} title={title ?? rest["aria-label"]} className={cn("s1-icon-btn", tone === "danger" && "s1-icon-btn--danger", className)} {...rest} />;
}
