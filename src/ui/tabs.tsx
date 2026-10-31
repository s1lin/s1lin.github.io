import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./tabs.css";

export interface Tab {
  /** Unique among the tabs; the value `onValueChange` gives. */
  id: string;
  label: ReactNode;
  /** The panel. */
  content: ReactNode;
  disabled?: boolean;
}

type Props = {
  tabs: Tab[];
  /** What the tabs are, for screen readers: "Usage". */
  label: string;
  /** The open tab, when controlled. */
  value?: string;
  /** The tab open at first, when not; the first that is not disabled by default. */
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  /** "auto": the arrow keys open the tab they reach; "manual": they only move, Enter or Space opens. Manual suits panels that load. */
  activation?: "auto" | "manual";
  /** Keep every panel mounted (hidden), so their state survives a switch; only the open one by default. */
  keepMounted?: boolean;
  className?: string;
};

/**
 * Panels behind a row of tabs, as the ARIA practices draw them: one tab stop
 * for the row (roving tabindex), ← and → between tabs, Home and End to the
 * ends, the open tab marked with a bar in ink. On a narrow screen the row
 * scrolls sideways.
 */
export function Tabs({ tabs, label, value, defaultValue, onValueChange, activation = "auto", keepMounted = false, className }: Props) {
  const id = useId();
  const usable = tabs.filter((t) => !t.disabled);
  const [own, setOwn] = useState(defaultValue ?? usable[0]?.id);
  const current = value ?? own;
  // The tab that takes focus from outside: the open one, or the first usable when the open one is gone.
  const stop = usable.some((t) => t.id === current) ? current : usable[0]?.id;
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  function open(next: string) {
    if (value === undefined) setOwn(next);
    if (next !== current) onValueChange?.(next);
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const at = usable.findIndex((t) => buttons.current.get(t.id) === document.activeElement);
    if (at < 0) return;
    const to =
      e.key === "ArrowRight" ? (at + 1) % usable.length : e.key === "ArrowLeft" ? (at - 1 + usable.length) % usable.length : e.key === "Home" ? 0 : e.key === "End" ? usable.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    const tab = usable[to];
    buttons.current.get(tab.id)?.focus();
    if (activation === "auto") open(tab.id);
  }

  return (
    <div className={cn("s1-tabs", className)}>
      <div className="s1-tabs__list" role="tablist" aria-label={label} onKeyDown={onKey}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              if (el) buttons.current.set(t.id, el);
              else buttons.current.delete(t.id);
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            className="s1-tabs__tab"
            aria-selected={t.id === current}
            aria-controls={`${id}-panel-${i}`}
            tabIndex={t.id === stop ? 0 : -1}
            disabled={t.disabled}
            onClick={() => open(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.id} className="s1-tabs__panel" role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} tabIndex={0} hidden={t.id !== current}>
          {(t.id === current || keepMounted) && t.content}
        </div>
      ))}
    </div>
  );
}
