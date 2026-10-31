"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { Glyph, type Status } from "./glyph";
import { VisuallyHidden } from "./visually-hidden";
import { useS1Words } from "./words";
import "./tokens.css";
import "./notice.css";

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
  /** The close button's name; "Dismiss" from S1Words by default. */
  dismissLabel?: string;
  /** The status word a screen reader hears first ("Warning: "), as the shape says it on screen; "" to say nothing. From S1Words by default. */
  statusLabel?: string;
};

/**
 * A message in the page, where it applies: a balance running low, a key that
 * expires, a payment that failed. Give it `role="alert"` when it appears in
 * answer to something the reader did, so it is read at once; a notice that is
 * there when the page loads needs none.
 */
export function Notice({ status = "info", title, children, action, onDismiss, dismissLabel, statusLabel, className, ...rest }: NoticeProps) {
  const w = useS1Words();
  const said = statusLabel ?? { neutral: "", info: w.statusInfo, ok: w.statusOk, warn: w.statusWarn, bad: w.statusBad }[status];
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
        <button type="button" className="s1-notice__close" aria-label={dismissLabel ?? w.dismiss} onClick={onDismiss}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </div>
  );
}
