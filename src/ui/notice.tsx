"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { Glyph, type Status } from "./glyph";
import { VisuallyHidden } from "./visually-hidden";
import "./tokens.css";
import "./notice.css";

/** What a screen reader hears before a notice's words, by status; the shape says it on screen. */
const SAID: Record<Status, string> = { neutral: "", info: "Note: ", ok: "Done: ", warn: "Warning: ", bad: "Error: " };

export type NoticeProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** info: a ring; ok: a tick; warn: a triangle and a hatched edge; bad: a cross and a double line. */
  status?: Status;
  /** The first line, in bold. */
  title?: ReactNode;
  /** What to know. */
  children?: ReactNode;
  /** A button or link under the words: "Top up", "Retry". */
  action?: ReactNode;
  /** Shows a close button; called when it is pressed. */
  onDismiss?: () => void;
  /** The close button's name. */
  dismissLabel?: string;
  /** The status word read first ("Warning: "); "" to say nothing. Translate it here. */
  statusLabel?: string;
};

/**
 * A message in the page, where it applies: a balance running low, a key that
 * expires, a payment that failed. Give it `role="alert"` when it appears in
 * answer to something the reader did, so it is read at once; a notice that is
 * there when the page loads needs none.
 */
export function Notice({ status = "info", title, children, action, onDismiss, dismissLabel = "Dismiss", statusLabel, className, ...rest }: NoticeProps) {
  const said = statusLabel ?? SAID[status];
  return (
    <div className={cn("s1-notice", `s1-notice--${status}`, className)} {...rest}>
      <Glyph status={status} className="s1-notice__glyph" />
      <div className="s1-notice__body">
        {title && (
          <p className="s1-notice__title">
            {said && <VisuallyHidden>{said}</VisuallyHidden>}
            {title}
          </p>
        )}
        {children && (
          <div className="s1-notice__text">
            {!title && said && <VisuallyHidden>{said}</VisuallyHidden>}
            {children}
          </div>
        )}
        {action && <div className="s1-notice__action">{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" className="s1-notice__close" aria-label={dismissLabel} onClick={onDismiss}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </div>
  );
}
