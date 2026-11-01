import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./empty-state.css";

type Props = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** What is missing, said plainly: "No keys yet". */
  title: ReactNode;
  /** Why, or what to do. */
  children?: ReactNode;
  /** The one thing to do: a Button. */
  action?: ReactNode;
  /** "sm" for inside a table or a small panel. */
  size?: "md" | "sm";
  /**
   * Your own mark in place of the empty frame: a one-colour svg drawn in
   * currentColor (an app's logo), 56px square (40px at "sm"), in the second
   * ink, so it is one colour on either paper. Hidden from screen readers.
   */
  mark?: ReactNode;
};

/**
 * Nothing here yet, said kindly: an empty frame marked at its corners (or
 * your own mark), a line in the display face, what to do next. For an empty
 * list, a search with no results, a page before its first use.
 */
export function EmptyState({ title, children, action, size = "md", mark, className, ...rest }: Props) {
  return (
    <div className={cn("s1-empty", `s1-empty--${size}`, className)} {...rest}>
      {mark != null && mark !== false ? (
        <span className="s1-empty__own" aria-hidden="true">
          {mark}
        </span>
      ) : (
        <span className="s1-empty__mark" aria-hidden="true" />
      )}
      <p className="s1-empty__title">{title}</p>
      {children && <div className="s1-empty__text">{children}</div>}
      {action && <div className="s1-empty__action">{action}</div>}
    </div>
  );
}
