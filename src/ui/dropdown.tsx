"use client";

import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "./cn";
import { Glyph } from "./glyph";
import "./tokens.css";
import "./dropdown.css";

/* ------------------------------------------------------------------ the shared machinery */

const canPop = (el: HTMLElement) => typeof el.showPopover === "function";
const ITEMS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/** The items of one menu, in order, disabled ones too (they are reached and heard, not chosen); a submenu's are its own. */
const entries = (menu: HTMLElement) => [...menu.querySelectorAll<HTMLElement>(ITEMS)].filter((el) => el.closest('[role="menu"]') === menu);

/**
 * A list in the top layer, placed against what opened it: below it (or above, with no room below), lined up with
 * its start or end edge and at least as wide; or beside it, for a submenu (to its left with no room on the right).
 * Kept 8px inside the screen; never taller than the room it has (--s1-dropdown-room).
 */
function place(list: HTMLElement, at: DOMRect | undefined, how: "bottom" | "top" | "beside", align: "start" | "end") {
  if (!at) return;
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  if (how === "beside") {
    list.style.setProperty("--s1-dropdown-room", `${Math.max(0, vh - 16)}px`);
    const w = list.offsetWidth;
    const h = list.offsetHeight;
    const right = at.right - 2;
    const x = right + w > vw - 8 && at.left + 2 - w >= 8 ? at.left + 2 - w : Math.min(right, vw - w - 8);
    list.style.left = `${Math.round(Math.max(8, x))}px`;
    list.style.top = `${Math.round(Math.max(8, Math.min(at.top - 5, vh - h - 8)))}px`;
    return;
  }
  list.style.minWidth = `${Math.round(at.width)}px`;
  const below = vh - at.bottom - 4 - 8;
  const above = at.top - 4 - 8;
  list.style.setProperty("--s1-dropdown-room", `${Math.max(0, Math.round(Math.max(below, above)))}px`);
  const tall = list.offsetHeight;
  const room = how === "top" ? above : below;
  const other = how === "top" ? below : above;
  const side = tall > room && other > room ? (how === "top" ? "bottom" : "top") : how;
  list.style.setProperty("--s1-dropdown-room", `${Math.max(0, Math.round(side === "top" ? above : below))}px`);
  const w = list.offsetWidth;
  const h = list.offsetHeight;
  const x = align === "end" ? at.right - w : at.left;
  list.style.left = `${Math.round(Math.max(8, Math.min(x, vw - w - 8)))}px`;
  list.style.top = `${Math.round(Math.max(8, side === "top" ? at.top - 4 - h : at.bottom + 4))}px`;
}

/** The keys that move inside one menu: the arrows (wrapping), Home and End, and letters typed to jump. True when one was taken. */
function roam(e: KeyboardEvent<HTMLElement>, menu: HTMLElement, typed: { text: string; at: number }): boolean {
  const all = entries(menu);
  if (!all.length) return false;
  const i = all.indexOf(document.activeElement as HTMLElement);
  const go = (n: number) => all[(n + all.length) % all.length]?.focus();
  switch (e.key) {
    case "ArrowDown":
      go(i + 1);
      break;
    case "ArrowUp":
      go(i < 0 ? -1 : i - 1);
      break;
    case "Home":
    case "PageUp":
      go(0);
      break;
    case "End":
    case "PageDown":
      go(all.length - 1);
      break;
    default: {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey || e.key === " ") return false;
      const now = e.timeStamp;
      typed.text = now - typed.at < 700 ? typed.text + e.key.toLowerCase() : e.key.toLowerCase();
      typed.at = now;
      const order = [...all.slice(i + 1), ...all.slice(0, i + 1)];
      const pool = typed.text.length > 1 && i >= 0 ? [all[i], ...order] : order;
      pool.find((el) => el && (el.dataset.text ?? el.textContent ?? "").trim().toLowerCase().startsWith(typed.text))?.focus();
      return true;
    }
  }
  e.preventDefault();
  return true;
}

/** An item under the pointer takes focus, so the pointer and the keyboard mark the same one. */
const follow = (e: { currentTarget: HTMLElement }) => {
  if (document.activeElement !== e.currentTarget) e.currentTarget.focus({ preventScroll: true });
};

