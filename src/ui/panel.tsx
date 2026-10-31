"use client";

import { useId, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./panel.css";

type Props = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  /** The panel's heading; it names the section for screen readers. */
  title?: ReactNode;
  /** The heading's level, for where the panel sits in the page. */
  level?: 2 | 3 | 4;
  /** A line under the heading. */
  description?: ReactNode;
  /** Buttons at the right of the heading: "Create key". */
  actions?: ReactNode;
  /** A line under the body: a total, a link to more. */
  footer?: ReactNode;
  /** No padding round the body, for a Table or a list that brings its own. */
  flush?: boolean;
  /** "+" registration marks at the corners, as a Plate. */
  marks?: boolean;
  children?: ReactNode;
};

/**
 * A block of a console page in a hairline frame: a heading in the display face
 * with its actions beside it, the body, a footer. A <section> named by its
 * heading, so it is a region screen readers can jump to.
 */
export function Panel({ title, level = 2, description, actions, footer, flush = false, marks = false, className, children, ...rest }: Props) {
  const id = useId();
  const H = `h${level}` as const;
  return (
    <section className={cn("s1-panel", flush && "s1-panel--flush", marks && "s1-panel--marks", className)} aria-labelledby={title ? `${id}-title` : undefined} {...rest}>
      {(title || actions) && (
        <header className="s1-panel__head">
          <div className="s1-panel__titles">
            {title && (
              <H className="s1-panel__title" id={`${id}-title`}>
                {title}
              </H>
            )}
            {description && <p className="s1-panel__desc">{description}</p>}
          </div>
          {actions && <div className="s1-panel__actions">{actions}</div>}
        </header>
      )}
      <div className="s1-panel__body">{children}</div>
      {footer && <footer className="s1-panel__foot">{footer}</footer>}
    </section>
  );
}
