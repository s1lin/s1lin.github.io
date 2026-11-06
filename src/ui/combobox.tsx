"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { anchorPanel } from "./anchor";
import { cn } from "./cn";
import { useField } from "./field";
import { useS1Words } from "./words";
import "./tokens.css";
import "./input.css";
import "./combobox.css";

/** Options under one heading; a group with no label is shown without one. */
export interface ComboboxGroup<T> {
  key: string;
  label?: ReactNode;
  items: T[];
}

type Own<T> = {
  /** The options to show now, in their groups, already filtered by what is typed (`onInputChange`). */
  groups: ComboboxGroup<T>[];
  /** The chosen item, or null. */
  value: T | null;
  /** Called with the item chosen, or null when the box is cleared. */
  onValueChange: (value: T | null) => void;
  /** Called with the text on every edit, with the item's words after a choice (or "" with `clearOnChoose`), and with "" after a clear: filter `groups` with it. */
  onInputChange?: (text: string) => void;
  /**
   * The box empties after a choice and `onInputChange` hears "": for a search that takes the reader somewhere, where
   * a choice is an act and not a value the box keeps. Keep `value` null.
   */
  clearOnChoose?: boolean;
  /** An item in words: what the box shows when it is chosen, and the option's name for screen readers. */
  itemText: (item: T) => string;
  /** An item's key, unique among them. */
  itemKey: (item: T) => string;
  /** What an option shows; its words (`itemText`) by default. */
  renderItem?: (item: T) => ReactNode;
  /** Shown in the list when nothing matches, and said as a status: "No matching city." */
  empty?: ReactNode;
  /** Before the text, inside the box: a magnifier. Words are read with the box. */
  prefix?: ReactNode;
  /** After the text, inside the box, before its buttons: a key's hint. Words are read with the box. */
  suffix?: ReactNode;
  placeholder?: string;
  id?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  /** In error without a Field around it. */
  invalid?: boolean;
  disabled?: boolean;
  /** "md" is 40px tall, as Input; "sm" 30px. */
  size?: "md" | "sm";
  /** The clear button's name; "Clear" from S1Words by default. */
  clearLabel?: string;
  /** The button that opens the list; false for a search, whose list opens as one types. */
  showButton?: boolean;
  /** The name of the button that opens the list; "Show options" from S1Words by default. */
  showLabel?: string;
  /** Added to the box (`s1-input`). */
  className?: string;
  /** Added to the list. */
  listClassName?: string;
};

/** Every other prop goes to the <input>, as Input's do: name, required, aria-keyshortcuts, enterKeyHint, onFocus. */
export type ComboboxProps<T> = Own<T> &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    | keyof Own<T>
    | "value"
    | "defaultValue"
    | "type"
    | "role"
    | "children"
    | "onChange"
    | "onKeyDown"
    | "onClick"
    | "onBlur"
    | "aria-autocomplete"
    | "aria-expanded"
    | "aria-controls"
    | "aria-activedescendant"
  >;

const isText = (n: ReactNode) => typeof n === "string" || typeof n === "number";

/**
 * A text box that suggests: type, and a list of what matches opens under it,
 * in groups; the arrows move through it, Enter or a click chooses, and the box
 * shows what was chosen. The combobox of the ARIA practices with a list that
 * autocompletes: focus stays in the box, the option under the arrows is its
 * active descendant. The app filters the options from the text it is given,
 * so a search on a server works as well as a list in memory. Drawn as Input,
 * with words or a mark before and after the text, a button that clears it and
 * one that opens the list. With `clearOnChoose` and no open button it is a
 * search that takes the reader somewhere: the box empties after a choice.
 */
