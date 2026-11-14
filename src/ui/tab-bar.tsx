"use client";

import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { cn } from "./cn";
import { VisuallyHidden } from "./visually-hidden";
import "./tokens.css";
import "./tab-bar.css";

/** One tab at the screen's foot: its picture over its word, a page to go to or a button. */
export interface TabBarItem {
  /** What `current` names; unique in the bar. */
  id: string;
  /** Its word, under the picture. */
  label: ReactNode;
  /** The label in plain words, where it is not a string: the tooltip. */
  text?: string;
  /** The picture, about 22px, hidden from screen readers (an account's picture too: the word names it). */
  icon: ReactNode;
  /** A page: the tab is a link, so it opens in a new tab too; without it the tab is a button. */
  href?: string;
  /**
   * Called when it is chosen. On a link, a plain click (no new tab, no modifier key) goes here and not to `href`: your
   * router's step; any other click is the browser's.
   */
  onSelect?: (item: TabBarItem) => void;
  /** How many wait there, on the picture's corner: "3". Nothing is drawn for 0. Say what it counts in `countLabel`. */
  count?: number;
  /** What the count means, for screen readers: "3 need you". */
  countLabel?: string;
  /** A dot on the picture's corner for one thing to notice ("Running low"), said by `dotLabel`. */
  dot?: boolean;
  dotLabel?: string;
  disabled?: boolean;
  lang?: string;
}

export type TabBarProps = Omit<HTMLAttributes<HTMLElement>, "children" | "onSelect"> & {
  /** The landmark's name ("Tabs", "Main"). */
  label: string;
  items: TabBarItem[];
  /** The id of the tab you are on: `aria-current="page"` on it. */
  current?: string | null;
};

const plain = (node: ReactNode, text?: string) => text ?? (typeof node === "string" ? node : undefined);

/** A click the page handles itself; any other (a new tab, a new window) is the browser's. */
function ownClick(e: MouseEvent<HTMLElement>): boolean {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/**
 * A phone's bar of tabs at the screen's foot: three to five top-level places, each a picture over its word, a page to
 * go to (a link) or a button, with a count or a dot on the picture's corner. The tab you are on says so
 * (`aria-current`). It stands above the home indicator (the safe area's inset at the foot and the sides is its
 * padding). ← and → move focus along it, Home and End to its ends; every tab stays in the Tab order.
 */
export function TabBar({ label, items, current, className, ...rest }: TabBarProps) {
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.nativeEvent.isComposing) return;
    const all = [...e.currentTarget.querySelectorAll<HTMLElement>(".s1-tab-bar__item:not([aria-disabled='true']):not(:disabled)")];
    const at = all.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const next = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const to = e.key === next ? (at + 1) % all.length : e.key === back ? (at - 1 + all.length) % all.length : e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    all[to]!.focus();
  };

  return (
    <nav {...rest} aria-label={label} className={cn("s1-tab-bar", className)} onKeyDown={onKey}>
      <ul className="s1-tab-bar__items">
        {items.map((item) => {
          const name = plain(item.label, item.text);
          const here = current != null && item.id === current;
          const count = item.count ?? 0;
          const inner = (
            <>
              <span className="s1-tab-bar__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="s1-tab-bar__word">{item.label}</span>
              {count > 0 && (
                <span className="s1-tab-bar__count">
                  {/* said once: the words carry the number where there are words */}
                  <span aria-hidden={item.countLabel ? "true" : undefined}>{count}</span>
                  {item.countLabel && <VisuallyHidden>, {item.countLabel}</VisuallyHidden>}
                </span>
              )}
              {item.dot && count === 0 && (
                <span className="s1-tab-bar__dot">{item.dotLabel && <VisuallyHidden>, {item.dotLabel}</VisuallyHidden>}</span>
              )}
            </>
          );
          return (
            <li key={item.id}>
              {item.href !== undefined ? (
                <a
                  href={item.disabled ? undefined : item.href}
                  className="s1-tab-bar__item"
                  aria-current={here ? "page" : undefined}
                  aria-disabled={item.disabled ? "true" : undefined}
                  title={name}
                  lang={item.lang}
                  data-tab-id={item.id}
                  onClick={(e) => {
                    if (item.disabled) return e.preventDefault();
                    if (!item.onSelect || !ownClick(e)) return;
                    e.preventDefault();
                    item.onSelect(item);
                  }}
                >
                  {inner}
                </a>
              ) : (
                <button
                  type="button"
                  className="s1-tab-bar__item"
                  aria-current={here ? "page" : undefined}
                  disabled={item.disabled}
                  title={name}
                  lang={item.lang}
                  data-tab-id={item.id}
                  onClick={() => item.onSelect?.(item)}
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
