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
};

/**
 * Nothing here yet, said kindly: an empty frame marked at its corners, a
 * line in the display face, what to do next. For an empty list, a search with
 * no results, a page before its first use.
 */
export function EmptyState({ title, children, action, size = "md", className, ...rest }: Props) {
  return (
    <div className={cn("s1-empty", `s1-empty--${size}`, className)} {...rest}>
      <span className="s1-empty__mark" aria-hidden="true" />
      <p className="s1-empty__title">{title}</p>
      {children && <div className="s1-empty__text">{children}</div>}
      {action && <div className="s1-empty__action">{action}</div>}
    </div>
  );
}
