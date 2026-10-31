import type { AnchorHTMLAttributes, ButtonHTMLAttributes, Ref } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./button.css";

export type ButtonVariant = "plain" | "go" | "chip" | "link" | "icon";
export type ButtonSize = "md" | "sm";

/** The classes of a button, for an element that cannot be a Button (a <span> chip, a <label>). */
export function buttonClass({ variant = "plain", size = "md" }: { variant?: ButtonVariant; size?: ButtonSize } = {}, className?: string) {
  return cn("s1-btn", `s1-btn--${variant}`, size === "sm" && "s1-btn--sm", className);
}

type Own = { variant?: ButtonVariant; size?: ButtonSize };
export type ButtonProps = Own &
  (
    | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined; ref?: Ref<HTMLButtonElement> })
    | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; ref?: Ref<HTMLAnchorElement> })
  );

/**
 * The house buttons: "plain", a hairline box in mono type; "go", the same in
 * ink with an offset shadow in the accent, for the one thing to do; "chip", a
 * pill; "link", words underlined; "icon", the plain box made square, for a
 * mark that needs an aria-label (close, more actions). "sm" is a size down.
 * Pressed, a box sinks into its shadow. With `href` it is a link that looks
 * the part; without, a <button type="button">.
 */
export function Button({ variant, size, className, ...rest }: ButtonProps) {
  const cls = buttonClass({ variant, size }, className);
  if (rest.href !== undefined) return <a className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
  const { type = "button", ...button } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return <button type={type} className={cls} {...button} />;
}
