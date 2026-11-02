import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./button.css";

export type ButtonVariant = "plain" | "go" | "ghost" | "chip" | "link" | "icon";
export type ButtonSize = "md" | "sm";

/** The classes of a button, for an element that cannot be a Button (a <span> chip, a <label>). */
export function buttonClass({ variant = "plain", size = "md" }: { variant?: ButtonVariant; size?: ButtonSize } = {}, className?: string) {
  return cn("s1-btn", `s1-btn--${variant}`, size === "sm" && "s1-btn--sm", className);
}

type Own = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * A picture before the words: an svg (lucide's, or your own), drawn at 16px
   * (14px at "sm"), 6px from them, and hidden from screen readers, so the
   * words stay the button's name. With no words the button is a square, and
   * needs an aria-label.
   */
  icon?: ReactNode;
  /** A picture after the words: an arrow for a link elsewhere, a caret for a menu. */
  iconEnd?: ReactNode;
};
export type ButtonProps = Own &
  (
    | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined; ref?: Ref<HTMLButtonElement> })
    | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; ref?: Ref<HTMLAnchorElement> })
  );

const none = (n: ReactNode) => n === undefined || n === null || n === false || n === "";

/**
 * The house buttons: "plain", a hairline box in mono type; "go", the same in
 * ink with an offset shadow in the accent, for the one thing to do; "ghost",
 * the box without its line, for a head or a toolbar (with aria-pressed it is
 * a toggle, the pressed one filled); "chip", a pill; "link", words underlined;
 * "icon", the plain box made square, for a mark that needs an aria-label
 * (close, more actions). "sm" is a size down. An action shows an `icon` and
 * a word. Under the pointer a button turns over, the ink and the paper
 * changing places (a toggle keeps its own fill). Pressed, a box sinks into
 * its shadow. With `href` it is a link that looks the part; without, a
 * <button type="button">.
 */
export function Button({ variant, size, icon, iconEnd, className, children, ...rest }: ButtonProps) {
  const pictured = !none(icon) || !none(iconEnd);
  const cls = buttonClass({ variant, size }, cn(pictured && "s1-btn--with-icon", pictured && none(children) && "s1-btn--icon-only", className));
  const body = pictured ? (
    <>
      {!none(icon) && (
        <span className="s1-btn__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
      {!none(iconEnd) && (
        <span className="s1-btn__icon" aria-hidden="true">
          {iconEnd}
        </span>
      )}
    </>
  ) : (
    children
  );
  if (rest.href !== undefined)
    return (
      <a className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {body}
      </a>
    );
  const { type = "button", ...button } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={type} className={cls} {...button}>
      {body}
    </button>
  );
}
