"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";
import { useS1Words } from "./words";
import "./tokens.css";
import "./command.css";

/** Results under one heading; a group with no label is shown without one, and an empty group not at all. */
export interface CommandGroup<T> {
  key: string;
  label?: ReactNode;
  items: T[];
}

/** One of the chips that narrow what the box looks through: All, Tasks, Files. */
export interface CommandScope {
  value: string;
  label: ReactNode;
}

type Props<T> = {
  /** Open or not: the palette follows this, and asks to close through `onClose`. */
  open: boolean;
  /** Called on Esc, the close button, a click on the veil, and when the browser closes it. Set `open` false here. */
  onClose: () => void;
  /** Names the dialog, the box and the list: "Search". */
  label: string;
  /** What is typed. The app keeps it, so it can rank, search a server and clear it. */
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
  /** The results to show now, in their groups, already ranked by the app. The first is chosen. */
  groups: CommandGroup<T>[];
  /** A result's key, unique among them. */
  itemKey: (item: T) => string;
  /** What a result shows; its words are its name for screen readers. */
  renderItem: (item: T) => ReactNode;
  /** Enter or a click on a result. The palette stays open: close it here when the choice takes the reader away. */
  onChoose: (item: T) => void;
  /** Chips under the box (filled, no border), as a radio group; none when left out. */
  scopes?: CommandScope[];
  scope?: string;
  onScopeChange?: (scope: string) => void;
  /** The chips' name: "Look in". */
  scopesLabel?: string;
  /** Before the text: a magnifier. */
  prefix?: ReactNode;
  /** Shown in place of the list when it is empty, and said as a status: "Nothing matches “x”." */
  empty?: ReactNode;
  /** A line under the list, said as it changes: "Searching your tasks…", an error with its Retry. */
  status?: ReactNode;
  /** The foot: the keys' hints. Left out on a full screen, where there are no keys. */
  foot?: ReactNode;
  /** The whole screen, the keyboard's half of it for the list: a phone. Under 640px it is full screen anyway. */
  fullScreen?: boolean;
  /** The close button's name (it shows on a full screen only); "Close" from S1Words by default. */
  closeLabel?: string;
  className?: string;
};

/**
 * A command palette: a dialog that is a search box over a list of results in
 * groups. Type, and the app ranks what matches; the first result is chosen, the
 * arrows move (and wrap), Enter or a click opens, Esc closes. The box is a
 * combobox whose listbox is always open, the result under the arrows its
 * active descendant, so focus never leaves the box. Chips under the box narrow
 * the scope. On the native <dialog> (showModal): the page behind is inert and
 * focus goes back on closing. Under 640px, or with `fullScreen`, it fills the
 * screen and shows a close button; there the foot's key hints are left out.
 */