const TICK = (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
const DOT = (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="3" fill="currentColor" />
  </svg>
);
const CARET = (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M6 3.5l4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/* ------------------------------------------------------------------ the root and its button */

interface Root {
  id: string;
  open: boolean;
  /** Open or close; `refocus` gives focus back to the trigger first (a choice, Esc); `start` is where focus lands on opening. */
  set: (open: boolean, how?: { refocus?: boolean; start?: "first" | "last" }) => void;
  /** The trigger: the element that controls the list. */
  trigger: () => HTMLElement | null;
  /** Where focus lands on opening: the first item (a click, Enter, ↓) or the last (↑). */
  start: () => "first" | "last";
}

const RootContext = createContext<Root | null>(null);

function useRoot(part: string): Root {
  const root = useContext(RootContext);
  if (!root) throw new Error(`${part} must be inside a Dropdown`);
  return root;
}

/**
 * A button that opens a menu of actions, built from parts: the trigger, the
 * list, and in it items with icons, check items, radio items, labelled groups,
 * separators, submenus and rows of your own. The menu button of the ARIA
 * practices, as Menu (which takes its items as data); the list sits in the top
 * layer (the Popover API), so no frame clips it.
 */
export function Dropdown({ children, open: given, defaultOpen = false, onOpenChange }: { children: ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }) {
  const id = useId();
  const [own, setOwn] = useState(defaultOpen);
  const open = given ?? own;
  const where = useRef<"first" | "last">("first");
  const latest = useRef({ open, given, onOpenChange });
  useEffect(() => {
    latest.current = { open, given, onOpenChange };
  });
  const trigger = useCallback(
    () => [...document.querySelectorAll<HTMLElement>('[aria-haspopup="menu"][aria-controls]')].find((el) => el.getAttribute("aria-controls") === `${id}-menu`) ?? null,
    [id],
  );
  const start = useCallback(() => where.current, []);
  const set = useCallback(
    (next: boolean, how: { refocus?: boolean; start?: "first" | "last" } = {}) => {
      if (how.start) where.current = how.start;
      if (how.refocus) trigger()?.focus({ preventScroll: true });
      if (next === latest.current.open) return;
      latest.current.open = next;
      if (latest.current.given === undefined) setOwn(next);
      latest.current.onOpenChange?.(next);
    },
    [trigger],
  );
  const root = useMemo(() => ({ id, open, set, trigger, start }), [id, open, set, trigger, start]);
  return <RootContext.Provider value={root}>{children}</RootContext.Provider>;
}

/** The one element that opens the menu (a <button>, or a Button): given aria-haspopup, aria-expanded, aria-controls, an id when it has none, a click that opens and closes it and ↓ ↑ that open it. */
export function DropdownTrigger({ children }: { children: ReactElement }) {
  const root = useRoot("DropdownTrigger");
  const mine = children.props as { id?: string; onClick?: (e: MouseEvent<HTMLElement>) => void; onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void };
  return cloneElement(children as ReactElement<Record<string, unknown>>, {
    id: mine.id ?? `${root.id}-trigger`,
    "aria-haspopup": "menu",
    "aria-expanded": root.open,
    "aria-controls": `${root.id}-menu`,
    onClick: (e: MouseEvent<HTMLElement>) => {
      mine.onClick?.(e);
      if (e.defaultPrevented) return;
      root.set(!root.open, { start: "first" });
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      mine.onKeyDown?.(e);
      if (e.defaultPrevented) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        root.set(true, { start: e.key === "ArrowUp" ? "last" : "first" });
      } else if (e.key === "Escape" && root.open) {
        e.preventDefault();
        e.stopPropagation();
        root.set(false, { refocus: true });
      }
    },
  });
}

/** The menu: below its trigger, or above it when there is no room. What is in it is mounted while it is open. */
export function DropdownList({ children, align = "start", side = "bottom", className, label }: { children?: ReactNode; align?: "start" | "end"; side?: "bottom" | "top"; className?: string; label?: string }) {
  const root = useRoot("DropdownList");
  const list = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const { open, set, trigger, start } = root;

  useLayoutEffect(() => {
    const m = list.current;
    if (!m || !open) return;
    if (canPop(m) && !m.matches(":popover-open")) m.showPopover();
    // named by its trigger, whatever id the trigger brought
    const t = trigger();
    if (!label && t?.id) m.setAttribute("aria-labelledby", t.id);
    const again = () => place(m, trigger()?.getBoundingClientRect(), side, align);
    again();
    const all = entries(m);
    (start() === "last" ? all[all.length - 1] : all[0])?.focus({ preventScroll: true });
    if (!all.length) m.focus({ preventScroll: true });
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!m.contains(t) && !trigger()?.contains(t)) set(false);
    };
    document.addEventListener("pointerdown", outside, true);
    window.addEventListener("resize", again);
    window.addEventListener("scroll", again, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("resize", again);
      window.removeEventListener("scroll", again, true);
      if (canPop(m) && m.matches(":popover-open")) m.hidePopover();
    };
  }, [open, side, align, label, set, trigger, start]);

  return (
    <div
      ref={list}
      id={`${root.id}-menu`}
      role="menu"
      aria-labelledby={label ? undefined : `${root.id}-trigger`}
      aria-label={label}
      tabIndex={-1}
      className={cn("s1-dropdown", className)}
      popover="manual"
      hidden={!open}
      onKeyDown={(e) => {
        const m = list.current;
        if (!m) return;
        // Tab, from anywhere in the menu (a submenu too): closed, and Tab moves on from the trigger's place in the page
        if (e.key === "Tab") {
          trigger()?.focus({ preventScroll: true });
          set(false);
          return;
        }
        if ((e.target as HTMLElement).closest('[role="menu"]') !== m) return;
        if (e.key === "Escape") {
          // kept from a dialog around the menu: Esc closes the menu, not the dialog
          e.preventDefault();
          e.stopPropagation();
          set(false, { refocus: true });
          return;
        }
        roam(e, m, typed.current);
      }}
    >
      {open && children}
    </div>
  );
}

