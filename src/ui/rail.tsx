"use client";

import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactElement, ReactNode } from "react";
import { cn } from "./cn";
import { VisuallyHidden } from "./visually-hidden";
import "./tokens.css";
import "./rail.css";

/** One place on the rail: its picture over its word, a page to go to or a button. */
export interface RailItem {
  /** What `current` names; unique in the rail. */
  id: string;
  /** Its word, under the picture (with `words={false}`, its name only). */
  label: ReactNode;
  /** The label in plain words, where it is not a string: the tooltip and, without words, the name. */
  text?: string;
  /** The picture, about 22px, hidden from screen readers. */
  icon: ReactNode;
  /** A page: the item is a link, so it opens in a new tab too; without it the item is a button. */
  href?: string;
  /**
   * Called when it is chosen. On a link, a plain click (no new tab, no modifier key) goes here and not to `href`: your
   * router's step; any other click is the browser's.
   */
  onSelect?: (item: RailItem) => void;
  /** A button that is a switch (a panel shown or not): `aria-pressed`. */
  pressed?: boolean;
  /** How many wait there, on the picture's corner: "3". Nothing is drawn for 0. Say what it counts in `countLabel`. */
  count?: number;
  /** What the count means, for screen readers: "3 need you". */
  countLabel?: string;
  disabled?: boolean;
  lang?: string;
}

export type RailProps = Omit<HTMLAttributes<HTMLElement>, "children" | "onSelect"> & {
  /** The landmark's name ("Places"), or the group's ("This chat's panels"). */
  label: string;
  items: RailItem[];
  /** The id of the place you are at: `aria-current="page"` on it. */
  current?: string | null;
  /** The words under the pictures; `false`: pictures only, the words as names and tooltips (a dock of switches). */
  words?: boolean;
  /** Over the places, as tall as the app's header (`--s1-rail-head-h`): the app's mark. */
  head?: ReactNode;
  /** Under the places, at the rail's foot: the account. */
  foot?: ReactNode;
  /** The edge it stands at: the start (its hairline on its end side) or the end (on its start side). */
  edge?: "start" | "end";
  /** A group of switches (`role="group"`) instead of a navigation landmark. */
  group?: boolean;
  /** Puts an item's element inside something of yours (a Popover around it, a flyout beside the rail). */
  wrap?: (item: RailItem, element: ReactElement) => ReactNode;
};

const plain = (node: ReactNode, text?: string) => text ?? (typeof node === "string" ? node : undefined);

/** A click the page handles itself; any other (a new tab, a new window) is the browser's. */
function ownClick(e: MouseEvent<HTMLElement>): boolean {
  return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/**
 * A column of places at the window's edge: each a picture over its word, a page to go to (a link) or a button (a
 * panel to show), with a count on the picture's corner. The place you are at says so (`aria-current`), a switch that is
 * on is pressed. Its head is as tall as the app's header and holds the app's mark; its foot, the account. Without words
 * it is a dock of switches (a chat's side panels). ↑ and ↓ move focus along it, Home and End to its ends; every place
 * stays in the Tab order.
 */
export function Rail({ label, items, current, words = true, head, foot, edge = "start", group = false, wrap, className, ...rest }: RailProps) {
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.nativeEvent.isComposing) return;
    const all = [...e.currentTarget.querySelectorAll<HTMLElement>(".s1-rail__items .s1-rail__item:not([aria-disabled='true']):not(:disabled)")];
    const at = all.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    const to = e.key === "ArrowDown" ? (at + 1) % all.length : e.key === "ArrowUp" ? (at - 1 + all.length) % all.length : e.key === "Home" ? 0 : e.key === "End" ? all.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    all[to]!.focus();
  };

  const element = (item: RailItem): ReactElement => {
    const name = plain(item.label, item.text);
    const here = current != null && item.id === current;
    const count = item.count ?? 0;
    const inner = (
      <>
        <span className="s1-rail__icon" aria-hidden="true">
          {item.icon}
        </span>
        <span className="s1-rail__word">{item.label}</span>
        {count > 0 && (
          <span className="s1-rail__count">
            {count}
            {item.countLabel && <VisuallyHidden>, {item.countLabel}</VisuallyHidden>}
          </span>
        )}
      </>
    );
    if (item.href !== undefined) {
      return (
        <a
          href={item.disabled ? undefined : item.href}
          className="s1-rail__item"
          aria-current={here ? "page" : undefined}
          aria-disabled={item.disabled ? "true" : undefined}
          title={name}
          lang={item.lang}
          data-rail-id={item.id}
          onClick={(e) => {
            if (item.disabled) return e.preventDefault();
            if (!item.onSelect || !ownClick(e)) return;
            e.preventDefault();
            item.onSelect(item);
          }}
        >
          {inner}
        </a>
      );
    }
    return (
      <button
        type="button"
        className="s1-rail__item"
        aria-current={here ? "page" : undefined}
        aria-pressed={item.pressed === undefined ? undefined : item.pressed}
        disabled={item.disabled}
        title={name}
        lang={item.lang}
        data-rail-id={item.id}
        onClick={() => item.onSelect?.(item)}
      >
        {inner}
      </button>
    );
  };

  const Tag = group ? "div" : "nav";
  return (
    <Tag
      {...rest}
      {...(group ? { role: "group" } : {})}
      aria-label={label}
      className={cn("s1-rail", edge === "end" && "s1-rail--end", !words && "s1-rail--icons", className)}
      onKeyDown={onKey}
    >
      {head && <div className="s1-rail__head">{head}</div>}
      <ul className="s1-rail__items">
        {items.map((item) => {
          const el = element(item);
          return <li key={item.id}>{wrap ? wrap(item, el) : el}</li>;
        })}
      </ul>
      {foot && <div className="s1-rail__foot">{foot}</div>}
    </Tag>
  );
}