export function Combobox<T>({
  groups,
  value,
  onValueChange,
  onInputChange,
  clearOnChoose = false,
  itemText,
  itemKey,
  renderItem,
  empty,
  prefix,
  suffix,
  placeholder,
  id,
  "aria-labelledby": labelledBy,
  "aria-label": label,
  invalid,
  disabled,
  size = "md",
  clearLabel,
  showButton = true,
  showLabel,
  className,
  listClassName,
  ...rest
}: ComboboxProps<T>) {
  const w = useS1Words();
  const auto = useId();
  const field = useField({ id, invalid, disabled, required: rest.required, "aria-describedby": rest["aria-describedby"], "aria-invalid": rest["aria-invalid"] });
  const prefixId = prefix != null && isText(prefix) ? `${auto}-prefix` : undefined;
  const suffixId = suffix != null && isText(suffix) ? `${auto}-suffix` : undefined;
  const describedBy = [prefixId, suffixId, field["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  const inputId = field.id ?? `${auto}-input`;
  const listId = `${auto}-list`;
  const optionId = (i: number) => `${auto}-option-${i}`;
  const box = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const pop = useRef<HTMLDivElement>(null);

  // What is typed, while it differs from the chosen item's words; null shows the chosen item.
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const chosen = value == null ? "" : itemText(value);
  const text = draft ?? chosen;
  const flat = groups.flatMap((g) => g.items);
  const chosenKey = value == null ? undefined : itemKey(value);
  const chosenAt = chosenKey === undefined ? -1 : flat.findIndex((item) => itemKey(item) === chosenKey);
  const at = flat.length === 0 || active < 0 ? -1 : Math.min(active, flat.length - 1);
  const shown = open && !disabled && (flat.length > 0 || (empty !== undefined && empty !== null));

  function show(where: "chosen" | "first" | "last") {
    setOpen(true);
    setActive(where === "chosen" && chosenAt >= 0 ? chosenAt : where === "last" ? flat.length - 1 : 0);
  }
  function choose(item: T) {
    const words = clearOnChoose ? "" : itemText(item);
    setDraft(null);
    setOpen(false);
    onValueChange(item);
    onInputChange?.(words);
  }
  function restore() {
    if (draft === null) return;
    setDraft(null);
    if (draft !== chosen) onInputChange?.(chosen);
  }
  // Leaving the box: words that match nothing chosen give way to the chosen item's, but a box left empty is a choice of
  // nothing (the keyboard's way to clear it, as × is the pointer's).
  function leave() {
    if (draft !== null && draft.trim() === "" && value != null) {
      setDraft(null);
      onValueChange(null);
      onInputChange?.("");
      return;
    }
    restore();
  }

  useLayoutEffect(() => {
    const p = pop.current;
    if (!p || !shown) return;
    // under the box and at least as wide, or above it when there is no room below; never taller than its room; placed
    // again as the list grows or shrinks while it filters
    return anchorPanel(p, () => box.current, { room: "--s1-combobox-room", matchWidth: true });
  }, [shown, flat.length]);

  // the option under the arrows stays in sight in a list that scrolls
  useEffect(() => {
    if (shown && at >= 0) document.getElementById(`${auto}-option-${at}`)?.scrollIntoView?.({ block: "nearest" });
  }, [shown, at, auto]);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const n = flat.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!shown) show("chosen");
        else if (n) setActive((was) => (Math.min(was, n - 1) + 1) % n);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!shown) show(chosenAt >= 0 ? "chosen" : "last");
        else if (n) setActive((was) => (was <= 0 ? n - 1 : Math.min(was, n) - 1));
        break;
      case "Enter": {
        const item = shown && at >= 0 ? flat[at] : undefined;
        if (item !== undefined) {
          e.preventDefault();
          choose(item);
        }
        break;
      }
      case "Escape":
        // kept from a dialog around it while the box has something to undo
        if (shown) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
        } else if (draft !== null) {
          e.preventDefault();
          e.stopPropagation();
          restore();
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  const keep = (e: { preventDefault: () => void }) => e.preventDefault();
  const clearable = !disabled && (value != null || text !== "");
  const isInvalid = field["aria-invalid"] !== undefined && field["aria-invalid"] !== false && field["aria-invalid"] !== "false";

  return (
    <>
      <span ref={box} className={cn("s1-input", `s1-input--${size}`, "s1-combobox", className)} data-invalid={isInvalid ? "" : undefined} data-disabled={field.disabled ? "" : undefined}>
        {/* in the page from the start, so what it says when nothing matches is read as it changes */}
        <span className="s1-combobox__status" role="status">
          {shown && flat.length === 0 ? empty : null}
        </span>
        {prefix != null && (
          <span className="s1-input__affix" id={prefixId}>
            {prefix}
          </span>
        )}
        <input
          {...rest}
          ref={input}
          type="text"
          role="combobox"
          className="s1-input__control"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={shown}
          aria-controls={listId}
          aria-activedescendant={shown && at >= 0 ? optionId(at) : undefined}
          aria-labelledby={labelledBy}
          aria-label={label}
          placeholder={placeholder}
          value={text}
          {...field}
          aria-describedby={describedBy}
          id={inputId}
          onChange={(e) => {
            setDraft(e.target.value);
            onInputChange?.(e.target.value);
            show("first");
          }}
          onClick={() => {
            if (!open) show("chosen");
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            setOpen(false);
            leave();
          }}
        />
        {suffix != null && (
          <span className="s1-input__affix s1-input__affix--end" id={suffixId}>
            {suffix}
          </span>
        )}
        {clearable && (
          <button
            type="button"
            tabIndex={-1}
            className="s1-combobox__button"
            aria-label={clearLabel ?? w.clear}
            onPointerDown={keep}
            onMouseDown={keep}
            onClick={() => {
              setDraft(null);
              setOpen(false);
              if (value != null) onValueChange(null);
              onInputChange?.("");
              input.current?.focus();
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
        {showButton && (
          <button
            type="button"
            tabIndex={-1}
            className="s1-combobox__button"
            aria-label={showLabel ?? w.showOptions}
            aria-expanded={shown}
            aria-controls={listId}
            disabled={field.disabled}
            onPointerDown={keep}
            onMouseDown={keep}
            onClick={() => {
              if (shown) setOpen(false);
              else show("chosen");
              input.current?.focus();
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 6l4.5 4.5L12.5 6" />
            </svg>
          </button>
        )}
      </span>
      <div ref={pop} className={cn("s1-combobox__list", listClassName)} popover="manual" hidden={!shown} onPointerDown={keep} onMouseDown={keep}>
        <div id={listId} role="listbox" aria-labelledby={labelledBy} aria-label={label}>
          {shown &&
            (() => {
              let i = 0;
              return groups.map((g, gi) => {
                if (!g.items.length) return null;
                const rows = g.items.map((item) => {
                  const n = i++;
                  const key = itemKey(item);
                  return (
                    <div
                      key={key}
                      id={optionId(n)}
                      role="option"
                      aria-selected={key === chosenKey}
                      aria-label={renderItem ? itemText(item) : undefined}
                      className="s1-combobox__option"
                      data-active={n === at ? "" : undefined}
                      onPointerMove={() => {
                        if (n !== at) setActive(n);
                      }}
                      onClick={() => choose(item)}
                    >
                      <span className="s1-combobox__words">{renderItem ? renderItem(item) : itemText(item)}</span>
                      {key === chosenKey && (
                        <svg className="s1-combobox__tick" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="M3.5 8.5l3 3 6-7" />
                        </svg>
                      )}
                    </div>
                  );
                });
                if (g.label == null) return <div key={g.key} role="group">{rows}</div>;
                return (
                  <div key={g.key} role="group" aria-labelledby={`${auto}-group-${gi}`}>
                    <div id={`${auto}-group-${gi}`} className="s1-combobox__label">
                      {g.label}
                    </div>
                    {rows}
                  </div>
                );
              });
            })()}
        </div>
        {shown && flat.length === 0 && (
          <div className="s1-combobox__empty" aria-hidden="true">
            {empty}
          </div>
        )}
      </div>
    </>
  );
}
