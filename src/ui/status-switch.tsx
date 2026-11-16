"use client";

import { useRef, type HTMLAttributes, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./status-switch.css";

export type StatusSwitchProps = Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role" | "aria-label" | "onChange"> & {
  /** The group's name, in the page's language, with the row's: "Status of Claude Standard". */
  label: string;
  /** The two states in words, the on state first: { on: "Active", off: "Disabled" }, { on: "On", off: "Off" }. */
  words: { on: ReactNode; off: ReactNode };
  /** The on state (Active, On) is the current one. */
  value: boolean;
  /** Called with the state pressed, or moved to with an arrow key, Home or End; never for the current one. */
  onValueChange?: (on: boolean) => void;
  /** A change is on its way: the group is busy, the dot under the state asked for pulses, presses are ignored, focus stays. */
  busy?: boolean;
  /** Neither state can be chosen (another change of the row holds it): both words are dimmed, still focusable. */
  disabled?: boolean;
  /** One state cannot be chosen from here (off, for the account signed in): its word is dimmed, the other works. */
  locked?: "on" | "off";
  /** 30px, a table row's line (sm, the default); 40px, a sheet or a form (md); 24px, a narrow column or a foot (xs). */
  size?: "md" | "sm" | "xs";
  ref?: Ref<HTMLSpanElement>;
};

const MOVES: Readonly<Record<string, "other" | "on" | "off">> = { ArrowLeft: "other", ArrowRight: "other", ArrowUp: "other", ArrowDown: "other", Home: "on", End: "off" };

/**
 * A row's two states as words, as LangSwitch draws the languages: no line, box or fill round them or round the
 * group; the current one a weight heavier with a dot under it, the other dimmer. The on state, when current, is in
 * the ok hue (--s1-ok, the ink until a theme sets it), so an active row reads at a glance; the off state, when
 * current, is in the ink. A radiogroup of two radios named by their words: Tab enters at the current one, an arrow
 * key, Home or End moves and chooses, a press on the other word chooses it, all at once (the page settles it and
 * may ask first). A span, so it may stand in a table's cell or a line of text.
 */
export function StatusSwitch({ label, words, value, onValueChange, busy = false, disabled = false, locked, size = "sm", className, ref, ...rest }: StatusSwitchProps) {
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const open = (on: boolean) => !disabled && !busy && locked !== (on ? "on" : "off");
  const choose = (on: boolean) => {
    if (on !== value && open(on)) onValueChange?.(on);
  };
  const key = (event: KeyboardEvent<HTMLButtonElement>, from: boolean) => {
    const move = MOVES[event.key];
    if (!move || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const to = move === "other" ? !from : move === "on";
    // a state that cannot be chosen now (busy, disabled, locked) keeps the focus where it is
    if (to !== value && !open(to)) return;
    items.current[to ? 0 : 1]?.focus();
    choose(to);
  };
  return (
    <span
      ref={ref}
      role="radiogroup"
      aria-label={label}
      aria-busy={busy || undefined}
      aria-disabled={disabled || undefined}
      className={cn("s1-status", `s1-status--${size}`, className)}
      {...rest}
    >
      {[true, false].map((on, i) => {
        const current = on === value;
        return (
          <button
            key={on ? "on" : "off"}
            ref={(el) => {
              items.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={current}
            aria-disabled={(current ? disabled || busy : !open(on)) || undefined}
            tabIndex={current ? 0 : -1}
            className={cn("s1-status__item", on ? "s1-status__item--on" : "s1-status__item--off")}
            onClick={() => choose(on)}
            onKeyDown={(event) => key(event, on)}
          >
            <span className="s1-status__label">{on ? words.on : words.off}</span>
          </button>
        );
      })}
    </span>
  );
}
