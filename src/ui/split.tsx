"use client";

import type { ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./split.css";

type SplitProps = {
  /** Names the panes as a group: "Split view". */
  label: string;
  /** Two panes side by side, a half each; otherwise the one pane fills the whole. */
  split: boolean;
  /** The panes (SplitPane), in any order: each says its side. */
  children: ReactNode;
  className?: string;
};

/**
 * Two panes side by side with one of them active, or one pane alone, in the same frame: going from one to two (or
 * back) moves no pane to another parent, so what a pane holds keeps its state. The panes are SplitPane children; an
 * app keeps the rest of its pages out of the frame or draws them as nothing.
 */
export function Split({ label, split, children, className }: SplitProps) {
  return (
    <div role="group" aria-label={label} className={cn("s1-split", className)} data-split={split || undefined}>
      {children}
    </div>
  );
}

type SplitPaneProps = {
  /** Names the pane: the page it holds. */
  label: string;
  /** Its side when two are shown: the start (the left in a left-to-right page) or the end. */
  side?: "start" | "end";
  /** The pane the app's keys, its address and a send follow: marked by a rule along its top while two are shown. */
  active?: boolean;
  /**
   * A press or the focus coming into a pane that is not active: called first (in the capture phase), so the pane is
   * active before the press does anything inside it.
   */
  onActivate?: () => void;
  children: ReactNode;
  className?: string;
};

/** One pane of a Split: a named region that becomes the active one when it is pressed or focused. */
export function SplitPane({ label, side = "start", active = false, onActivate, children, className }: SplitPaneProps) {
  const wake = onActivate && !active ? onActivate : undefined;
  return (
    <section aria-label={label} className={cn("s1-split__pane", className)} data-side={side} data-active={active || undefined} onPointerDownCapture={wake} onFocusCapture={wake}>
      {children}
    </section>
  );
}
