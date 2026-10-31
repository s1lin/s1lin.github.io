"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "./cn";
import { useS1Words } from "./words";
import "./tokens.css";
import "./dialog.css";

type Props = {
  /** Open or not: the dialog follows this, and asks to close through `onClose`. */
  open: boolean;
  /** Called on Esc, the close button or a click on the veil (when dismissible), and when the browser closes it. Set `open` false here. */
  onClose: () => void;
  /** The heading; it names the dialog. */
  title: ReactNode;
  /** A line under the heading; it describes the dialog. */
  description?: ReactNode;
  /** The body: words, a form. It is mounted while the dialog is open, so a form starts empty each time. */
  children?: ReactNode;
  /** The buttons at the foot, the main one last. */
  actions?: ReactNode;
  /** 420, 560 or 760 pixels wide at most; never wider than the screen less 16px a side. */
  size?: "sm" | "md" | "lg";
  /**
   * Esc, the close button and the veil close it. False for something that must be answered (a key shown once);
   * browsers still close it on a second Esc in a row, so no page can trap a reader, and `onClose` is called then.
   */
  dismissible?: boolean;
  /** The element to focus on opening. By default the first with `data-autofocus`, else the browser's choice: the first that takes focus. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** The close button's name; "Close" from S1Words by default. */
  closeLabel?: string;
  className?: string;
};

/**
 * A modal dialog on the native <dialog>, opened with showModal(): the page
 * behind is inert, so focus stays inside without a trap of our own, and Esc
 * closes it. Focus goes to the first `data-autofocus` element (or the first
 * that takes focus) and back to where it was on closing. A heading names it
 * and the description describes it; the page behind stops scrolling.
 */
export function Dialog({ open, onClose, title, description, children, actions, size = "md", dismissible = true, initialFocus, closeLabel, className }: Props) {
  const w = useS1Words();
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const back = useRef<HTMLElement | null>(null);
  const downOnVeil = useRef(false);
  const latest = useRef({ open, onClose, dismissible });
  useEffect(() => {
    latest.current = { open, onClose, dismissible };
  });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      back.current = document.activeElement as HTMLElement | null;
      d.showModal();
      const first = initialFocus?.current ?? d.querySelector<HTMLElement>("[data-autofocus]");
      first?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open, initialFocus]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    // Esc: answered here, so `open` stays the one truth; the browser closes it only if asked twice.
    const cancel = (e: Event) => {
      e.preventDefault();
      if (latest.current.dismissible) latest.current.onClose();
    };
    const close = () => {
      // a late event from an earlier close must not shut a dialog opened again since
      if (!d.open && latest.current.open) latest.current.onClose();
      const to = back.current;
      back.current = null;
      if (to?.isConnected && (document.activeElement === document.body || document.activeElement === null)) to.focus();
    };
    d.addEventListener("cancel", cancel);
    d.addEventListener("close", close);
    return () => {
      d.removeEventListener("cancel", cancel);
      d.removeEventListener("close", close);
    };
  }, []);

  // Unmounted while open (a route change, `{open && <Dialog …/>}`): close it first, so the browser gives focus back.
  useLayoutEffect(() => {
    const d = ref.current;
    return () => {
      if (d?.open) d.close();
    };
  }, []);

  // A body taller than the dialog scrolls; it then takes focus, as a region named by the heading, so a keyboard can scroll it.
  const body = useRef<HTMLDivElement>(null);
  const [tall, setTall] = useState(false);
  useEffect(() => {
    const el = body.current;
    if (!open || !el || !("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(() => setTall(el.scrollHeight > el.clientHeight + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cn("s1-dialog", `s1-dialog--${size}`, className)}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      // A click on the veil lands on the <dialog> itself; one that started inside (a drag) does not count.
      onPointerDown={(e) => {
        downOnVeil.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (dismissible && downOnVeil.current && e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="s1-dialog__box">
          <div className="s1-dialog__head">
            <div className="s1-dialog__titles">
              <h2 className="s1-dialog__title" id={`${id}-title`}>
                {title}
              </h2>
              {description && (
                <p className="s1-dialog__desc" id={`${id}-desc`}>
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button type="button" className="s1-dialog__close" aria-label={closeLabel ?? w.close} onClick={onClose}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                </svg>
              </button>
            )}
          </div>
          {children && (
            <div
              ref={body}
              className="s1-dialog__body"
              role={tall ? "region" : undefined}
              aria-labelledby={tall ? `${id}-title` : undefined}
              tabIndex={tall ? 0 : undefined}
            >
              {children}
            </div>
          )}
          {actions && <div className="s1-dialog__foot">{actions}</div>}
        </div>
      )}
    </dialog>
  );
}