/* ------------------------------------------------------------------ items */

type ItemProps = Omit<HTMLAttributes<HTMLElement>, "onSelect" | "role" | "tabIndex" | "children"> & {
  children?: ReactNode;
  /** A picture before the words, drawn at 16px in the second ink; hidden from screen readers. */
  icon?: ReactNode;
  /** Called when the item is chosen, after the menu has closed and focus is back on its trigger. */
  onSelect?: () => void;
  /** Something that cannot be undone: in the bad status's hue, heavier, and a cross before it when it has no icon. */
  danger?: boolean;
  disabled?: boolean;
  /** Stay open after it is chosen. */
  keepOpen?: boolean;
  /** Words at the right: a shortcut, a count. */
  hint?: ReactNode;
  /** Makes the item a link. */
  href?: string;
};

/** One action. */
export function DropdownItem({ children, icon, onSelect, danger = false, disabled = false, keepOpen = false, hint, href, className, onClick, ...rest }: ItemProps) {
  const root = useRoot("DropdownItem");
  const common = {
    ...rest,
    role: "menuitem",
    tabIndex: -1,
    className: cn("s1-dropdown__item", danger && "s1-dropdown__item--danger", className),
    "aria-disabled": disabled || undefined,
    onPointerMove: follow,
    onClick: (e: MouseEvent<HTMLElement>) => {
      onClick?.(e);
      if (disabled) {
        e.preventDefault();
        return;
      }
      if (!keepOpen) root.set(false, { refocus: true });
      onSelect?.();
    },
  };
  const body = (
    <>
      {icon != null && icon !== false ? (
        <span className="s1-dropdown__icon" aria-hidden="true">
          {icon}
        </span>
      ) : (
        danger && (
          <span className="s1-dropdown__icon" aria-hidden="true">
            <Glyph status="bad" />
          </span>
        )
      )}
      {children}
      {hint != null && <span className="s1-dropdown__hint">{hint}</span>}
    </>
  );
  return href && !disabled ? (
    <a {...common} href={href}>
      {body}
    </a>
  ) : (
    <button type="button" {...common}>
      {body}
    </button>
  );
}

type CheckProps = Omit<HTMLAttributes<HTMLButtonElement>, "onSelect" | "role" | "tabIndex" | "children" | "onChange"> & {
  children?: ReactNode;
  /** On or off. */
  checked: boolean;
  /** Called with the new state when it is chosen. */
  onCheckedChange: (checked: boolean) => void;
  icon?: ReactNode;
  /** Stay open after it is chosen, so more than one can be turned on or off. */
  keepOpen?: boolean;
  disabled?: boolean;
};

