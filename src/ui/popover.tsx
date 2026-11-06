"use client";

import { cloneElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode, type RefObject } from "react";
import { anchorPanel } from "./anchor";
import { cn } from "./cn";
import "./tokens.css";
import "./popover.css";

export type PopoverProps = {
  /** The one element that opens it: a <button>, or a Button. It is given aria-haspopup, aria-expanded, aria-controls, an id when it has none, and a click that opens and closes it (after its own onClick). */
  trigger: ReactElement;
  /** What the panel holds: a form, a picker, a few words. It is mounted while the panel is open. */
  children?: ReactNode;
  /** Open or not, when the app keeps it; called through `onOpenChange`. */
  open?: boolean;
  /** Open at first, when the popover keeps its own state. */
  defaultOpen?: boolean;
  /** Called with the next state: the trigger pressed, Esc, a press outside, focus gone elsewhere. */
  onOpenChange?: (open: boolean) => void;
  /** Below the trigger, or above it; it goes to the other side when there is no room. */
  side?: "bottom" | "top";
  /** Which edge of the trigger the panel lines up with, or its middle; it is kept on the screen either way. */
  align?: "start" | "center" | "end";
  /** Pixels between the trigger and the panel. */
  offset?: number;
  /** The panel's name, when no heading inside it names it. */
  label?: string;
  className?: string;
  /** The element to focus on opening. By default the first with `data-autofocus`, else the panel itself. */
  initialFocus?: RefObject<HTMLElement | null>;
};

/**
 * A panel that opens beside a button, over the page: a short form, a date
 * picker, a list to choose from, help for the controls. Not modal: the page
 * stays live, Tab goes on into the panel from its button, and Esc, a press
 * outside or focus moving elsewhere closes it. The panel sits in the top layer
 * (the Popover API), so no frame clips it; it opens on its side, or the other
 * when there is no room, and is never taller than the room it has
 * (`--s1-popover-room`, set on it).
 */
export function Popover({ trigger, children, open: given, defaultOpen = false, onOpenChange, side = "bottom", align = "center", offset = 6, label, className, initialFocus }: PopoverProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultOpen);
  const open = given ?? own;
  const mine = trigger.props as { id?: string; onClick?: (e: MouseEvent<HTMLElement>) => void };
  const triggerId = mine.id ?? `${id}-trigger`;
  const panel = useRef<HTMLDivElement>(null);
  // How it last closed: Esc gives focus back to the trigger; a press outside leaves it where the press puts it.
  const how = useRef<"esc" | "outside" | "">("");
  const latest = useRef({ open, onOpenChange, given });
  useEffect(() => {
    latest.current = { open, onOpenChange, given };
  });

  const set = useCallback((next: boolean, why: "esc" | "outside" | "" = "") => {
    if (next === latest.current.open) return;
    how.current = why;
    if (latest.current.given === undefined) setOwn(next);
    latest.current.onOpenChange?.(next);
  }, []);

  useLayoutEffect(() => {
    const p = panel.current;
    if (!p || !open) return;
    const anchor = () => document.getElementById(triggerId);
    // On its side of the trigger, or the other when the panel does not fit and there is more room there; never taller
    // than its room. Content that grows or shrinks while it is open (a section unfolding, a picture arriving) is
    // placed again, focus left where it is.
    const stop = anchorPanel(p, anchor, { side, align, offset, room: "--s1-popover-room" });
    const first = initialFocus?.current ?? p.querySelector<HTMLElement>("[data-autofocus]") ?? p;
    first.focus({ preventScroll: true });
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!p.contains(t) && !anchor()?.contains(t)) set(false, "outside");
    };
    // Focus gone to something else on the page (Tab past the panel's end, a click on another control): closed.
    const away = (e: FocusEvent) => {
      const to = e.relatedTarget as Node | null;
      if (to && !p.contains(to) && !anchor()?.contains(to)) set(false, "outside");
    };
    document.addEventListener("pointerdown", outside, true);
    p.addEventListener("focusout", away);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      p.removeEventListener("focusout", away);
      // closing with focus inside the panel (Esc, a choice that closes it) gives it back to the trigger
      const inside = p.contains(document.activeElement) || document.activeElement === document.body;
      stop();
      if (how.current === "esc" || (how.current !== "outside" && inside)) anchor()?.focus({ preventScroll: true });
      how.current = "";
    };
  }, [open, side, align, offset, initialFocus, set, triggerId]);

  const button = cloneElement(trigger as ReactElement<Record<string, unknown>>, {
    id: triggerId,
    "aria-haspopup": "dialog",
    "aria-expanded": open,
    "aria-controls": `${id}-panel`,
    onClick: (e: MouseEvent<HTMLElement>) => {
      mine.onClick?.(e);
      if (e.defaultPrevented) return;
      if (given === undefined) setOwn(!open);
      onOpenChange?.(!open);
    },
  });

  return (
    <>
      {button}
      <div
        ref={panel}
        id={`${id}-panel`}
        role="dialog"
        aria-label={label}
        tabIndex={-1}
        className={cn("s1-popover", className)}
        popover="manual"
        hidden={!open}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key !== "Escape") return;
          // kept from a dialog around it: Esc closes the popover, not the dialog
          e.preventDefault();
          e.stopPropagation();
          set(false, "esc");
        }}
      >
        {open && children}
      </div>
    </>
  );
}
