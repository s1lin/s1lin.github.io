"use client";

import { useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./tab-strip.css";

/** One tab: its words, an icon before them, a mark after them (a state in a dot or in words), and its close button. */
export interface TabStripTab {
  key: string;
  label: ReactNode;
  /** Before the words: the page's icon. */
  icon?: ReactNode;
  /** After the words: its state, as a dot or a word ("Needs you"), or a moon while it sleeps. */
  mark?: ReactNode;
  /** The tooltip: the whole title, when the tab is too narrow for it. */
  title?: string;
  /** Faded: asleep, or not on this device. */
  faded?: boolean;
  /** Keeps its words when the strip is crowded (a tab that needs you). */
  keep?: boolean;
}

type Props = {
  /** Names the list of tabs: "Open tabs". */
  label: string;
  tabs: TabStripTab[];
  /** The tab in front. */
  selected: string;
  /** A click, Enter or Space on a tab. */
  onSelect: (key: string) => void;
  /** The close button, a middle click, or Delete on a focused tab. */
  onClose: (key: string) => void;
  /** The close button's name for a tab: "Close tab". */
  closeLabel: string;
  /** Two tabs shown side by side, drawn as one joined tab. */
  pair?: [string, string] | undefined;
  /** A right click (or the context menu key) on a tab: the app's tab menu. */
  onMenu?: (key: string, event: MouseEvent<HTMLElement>) => void;
  /** After the tabs, in the strip's own row: "+", All tabs. */
  end?: ReactNode;
  className?: string;
};

/**
 * A strip of tabs, as a browser's: each with an icon, its words, a state mark and a close button; the tab in front
 * raised; a pair drawn joined. Tabs shrink to a floor as they crowd, a tab marked `keep` less; the app lists them all
 * elsewhere (All tabs). One `tablist`: the arrows, Home and End move focus across the tabs, Enter or Space brings one
 * to front, Delete closes it; a middle click closes too. The close button is for the pointer (Delete is the keys').
 */
export function TabStrip({ label, tabs, selected, onSelect, onClose, closeLabel, pair, onMenu, end, className }: Props) {
  const list = useRef<HTMLDivElement>(null);

  const focusAt = (i: number) => {
    const all = list.current?.querySelectorAll<HTMLElement>("[role=tab]");
    if (!all?.length) return;
    all[(i + all.length) % all.length]!.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLElement>, i: number, key: string) => {
    if (e.nativeEvent.isComposing) return;
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        return focusAt(i + 1);
      case "ArrowLeft":
        e.preventDefault();
        return focusAt(i - 1);
      case "Home":
        e.preventDefault();
        return focusAt(0);
      case "End":
        e.preventDefault();
        return focusAt(tabs.length - 1);
      case "Enter":
      case " ":
        e.preventDefault();
        return onSelect(key);
      case "Delete":
        e.preventDefault();
        return onClose(key);
    }
  };

  const tab = (t: TabStripTab, i: number, joined?: "first" | "second") => {
    const on = t.key === selected || (!!pair && pair.includes(t.key) && pair.includes(selected));
    return (
      <div
        key={t.key}
        role="tab"
        id={`s1-tab-${t.key}`}
        aria-selected={t.key === selected}
        tabIndex={t.key === selected ? 0 : -1}
        title={t.title}
        className="s1-tabstrip__tab"
        data-on={on || undefined}
        data-faded={t.faded || undefined}
        data-keep={t.keep || undefined}
        data-joined={joined}
        onClick={() => onSelect(t.key)}
        onKeyDown={(e) => onKey(e, i, t.key)}
        onAuxClick={(e) => {
          if (e.button !== 1) return;
          e.preventDefault();
          onClose(t.key);
        }}
        onMouseDown={(e) => {
          // A middle press would start the browser's autoscroll.
          if (e.button === 1) e.preventDefault();
        }}
        onContextMenu={onMenu ? (e) => (e.preventDefault(), onMenu(t.key, e)) : undefined}
      >
        {t.icon && <span className="s1-tabstrip__icon" aria-hidden="true">{t.icon}</span>}
        <span className="s1-tabstrip__label">{t.label}</span>
        {t.mark && <span className="s1-tabstrip__mark">{t.mark}</span>}
        <button
          type="button"
          tabIndex={-1}
          className="s1-tabstrip__close"
          aria-label={closeLabel}
          title={closeLabel}
          onClick={(e) => {
            e.stopPropagation();
            onClose(t.key);
          }}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      </div>
    );
  };

  const items: ReactNode[] = [];
  for (let i = 0; i < tabs.length; i++) {
    const t = tabs[i]!;
    const next = tabs[i + 1];
    if (pair && next && t.key === pair[0] && next.key === pair[1]) {
      items.push(
        <div key={`pair:${t.key}`} className="s1-tabstrip__pair" role="presentation">
          {tab(t, i, "first")}
          {tab(next, i + 1, "second")}
        </div>,
      );
      i++;
      continue;
    }
    items.push(tab(t, i));
  }

  return (
    <div className={cn("s1-tabstrip", className)}>
      <div ref={list} role="tablist" aria-label={label} aria-orientation="horizontal" className="s1-tabstrip__list">
        {items}
      </div>
      {end && <div className="s1-tabstrip__end">{end}</div>}
    </div>
  );
}
