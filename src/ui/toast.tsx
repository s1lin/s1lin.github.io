import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { Glyph, type Status } from "./glyph";
import { VisuallyHidden } from "./visually-hidden";
import "./tokens.css";
import "./toast.css";

export interface ToastOptions {
  /** The message: "Key created". */
  title: ReactNode;
  /** A line under it. */
  description?: ReactNode;
  /** The shape before it and the word read first, as Notice. */
  status?: Status;
  /** One button in the toast: "Undo", "View". A toast with one stays until it is dismissed. */
  action?: { label: string; onClick: () => void };
  /** Milliseconds on screen; Infinity to stay. 5000 by default; a toast with an action stays. */
  duration?: number;
  /** Give the same id again to replace a toast in place ("Saving…", then "Saved"). */
  id?: string;
}

interface Item extends ToastOptions {
  id: string;
}

/* The toasts, outside React so toast() can be called from anywhere; the Toaster shows them. */
let items: Item[] = [];
let made = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function show(input: string | ToastOptions): string {
  const options = typeof input === "string" ? { title: input } : input;
  const id = options.id ?? `s1-toast-${++made}`;
  const item = { ...options, id };
  items = items.some((t) => t.id === id) ? items.map((t) => (t.id === id ? item : t)) : [...items, item].slice(-5);
  emit();
  return id;
}

/**
 * Show a toast: `toast("Saved")`, or `toast({ title, description, status,
 * action, duration })`. Returns its id; `toast.dismiss(id)` takes it away, and
 * `toast.dismiss()` takes them all. A <Toaster /> must be on the page.
 */
export const toast = Object.assign(show, {
  dismiss(id?: string) {
    items = id === undefined ? [] : items.filter((t) => t.id !== id);
    emit();
  },
});

/** What a screen reader hears before a toast's words, by status; the shape says it on screen. */
const SAID: Record<Status, string> = { neutral: "", info: "Note: ", ok: "Done: ", warn: "Warning: ", bad: "Error: " };

function One({ item, paused, dismissLabel, words }: { item: Item; paused: boolean; dismissLabel: string; words: Record<Status, string> }) {
  const ms = item.duration ?? (item.action ? Infinity : 5000);
  const left = useRef(ms);
  const since = useRef(0);
  // a replaced toast starts its time again
  useEffect(() => {
    left.current = ms;
  }, [item, ms]);
  useEffect(() => {
    if (paused || !Number.isFinite(left.current)) return;
    since.current = Date.now();
    const t = window.setTimeout(() => toast.dismiss(item.id), left.current);
    return () => {
      window.clearTimeout(t);
      left.current -= Date.now() - since.current;
    };
  }, [paused, item]);

  const status = item.status ?? "neutral";
  return (
    <li className={cn("s1-toast", `s1-toast--${status}`)}>
      {status !== "neutral" && <Glyph status={status} className="s1-toast__glyph" />}
      <div className="s1-toast__body">
        <p className="s1-toast__title">
          {words[status] && <VisuallyHidden>{words[status]}</VisuallyHidden>}
          {item.title}
        </p>
        {item.description && <p className="s1-toast__desc">{item.description}</p>}
        {item.action && (
          <Button
            size="sm"
            className="s1-toast__action"
            onClick={() => {
              item.action!.onClick();
              toast.dismiss(item.id);
            }}
          >
            {item.action.label}
          </Button>
        )}
      </div>
      <button type="button" className="s1-toast__close" aria-label={dismissLabel} onClick={() => toast.dismiss(item.id)}>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </li>
  );
}

type Props = {
  /** Which corner; on a phone they take the width of the screen at that edge. */
  position?: "bottom-end" | "bottom-start" | "top-end" | "top-start";
  /** The region's name, for screen readers. */
  label?: string;
  /** The close buttons' name. */
  dismissLabel?: string;
  /** The status words read first; translate them here. */
  statusLabels?: Record<Status, string>;
  className?: string;
};

/**
 * Where toasts appear: put one on the page, once. Short messages about
 * something just done, in a polite live region that is in the page from the
 * start, so each new toast is read out without moving focus; a toast called
 * as a dialog closes is shown a frame later, once the page behind it is
 * live again. A toast leaves
 * after five seconds, but not while the pointer is over the toasts or focus is
 * in them; one with an action stays until it is dismissed, so there is time to
 * reach its button.
 */
export function Toaster({ position = "bottom-end", label = "Notifications", dismissLabel = "Dismiss", statusLabels = SAID, className }: Props) {
  // A frame late: a toast called as a modal dialog closes ("close(); toast(…)") then lands after the page
  // behind the dialog is no longer inert, so the live region still reads it. Empty in server HTML.
  const [list, setList] = useState<Item[]>([]);
  useEffect(() => {
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setList(items));
    };
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
      cancelAnimationFrame(frame);
    };
  }, []);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  return (
    <section className={cn("s1-toaster", `s1-toaster--${position}`, className)} aria-label={label}>
      <ol
        aria-live="polite"
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setFocus(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
        }}
      >
        {list.map((t) => (
          <One key={t.id} item={t} paused={hover || focus} dismissLabel={dismissLabel} words={statusLabels} />
        ))}
      </ol>
    </section>
  );
}