export function Command<T>({
  open,
  onClose,
  label,
  query,
  onQueryChange,
  placeholder,
  groups,
  itemKey,
  renderItem,
  onChoose,
  scopes,
  scope,
  onScopeChange,
  scopesLabel,
  prefix,
  empty,
  status,
  foot,
  fullScreen = false,
  closeLabel,
  className,
}: Props<T>) {
  const w = useS1Words();
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const back = useRef<HTMLElement | null>(null);
  const downOnVeil = useRef(false);
  const latest = useRef({ open, onClose });
  useEffect(() => {
    latest.current = { open, onClose };
  });

  const shown = groups.filter((g) => g.items.length > 0);
  const flat = shown.flatMap((g) => g.items);
  const keys = flat.map(itemKey);
  // The chosen result by its key: it stays chosen while it is in the list (a server's results arriving below it), and
  // a new query chooses the first again.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [seenQuery, setSeenQuery] = useState(query);
  if (seenQuery !== query) {
    setSeenQuery(query);
    setActiveKey(null);
  }
  const found = activeKey === null ? -1 : keys.indexOf(activeKey);
  const at = flat.length === 0 ? -1 : Math.max(found, 0);
  const optionId = (i: number) => `${id}-option-${i}`;
  const latestKeys = useRef(keys);
  useLayoutEffect(() => {
    latestKeys.current = keys;
  });

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      back.current = document.activeElement as HTMLElement | null;
      d.showModal();
      input.current?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    // Esc: answered here, so `open` stays the one truth; the browser closes it only if asked twice.
    const cancel = (e: Event) => {
      e.preventDefault();
      latest.current.onClose();
    };
    const close = () => {
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

  // Unmounted while open: close it first, so the browser gives focus back.
  useLayoutEffect(() => {
    const d = ref.current;
    return () => {
      if (d?.open) d.close();
    };
  }, []);

  // the result under the arrows stays in sight in a list that scrolls
  useEffect(() => {
    if (open && at >= 0) document.getElementById(`${id}-option-${at}`)?.scrollIntoView?.({ block: "nearest" });
  }, [open, at, id]);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // a key that belongs to an IME (the Enter that commits 对话 typed in pinyin): never a choice
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    const n = flat.length;
    // from the latest state, so keys that come faster than renders each take their step
    const step = (by: 1 | -1) =>
      setActiveKey((was) => {
        const list = latestKeys.current;
        const from = was === null ? 0 : Math.max(list.indexOf(was), 0);
        return list[(from + by + list.length) % list.length] ?? null;
      });
    if (e.key === "ArrowDown" && n) {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowUp" && n) {
      e.preventDefault();
      step(-1);
    } else if (e.key === "Enter" && at >= 0) {
      e.preventDefault();
      onChoose(flat[at]!);
    }
  }

  function onScopeKey(e: KeyboardEvent<HTMLDivElement>) {
    if (!scopes?.length || !onScopeChange) return;
    const i = Math.max(0, scopes.findIndex((s) => s.value === scope));
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % scopes.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + scopes.length) % scopes.length : e.key === "Home" ? 0 : e.key === "End" ? scopes.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    onScopeChange(scopes[to]!.value);
    (e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]")[to])?.focus();
  }

  const keep = (e: { preventDefault: () => void }) => e.preventDefault();
  let index = 0;

  return (
    <dialog
      ref={ref}
      className={cn("s1-command", fullScreen && "s1-command--full", className)}
      aria-label={label}
      onPointerDown={(e) => {
        downOnVeil.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (downOnVeil.current && e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="s1-command__box">
          <div className="s1-command__head">
            <div className="s1-command__field">
              {prefix != null && <span className="s1-command__prefix">{prefix}</span>}
              <input
                ref={input}
                type="text"
                role="combobox"
                className="s1-command__input"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                aria-label={label}
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls={`${id}-list`}
                aria-activedescendant={at >= 0 ? optionId(at) : undefined}
                placeholder={placeholder}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <button type="button" className="s1-command__close" aria-label={closeLabel ?? w.close} onClick={onClose}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                </svg>
              </button>
            </div>
            {scopes && scopes.length > 0 && (
              <div className="s1-command__scopes" role="radiogroup" aria-label={scopesLabel} onKeyDown={onScopeKey}>
                {scopes.map((s) => {
                  const on = s.value === scope;
                  return (
                    <button key={s.value} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1} className="s1-command__scope" onClick={() => onScopeChange?.(s.value)}>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="s1-command__list" id={`${id}-list`} role="listbox" aria-label={label}>
            {shown.map((g) => (
              <div key={g.key} role="group" className="s1-command__group" aria-labelledby={g.label != null ? `${id}-group-${g.key}` : undefined}>
                {g.label != null && (
                  <div className="s1-command__label" id={`${id}-group-${g.key}`} role="presentation">
                    {g.label}
                  </div>
                )}
                {g.items.map((item) => {
                  const i = index++;
                  return (
                    <div
                      key={itemKey(item)}
                      id={optionId(i)}
                      role="option"
                      aria-selected={i === at}
                      data-active={i === at ? "" : undefined}
                      className="s1-command__option"
                      onPointerDown={keep}
                      onMouseDown={keep}
                      onPointerMove={() => {
                        if (i !== at) setActiveKey(itemKey(item));
                      }}
                      onClick={() => onChoose(item)}
                    >
                      {renderItem(item)}
                    </div>
                  );
                })}
              </div>
            ))}
            {flat.length === 0 && empty != null && <div className="s1-command__empty">{empty}</div>}
          </div>
          {/* in the page from the start, so what they say is read as it changes: the empty list's words (out of sight,
              they are on screen in the list) and the app's status line */}
          <div className="s1-command__said" role="status">
            {flat.length === 0 ? empty : null}
          </div>
          <div className="s1-command__status" role="status">
            {status}
          </div>
          {foot != null && <div className="s1-command__foot">{foot}</div>}
        </div>
      )}
    </dialog>
  );
}
