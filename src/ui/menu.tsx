import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "./button";
import { cn } from "./cn";
import { Glyph } from "./glyph";
import "./tokens.css";
import "./menu.css";

export type MenuItem =
  | {
      label: ReactNode;
      /** Called when the item is chosen, after the menu has closed and focus is back on its button. */
      onSelect?: () => void;
      /** Makes the item a link. */
      href?: string;
      disabled?: boolean;
      /** Something that cannot be undone: a cross before it, and heavier type. */
      danger?: boolean;
      /** Words at the right: a shortcut, a count. */
      hint?: ReactNode;
      /** For typing a letter to jump to it, when the label is not a string. */
      text?: string;
    }
  | "separator";

type Props = {
  /** The actions, in order; "separator" draws a line between groups. */
  items: MenuItem[];
  /** What the button shows. Leave it out with variant "icon" for three dots. */
  children?: ReactNode;
  /** The button's name, needed when it shows no words: "Actions for prod-key". */
  label?: string;
  /** Which edge of the button the menu lines up with. */
  align?: "start" | "end";
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const canPop = (el: HTMLElement) => typeof el.showPopover === "function";

/**
 * A button that opens a short list of actions: the menu button of the ARIA
 * practices. Enter, Space or ↓ opens it on the first item, ↑ on the last;
 * the arrows, Home and End move, a letter jumps, Enter chooses, Esc closes
 * and gives focus back to the button, and Tab closes and moves on. The list
 * sits in the top layer (the Popover API), so no frame or table clips it; it
 * opens below the button, or above it when there is no room. All of it is
 * phrasing content, so it may stand in a paragraph or a table cell.
 */
export function Menu({ items, children, label, align = "start", variant = "plain", size = "md", className }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLSpanElement>(null);
  const start = useRef<"first" | "last">("first");

  const enabled = () => [...(list.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [])];

  function show(where: "first" | "last") {
    start.current = where;
    setOpen(true);
  }
  function hide(refocus: boolean) {
    setOpen(false);
    if (refocus) button.current?.focus();
  }

  useLayoutEffect(() => {
    const m = list.current;
    if (!m) return;
    if (!open) {
      if (canPop(m) && m.matches(":popover-open")) m.hidePopover();
      return;
    }
    // Against the button, inside the screen; above it when there is no room below.
    const place = () => {
      const b = button.current?.getBoundingClientRect();
      if (!b) return;
      m.style.minWidth = `${Math.round(b.width)}px`;
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const w = m.offsetWidth;
      const h = m.offsetHeight;
      const left = Math.max(8, Math.min(align === "end" ? b.right - w : b.left, vw - w - 8));
      const below = b.bottom + 4;
      const top = below + h > vh - 8 && b.top - 4 - h >= 8 ? b.top - 4 - h : below;
      m.style.left = `${Math.round(left)}px`;
      m.style.top = `${Math.round(top)}px`;
    };
    if (canPop(m) && !m.matches(":popover-open")) m.showPopover();
    place();
    const all = [...m.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')];
    (start.current === "last" ? all[all.length - 1] : all[0])?.focus();
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!m.contains(t) && !button.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, align]);

  // Typed letters, for jumping to an item by its first ones.
  const typed = useRef({ text: "", at: 0 });

  function onListKey(e: KeyboardEvent<HTMLSpanElement>) {
    const all = enabled();
    const i = all.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => all[(n + all.length) % all.length]?.focus();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        go(i + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        go(i - 1);
        break;
      case "Home":
      case "PageUp":
        e.preventDefault();
        go(0);
        break;
      case "End":
      case "PageDown":
        e.preventDefault();
        go(all.length - 1);
        break;
      case "Escape":
        // kept from a dialog around the menu: Esc closes the menu, not the dialog
        e.preventDefault();
        e.stopPropagation();
        hide(true);
        break;
      case "Tab":
        // from the button, so Tab moves on from the menu's place in the page
        button.current?.focus();
        hide(false);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key !== " ") {
          const now = e.timeStamp;
          const t = typed.current;
          t.text = now - t.at < 700 ? t.text + e.key.toLowerCase() : e.key.toLowerCase();
          t.at = now;
          const order = [...all.slice(i + 1), ...all.slice(0, i + 1)];
          const pool = t.text.length > 1 ? [all[i], ...order] : order;
          pool.find((el) => el && (el.dataset.text ?? el.textContent ?? "").trim().toLowerCase().startsWith(t.text))?.focus();
        }
    }
  }

  function choose(item: Exclude<MenuItem, "separator">) {
    if (item.disabled) return;
    hide(true);
    item.onSelect?.();
  }

  return (
    <span className={cn("s1-menu", className)}>
      <Button
        ref={button}
        id={`${id}-button`}
        variant={variant}
        size={size}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        onClick={() => (open ? hide(false) : show("first"))}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show(e.key === "ArrowUp" ? "last" : "first");
          }
        }}
      >
        {children ?? (
          <svg className="s1-menu__dots" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="3" cy="8" r="1.4" />
            <circle cx="8" cy="8" r="1.4" />
            <circle cx="13" cy="8" r="1.4" />
          </svg>
        )}
      </Button>
      <span
        ref={list}
        id={`${id}-menu`}
        className="s1-menu__list"
        role="menu"
        aria-labelledby={`${id}-button`}
        popover="manual"
        hidden={!open}
        onKeyDown={onListKey}
      >
        {items.map((item, i) => {
          if (item === "separator") return <span key={i} role="separator" className="s1-menu__sep" />;
          const body = (
            <>
              <span className="s1-menu__label">
                {item.danger && <Glyph status="bad" />}
                {item.label}
              </span>
              {item.hint && <span className="s1-menu__hint">{item.hint}</span>}
            </>
          );
          const common = {
            role: "menuitem",
            tabIndex: -1,
            className: cn("s1-menu__item", item.danger && "s1-menu__item--danger"),
            "aria-disabled": item.disabled || undefined,
            "data-text": item.text,
            onPointerMove: (e: { currentTarget: HTMLElement }) => {
              if (document.activeElement !== e.currentTarget) e.currentTarget.focus();
            },
          };
          return item.href && !item.disabled ? (
            <a key={i} {...common} href={item.href} onClick={() => choose(item)}>
              {body}
            </a>
          ) : (
            <button key={i} type="button" {...common} onClick={() => choose(item)}>
              {body}
            </button>
          );
        })}
      </span>
    </span>
  );
}