/** A setting turned on or off from the menu: a tick at its start when on. */
export function DropdownCheckItem({ children, checked, onCheckedChange, icon, keepOpen = false, disabled = false, className, onClick, ...rest }: CheckProps) {
  const root = useRoot("DropdownCheckItem");
  return (
    <button
      type="button"
      {...rest}
      role="menuitemcheckbox"
      aria-checked={checked}
      tabIndex={-1}
      className={cn("s1-dropdown__item", className)}
      aria-disabled={disabled || undefined}
      onPointerMove={follow}
      onClick={(e) => {
        onClick?.(e);
        if (disabled) return;
        if (!keepOpen) root.set(false, { refocus: true });
        onCheckedChange(!checked);
      }}
    >
      <span className="s1-dropdown__mark" aria-hidden="true">
        {checked && TICK}
      </span>
      {icon != null && icon !== false && (
        <span className="s1-dropdown__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}

const RadioContext = createContext<{ value: string; onValueChange: (value: string) => void } | null>(null);

/** One choice of a few, from the menu: its radio items, in a group a screen reader names by `label`. */
export function DropdownRadioGroup({ children, value, onValueChange, label }: { children?: ReactNode; value: string; onValueChange: (value: string) => void; label?: string }) {
  const radio = useMemo(() => ({ value, onValueChange }), [value, onValueChange]);
  return (
    <RadioContext.Provider value={radio}>
      <div role="group" aria-label={label} className="s1-dropdown__group">
        {children}
      </div>
    </RadioContext.Provider>
  );
}

/** One choice of a DropdownRadioGroup: a dot at its start when it is the one chosen. */
export function DropdownRadioItem({ children, value, keepOpen = false, disabled = false }: { children?: ReactNode; value: string; keepOpen?: boolean; disabled?: boolean }) {
  const root = useRoot("DropdownRadioItem");
  const radio = useContext(RadioContext);
  if (!radio) throw new Error("DropdownRadioItem must be inside a DropdownRadioGroup");
  const on = radio.value === value;
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={on}
      tabIndex={-1}
      className="s1-dropdown__item"
      aria-disabled={disabled || undefined}
      onPointerMove={follow}
      onClick={() => {
        if (disabled) return;
        if (!keepOpen) root.set(false, { refocus: true });
        radio.onValueChange(value);
      }}
    >
      <span className="s1-dropdown__mark" aria-hidden="true">
        {on && DOT}
      </span>
      {children}
    </button>
  );
}

/** Items that belong together, named by the DropdownLabel at their head (or `label`, drawn as one). */
export function DropdownGroup({ children, label }: { children?: ReactNode; label?: ReactNode }) {
  const group = useRef<HTMLDivElement>(null);
  // named by its label when it has one at its head; never by an id that is not there
  useLayoutEffect(() => {
    const g = group.current;
    const head = g?.querySelector<HTMLElement>(":scope > .s1-dropdown__label");
    if (!g) return;
    if (head?.id) g.setAttribute("aria-labelledby", head.id);
    else g.removeAttribute("aria-labelledby");
  });
  return (
    <div ref={group} role="group" className="s1-dropdown__group">
      {label != null && <DropdownLabel>{label}</DropdownLabel>}
      {children}
    </div>
  );
}

/** A group's heading, in small capitals: not an item, so the arrows pass it. */
export function DropdownLabel({ children }: { children?: ReactNode }) {
  const id = useId();
  return (
    <div id={id} className="s1-dropdown__label">
      {children}
    </div>
  );
}

/** A line between groups. */
export function DropdownSeparator() {
  return <div role="separator" className="s1-dropdown__sep" />;
}

/* ------------------------------------------------------------------ submenus */

interface Sub {
  id: string;
  open: boolean;
  /** Open (focus on its first item, or left where it is) or close (focus back on its trigger, or left). */
  set: (open: boolean, focus?: boolean) => void;
  /** Its trigger, found by its id. */
  trigger: () => HTMLElement | null;
  /** Whether focus goes to the first item as it opens (the keyboard), or stays on the trigger (the pointer). */
  first: () => boolean;
}

const SubContext = createContext<Sub | null>(null);

function useSub(part: string): Sub {
  const sub = useContext(SubContext);
  if (!sub) throw new Error(`${part} must be inside a DropdownSub`);
  return sub;
}

/** A submenu: its trigger (an item of the menu) and its list, which opens beside it. */
export function DropdownSub({ children }: { children?: ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const focusFirst = useRef(false);
  const trigger = useCallback(
    () => [...document.querySelectorAll<HTMLElement>('[aria-haspopup="menu"][aria-controls]')].find((el) => el.getAttribute("aria-controls") === `${id}-menu`) ?? null,
    [id],
  );
  const first = useCallback(() => focusFirst.current, []);
  const set = useCallback(
    (next: boolean, focus = false) => {
      if (next) focusFirst.current = focus;
      else if (focus) trigger()?.focus({ preventScroll: true });
      setOpen(next);
    },
    [trigger],
  );
  // closed when focus moves to another item of the menu its trigger is in
  useEffect(() => {
    const t = trigger();
    const parent = t?.closest<HTMLElement>('[role="menu"]');
    if (!open || !t || !parent) return;
    const moved = (e: FocusEvent) => {
      const to = e.target as HTMLElement;
      if (to !== t && to.closest('[role="menu"]') === parent) set(false);
    };
    parent.addEventListener("focusin", moved);
    return () => parent.removeEventListener("focusin", moved);
  }, [open, set, trigger]);
  const sub = useMemo(() => ({ id, open, set, trigger, first }), [id, open, set, trigger, first]);
  return <SubContext.Provider value={sub}>{children}</SubContext.Provider>;
}

/** The item that opens a submenu: → , Enter, Space or the pointer resting on it; a caret at its end. */
export function DropdownSubTrigger({ children, icon }: { children?: ReactNode; icon?: ReactNode }) {
  const sub = useSub("DropdownSubTrigger");
  return (
    <button
      type="button"
      id={`${sub.id}-trigger`}
      role="menuitem"
      aria-haspopup="menu"
      aria-expanded={sub.open}
      aria-controls={`${sub.id}-menu`}
      tabIndex={-1}
      className="s1-dropdown__item s1-dropdown__item--sub"
      onPointerMove={follow}
      onPointerEnter={() => sub.set(true)}
      onClick={(e) => sub.set(true, e.detail === 0)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight") return;
        e.preventDefault();
        e.stopPropagation();
        sub.set(true, true);
      }}
    >
      {icon != null && icon !== false && (
        <span className="s1-dropdown__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
      <span className="s1-dropdown__caret" aria-hidden="true">
        {CARET}
      </span>
    </button>
  );
}

/** A submenu's list, beside its trigger (to its left when there is no room on the right); ← or Esc closes it. */
export function DropdownSubList({ children, className }: { children?: ReactNode; className?: string }) {
  const sub = useSub("DropdownSubList");
  const list = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const { open, trigger, first } = sub;

  useLayoutEffect(() => {
    const m = list.current;
    if (!m || !open) return;
    if (canPop(m) && !m.matches(":popover-open")) m.showPopover();
    const again = () => place(m, trigger()?.getBoundingClientRect(), "beside", "start");
    again();
    if (first()) entries(m)[0]?.focus({ preventScroll: true });
    window.addEventListener("resize", again);
    window.addEventListener("scroll", again, true);
    return () => {
      window.removeEventListener("resize", again);
      window.removeEventListener("scroll", again, true);
      if (canPop(m) && m.matches(":popover-open")) m.hidePopover();
    };
  }, [open, trigger, first]);

  return (
    <div
      ref={list}
      id={`${sub.id}-menu`}
      role="menu"
      aria-labelledby={`${sub.id}-trigger`}
      tabIndex={-1}
      className={cn("s1-dropdown", "s1-dropdown--sub", className)}
      popover="manual"
      hidden={!open}
      onKeyDown={(e) => {
        const m = list.current;
        if (!m || (e.target as HTMLElement).closest('[role="menu"]') !== m || e.key === "Tab") return;
        if (e.key === "ArrowLeft" || e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          sub.set(false, true);
          return;
        }
        if (roam(e, m, typed.current)) e.stopPropagation();
      }}
    >
      {open && children}
    </div>
  );
}
