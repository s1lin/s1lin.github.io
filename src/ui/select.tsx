"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEventHandler,
  type KeyboardEvent,
  type OptionHTMLAttributes,
  type OptgroupHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
} from "react";
import { anchorPanel } from "./anchor";
import { cn } from "./cn";
import { useField } from "./field";
import { useS1Words } from "./words";
import "./tokens.css";
import "./select.css";

/** One choice in a Select. */
export interface SelectOption {
  /** What the form sends, and what `onChange` and `onValueChange` read. */
  value: string;
  /** What the option shows, and the box once it is chosen. */
  label: ReactNode;
  /** The option in plain words, when `label` is not a string: what type-ahead and the filter read. */
  text?: string;
  /** A second line under the label, in the second ink. */
  description?: ReactNode;
  /** Quiet tags at the end of its line, in small mono, a dot between them: ["Pro", "Qwen", "Official"]. */
  meta?: ReactNode | ReactNode[];
  /** Heard, and reached by the arrows, but never chosen. */
  disabled?: boolean;
}

/** Options under one heading; a group with no label is shown without one. */
export interface SelectGroup {
  label?: ReactNode;
  options: SelectOption[];
  /** Every option in it is disabled. */
  disabled?: boolean;
}

export type SelectProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value" | "defaultValue" | "onChange" | "children" | "type" | "name" | "form" | "formAction" | "formEncType" | "formMethod" | "formNoValidate" | "formTarget"> & {
  /** The options as data, for rows with a second line or tags: options, or groups of them. Without it, the `<option>` and `<optgroup>` children are read. */
  options?: (SelectOption | SelectGroup)[];
  /** `<option>` and `<optgroup>` elements, as a native select takes them. */
  children?: ReactNode;
  /** The chosen option's value, when the app keeps it. */
  value?: string | number;
  /** The option chosen at first, when the Select keeps its own state. */
  defaultValue?: string | number;
  /** Called after a choice, as a native select's: `e.target` is the select the form reads, `e.target.value` the value. */
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  /** Called after a choice with the value alone. */
  onValueChange?: (value: string) => void;
  /** Shown in the box until an option is chosen: "Choose a model". */
  placeholder?: string;
  /** The name the form sends the value under. */
  name?: string;
  /** The id of a form it belongs to, when it is not inside it. */
  form?: string;
  /** A form will not submit until an option is chosen. */
  required?: boolean;
  autoComplete?: SelectHTMLAttributes<HTMLSelectElement>["autoComplete"];
  /** "md" is 40px tall, "sm" 30px, as Input. */
  size?: "md" | "sm";
  /** In error without a Field around it. */
  invalid?: boolean;
  /** A box at the head of the list that narrows it as you type: from this many options on (8), always (true) or never (false). */
  filter?: boolean | number;
  /** The filter box's name and placeholder; "Filter" from S1Words. */
  filterLabel?: string;
  /** Said in the list when nothing matches the filter; "Nothing matches" from S1Words. */
  empty?: ReactNode;
  /** Added to the list's panel. */
  listClassName?: string;
  /** The button that opens the list: it takes focus, as the select did. */
  ref?: Ref<HTMLButtonElement>;
};

/* ------------------------------------------------------------------ the options, from data or from children */

interface Row {
  value: string;
  label: ReactNode;
  text: string;
  description?: ReactNode;
  meta: ReactNode[];
  disabled: boolean;
  title?: string;
  /** Everything the filter reads, in lower case: its words, its second line, its tags and its group's heading. */
  find: string;
}

interface Section {
  label?: ReactNode;
  rows: Row[];
}

/** The words in a node: its strings and numbers, in order. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

const listOf = (meta: ReactNode | ReactNode[] | undefined): ReactNode[] => (meta == null || meta === false ? [] : Array.isArray(meta) ? meta : [meta]);

function row(o: SelectOption, heading: string, off = false): Row {
  const text = (o.text ?? textOf(o.label)).trim();
  const meta = listOf(o.meta);
  return {
    value: String(o.value),
    label: o.label,
    text,
    description: o.description,
    meta,
    disabled: off || Boolean(o.disabled),
    find: [text, textOf(o.description), meta.map(textOf).join(" "), heading].join(" ").toLocaleLowerCase(),
  };
}

function fromOptions(list: (SelectOption | SelectGroup)[]): Section[] {
  const sections: Section[] = [];
  let loose: Section | null = null;
  for (const item of list) {
    if ("options" in item) {
      sections.push({ label: item.label, rows: item.options.map((o) => row(o, textOf(item.label), item.disabled)) });
      loose = null;
    } else {
      if (!loose) sections.push((loose = { rows: [] }));
      loose.rows.push(row(item, ""));
    }
  }
  return sections;
}

type OptionProps = OptionHTMLAttributes<HTMLOptionElement> & { children?: ReactNode };

/** `<option>` and `<optgroup>` children, through fragments and arrays, read as a native select reads them. */
function fromChildren(children: ReactNode): Section[] {
  const sections: Section[] = [];
  let loose: Section | null = null;
  const option = (p: OptionProps, heading: string, off: boolean): Row => {
    const words = textOf(p.children).trim();
    const shown = typeof p.label === "string" ? p.label : undefined;
    const r = row({ value: p.value === undefined ? words : String(p.value), label: shown ?? p.children, text: shown ?? words, disabled: off || p.disabled }, heading);
    return { ...r, title: p.title };
  };
  const walk = (nodes: ReactNode, into: (r: Row) => void, group: { heading: string; off: boolean } | null) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      const p = child.props as OptionProps & OptgroupHTMLAttributes<HTMLOptGroupElement>;
      if (child.type === Fragment) walk(p.children, into, group);
      else if (child.type === "option") into(option(p, group?.heading ?? "", group?.off ?? false));
      else if (child.type === "optgroup" && !group) {
        const s: Section = { label: p.label, rows: [] };
        sections.push(s);
        loose = null;
        walk(p.children, (r) => s.rows.push(r), { heading: p.label ?? "", off: Boolean(p.disabled) });
      }
    });
  };
  walk(
    children,
    (r) => {
      if (!loose) sections.push((loose = { rows: [] }));
      loose.rows.push(r);
    },
    null,
  );
  return sections;
}

/* ------------------------------------------------------------------ marks */

const TICK = (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);
const CHEVRON = (
  <svg className="s1-select__chevron" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 6l4.5 4.5L12.5 6" />
  </svg>
);
const GLASS = (
  <svg className="s1-select__glass" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="7" cy="7" r="4.25" />
    <path d="M10.2 10.2L13.5 13.5" />
  </svg>
);

/** An option's words and tags as the box shows them; text only when it measures the box. */
function Shown({ r, plain }: { r: Row; plain?: boolean }) {
  return (
    <span className="s1-select__shown">
      <span className="s1-select__name">{plain ? r.text : r.label}</span>
      {r.meta.length > 0 && (
        <span className="s1-select__meta">
          {r.meta.map((m, i) => (
            <span key={i} className="s1-select__tag">
              {plain ? textOf(m) : m}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

/**
 * The option under the arrows in sight in its list, clear of its group's heading: left where it is when it is in
 * sight, else in the middle as the list opens, then only as far as it must go.
 */
function reveal(list: HTMLElement, option: HTMLElement, middle: boolean) {
  const head = option.closest(".s1-select__group")?.querySelector<HTMLElement>(":scope > .s1-select__label")?.offsetHeight ?? 0;
  const top = option.offsetTop;
  const bottom = top + option.offsetHeight;
  if (top - head >= list.scrollTop && bottom <= list.scrollTop + list.clientHeight) return;
  if (middle) list.scrollTop = top - (list.clientHeight - option.offsetHeight) / 2;
  else if (top - head < list.scrollTop) list.scrollTop = top - head;
  else list.scrollTop = bottom - list.clientHeight;
}

const coarse = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
const matches = (r: Row, terms: string[]) => terms.every((t) => r.find.includes(t));
const termsOf = (query: string) => query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

/**
 * A choice from a list, drawn by the kit from end to end: the box is Input's,
 * with the chosen option's words and a chevron; the list opens in the top
 * layer under it (or above it), in groups under small capitals, an option
 * with a second line or quiet tags, the chosen one ticked, and a box at its
 * head that narrows it once it is long. The select-only combobox of the ARIA
 * practices: focus stays on the box (or in the filter), the option under the
 * arrows is its active descendant. A hidden native select carries the name,
 * the value and `required` into the form, and `onChange` is that select's.
 * Options are `<option>` and `<optgroup>` children, or `options` as data.
 */
export function Select({
  options,
  children,
  value,
  defaultValue,
  onChange,
  onValueChange,
  placeholder,
  name,
  form,
  required,
  autoComplete,
  size = "md",
  invalid,
  filter = 8,
  filterLabel,
  empty,
  className,
  listClassName,
  id,
  disabled,
  ref,
  onClick,
  onKeyDown,
  onKeyUp,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  ...rest
}: SelectProps) {
  const w = useS1Words();
  const auto = useId();
  const field = useField({ id, required, disabled, invalid, "aria-describedby": rest["aria-describedby"], "aria-invalid": rest["aria-invalid"] });
  const triggerId = field.id ?? `${auto}-trigger`;
  const listId = `${auto}-list`;
  const optionId = (i: number) => `${auto}-option-${i}`;

  const sections = options ? fromOptions(options) : fromChildren(children);
  const rows = sections.flatMap((s) => s.rows);

  // the chosen value: the app's, or its own, which starts as a native select's does (the first option that can be
  // chosen) unless a default or a placeholder is given
  const controlled = value != null;
  const [own, setOwn] = useState(() => (defaultValue != null ? String(defaultValue) : placeholder !== undefined ? "" : (rows.find((r) => !r.disabled)?.value ?? "")));
  const initial = useRef(own);
  const current = controlled ? String(value) : own;
  const chosen = rows.find((r) => r.value === current);
  const chosenAt = chosen ? rows.indexOf(chosen) : -1;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  // focus in the filter box (else on the button)
  const [inFilter, setInFilter] = useState(false);
  const filterable = filter === true || (typeof filter === "number" && rows.length >= filter);
  const terms = termsOf(query);
  const shownSections = sections.map((s) => (terms.length ? { ...s, rows: s.rows.filter((r) => matches(r, terms)) } : s)).filter((s) => s.rows.length > 0);
  const shown = shownSections.flatMap((s) => s.rows);
  const at = active >= 0 && active < shown.length ? active : -1;

  const box = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const native = useRef<HTMLSelectElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  // when Enter or Space last opened or chose, so the click a browser may make of the same key is not taken twice
  const keyAt = useRef(-Infinity);
  const typed = useRef({ text: "", at: -Infinity });
  const middle = useRef(false);
  const latest = useRef({ controlled, current });
  useEffect(() => {
    latest.current = { controlled, current };
  });

  const setTrigger = useCallback(
    (el: HTMLButtonElement | null) => {
      trigger.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  const firstOpen = (list: Row[]) => Math.max(0, list.findIndex((r) => !r.disabled));

  function show(where: "chosen" | "first" | "last" | number, typing = "") {
    if (field.disabled || rows.length === 0) return;
    const into = filterable && (typing !== "" || !coarse());
    const pool = typing ? rows.filter((r) => matches(r, termsOf(typing))) : rows;
    const i = typeof where === "number" ? where : typing ? firstOpen(pool) : where === "last" ? rows.length - 1 : where === "chosen" && chosenAt >= 0 ? chosenAt : where === "first" ? 0 : firstOpen(rows);
    setQuery(typing);
    setActive(pool.length ? i : -1);
    setInFilter(into);
    middle.current = true;
    setOpen(true);
  }
  function close(refocus: boolean) {
    if (refocus) trigger.current?.focus({ preventScroll: true });
    setOpen(false);
    setQuery("");
    setInFilter(false);
  }
  // A choice goes through the hidden select, as a person's would: its value set, a change event, and so onChange.
  function commit(v: string) {
    const el = native.current;
    if (!el) return;
    el.value = v;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function choose(r: Row | undefined) {
    if (!r || r.disabled) return;
    close(true);
    if (r.value !== current || !chosen) commit(r.value);
  }
  function move(by: number) {
    const n = shown.length;
    if (!n) return;
    setActive((was) => {
      const from = was < 0 || was >= n ? (by > 0 ? -1 : n) : was;
      return Math.max(0, Math.min(n - 1, from + by));
    });
  }
  // Letters typed on the button: the next option that starts with them, opening the list on it. One letter pressed
  // again goes round the options that start with it.
  function typeAhead(e: KeyboardEvent<HTMLElement>) {
    const t = typed.current;
    const ch = e.key.toLocaleLowerCase();
    t.text = e.timeStamp - t.at < 500 ? t.text + ch : ch;
    t.at = e.timeStamp;
    const from = open ? at : chosenAt;
    const same = [...t.text].every((c) => c === t.text[0]);
    const want = same ? t.text[0] : t.text;
    const all = [...rows.keys()];
    const order = [...all.slice(from + 1), ...all.slice(0, from + 1)];
    const pool = want.length > 1 && from >= 0 ? [from, ...order] : order;
    const hit = pool.find((i) => rows[i].text.toLocaleLowerCase().startsWith(want));
    if (hit === undefined) return;
    if (!open) show(hit);
    else setActive(hit);
  }

  function onTriggerKey(e: KeyboardEvent<HTMLElement>) {
    const k = e.key;
    const n = shown.length;
    switch (k) {
      case "Tab":
        if (open) close(false);
        return;
      case "Escape":
        // kept from a dialog around it while the list is open: Esc closes the list, not the dialog
        if (!open) return;
        e.preventDefault();
        e.stopPropagation();
        close(true);
        return;
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (!open) show(k === "ArrowUp" && chosenAt < 0 ? "last" : "chosen");
        else if (e.altKey && k === "ArrowUp") choose(shown[at]);
        else move(k === "ArrowDown" ? 1 : -1);
        return;
      case "Home":
      case "End":
        e.preventDefault();
        if (!open) show(k === "Home" ? "first" : "last");
        else setActive(k === "Home" ? 0 : n - 1);
        return;
      case "PageUp":
      case "PageDown":
        if (!open) return;
        e.preventDefault();
        move(k === "PageDown" ? 10 : -10);
        return;
      case "Enter":
      case " ":
        // a space while letters are being typed is one of them
        if (k === " " && !filterable && typed.current.text && e.timeStamp - typed.current.at < 500) {
          e.preventDefault();
          typeAhead(e);
          return;
        }
        e.preventDefault();
        keyAt.current = e.timeStamp;
        if (!open) show("chosen");
        else choose(shown[at]);
        return;
      default:
        if (k.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
        e.preventDefault();
        if (filterable) {
          // into the filter box, the letter with it
          if (!open) show("first", k);
          else {
            const next = query + k;
            setQuery(next);
            setActive(firstOpen(rows.filter((r) => matches(r, termsOf(next)))));
            setInFilter(true);
          }
        } else typeAhead(e);
    }
  }

  function onFilterKey(e: KeyboardEvent<HTMLInputElement>) {
    // a key that belongs to an IME (the Enter that commits 对话 typed in pinyin): never a choice. Safari sends that
    // Enter just after compositionend, as keyCode 229
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        if (e.altKey && e.key === "ArrowUp") choose(shown[at]);
        else move(e.key === "ArrowDown" ? 1 : -1);
        break;
      case "PageUp":
      case "PageDown":
        e.preventDefault();
        move(e.key === "PageDown" ? 10 : -10);
        break;
      case "Enter":
        // never the form's: Enter here chooses
        e.preventDefault();
        choose(shown[at]);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        close(true);
        break;
      case "Tab":
        // from the button, so Tab moves on from the Select's place in the page
        trigger.current?.focus({ preventScroll: true });
        close(false);
        break;
    }
  }

  // Open: in the top layer against the box and at least as wide, under it or above it, never taller than its room;
  // a press outside or focus gone elsewhere closes it.
  useLayoutEffect(() => {
    const p = panel.current;
    const b = box.current;
    if (!p || !b || !open) return;
    const stop = anchorPanel(p, () => box.current, { room: "--s1-select-room", matchWidth: true });
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      const labels = [...(trigger.current?.labels ?? [])];
      if (!p.contains(t) && !b.contains(t) && !labels.some((l) => l.contains(t))) close(false);
    };
    const away = (e: FocusEvent) => {
      const to = e.relatedTarget as Node | null;
      if (to && !p.contains(to) && !b.contains(to)) close(false);
    };
    document.addEventListener("pointerdown", outside, true);
    p.addEventListener("focusout", away);
    b.addEventListener("focusout", away);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      p.removeEventListener("focusout", away);
      b.removeEventListener("focusout", away);
      stop();
    };
  }, [open]);

  // into the filter box, the caret after what is in it
  useLayoutEffect(() => {
    const f = search.current;
    if (!open || !inFilter || !f || document.activeElement === f) return;
    f.focus({ preventScroll: true });
    f.setSelectionRange(f.value.length, f.value.length);
  }, [open, inFilter]);

  useLayoutEffect(() => {
    const l = list.current;
    const o = open && at >= 0 ? document.getElementById(`${auto}-option-${at}`) : null;
    if (!l || !o) return;
    reveal(l, o, middle.current);
    middle.current = false;
  }, [open, at, query, auto]);

  // The list is named as the box is: by its label, or by the name given.
  useEffect(() => {
    const l = list.current;
    const label = ariaLabel || labelledBy ? null : trigger.current?.labels?.[0];
    if (!l || !label) return;
    if (!label.id) label.setAttribute("id", `${auto}-label`);
    l.setAttribute("aria-labelledby", label.id);
  }, [ariaLabel, labelledBy, auto]);

  // A form's reset puts back the first choice; the browser then sets the hidden select to its own first option, so
  // it is set again to the choice shown.
  useEffect(() => {
    const f = native.current?.form;
    if (!f) return;
    const reset = () => {
      if (!latest.current.controlled) setOwn(initial.current);
      const back = latest.current.controlled ? latest.current.current : initial.current;
      setTimeout(() => {
        if (native.current) native.current.value = back;
      });
    };
    f.addEventListener("reset", reset);
    return () => f.removeEventListener("reset", reset);
  }, []);

  const isInvalid = field["aria-invalid"] !== undefined && field["aria-invalid"] !== false && field["aria-invalid"] !== "false";
  const blank = !rows.some((r) => r.value === "");
  const keep = (e: { target: EventTarget | null; preventDefault: () => void }) => {
    if (e.target !== search.current) e.preventDefault();
  };
  let n = 0;

  return (
    <>
      <span ref={box} className={cn("s1-select", `s1-select--${size}`, className)} data-invalid={isInvalid ? "" : undefined} data-disabled={field.disabled ? "" : undefined}>
        <button
          {...rest}
          ref={setTrigger}
          type="button"
          role="combobox"
          id={triggerId}
          className="s1-select__trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && !inFilter && at >= 0 ? optionId(at) : undefined}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          aria-describedby={field["aria-describedby"]}
          aria-invalid={field["aria-invalid"]}
          aria-required={field.required || undefined}
          disabled={field.disabled}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (!e.defaultPrevented) onTriggerKey(e);
          }}
          onKeyUp={(e) => {
            onKeyUp?.(e);
            if (e.key === " ") e.preventDefault();
          }}
          onClick={(e) => {
            onClick?.(e);
            if (e.defaultPrevented) return;
            if (e.detail === 0 && e.timeStamp - keyAt.current < 500) return;
            if (open) close(true);
            else show("chosen");
          }}
        >
          <span className="s1-select__value">
            {chosen ? <Shown r={chosen} /> : <span className="s1-select__placeholder">{placeholder}</span>}
            {/* every option's words, unseen, so a box sized by its content is as wide as the widest, as a native select */}
            <span className="s1-select__sizer" aria-hidden="true">
              {placeholder && <span className="s1-select__shown">{placeholder}</span>}
              {rows.map((r, i) => (
                <Shown key={i} r={r} plain />
              ))}
            </span>
          </span>
          {CHEVRON}
        </button>
        <select
          ref={native}
          className="s1-select__native"
          tabIndex={-1}
          aria-hidden="true"
          name={name}
          form={form}
          required={field.required}
          disabled={field.disabled}
          autoComplete={autoComplete}
          value={chosen ? chosen.value : ""}
          onChange={(e) => {
            if (!controlled) setOwn(e.target.value);
            onValueChange?.(e.target.value);
            onChange?.(e);
          }}
          // reached only when the browser points at it (a required select left empty): the keys go to the box
          onKeyDown={(e) => {
            if (e.key !== "Tab" && e.key !== "Escape") e.preventDefault();
            trigger.current?.focus({ preventScroll: true });
            onTriggerKey(e);
          }}
        >
          {blank && <option value="" />}
          {rows.map((r, i) => (
            <option key={i} value={r.value} disabled={r.disabled}>
              {r.text}
            </option>
          ))}
        </select>
      </span>
      <div ref={panel} className={cn("s1-select__panel", listClassName)} popover="manual" hidden={!open} onPointerDown={keep} onMouseDown={keep}>
        {open && filterable && (
          <div className="s1-select__search">
            {GLASS}
            <input
              ref={search}
              type="text"
              role="combobox"
              className="s1-select__filter"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={at >= 0 ? optionId(at) : undefined}
              aria-label={filterLabel ?? w.filter}
              placeholder={filterLabel ?? w.filter}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="done"
              value={query}
              onFocus={() => setInFilter(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(firstOpen(rows.filter((r) => matches(r, termsOf(e.target.value)))));
                middle.current = false;
                if (list.current) list.current.scrollTop = 0;
              }}
              onKeyDown={onFilterKey}
            />
            {terms.length > 0 && (
              <span className="s1-select__count" aria-hidden="true">
                {shown.length}/{rows.length}
              </span>
            )}
          </div>
        )}
        <div ref={list} id={listId} role="listbox" aria-label={labelledBy ? undefined : ariaLabel} aria-labelledby={labelledBy} tabIndex={-1} className="s1-select__list">
          {open &&
            shownSections.map((s, si) => {
              const options = s.rows.map((r) => {
                const i = n++;
                const on = r === chosen;
                return (
                  <div
                    key={i}
                    id={optionId(i)}
                    role="option"
                    aria-selected={on}
                    aria-disabled={r.disabled || undefined}
                    title={r.title}
                    className="s1-select__option"
                    data-active={i === at ? "" : undefined}
                    onPointerMove={() => {
                      if (i !== at) setActive(i);
                    }}
                    onClick={() => choose(r)}
                  >
                    <span className="s1-select__tick" aria-hidden="true">
                      {on && TICK}
                    </span>
                    <span className="s1-select__words">
                      <span className="s1-select__name">{r.label}</span>
                      {r.description != null && r.description !== false && <span className="s1-select__desc">{r.description}</span>}
                    </span>
                    {r.meta.length > 0 && (
                      <span className="s1-select__meta">
                        {r.meta.map((m, j) => (
                          <span key={j} className="s1-select__tag">
                            {m}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                );
              });
              if (s.label == null || s.label === false) {
                return (
                  <div key={si} role="none" className="s1-select__group">
                    {options}
                  </div>
                );
              }
              return (
                <div key={si} role="group" aria-labelledby={`${auto}-group-${si}`} className="s1-select__group">
                  <div id={`${auto}-group-${si}`} className="s1-select__label">
                    {s.label}
                  </div>
                  {options}
                </div>
              );
            })}
        </div>
        <div className="s1-select__empty" role="status">
          {open && shown.length === 0 ? (empty ?? w.noMatches) : null}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ the native one */

export type NativeSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  /** "md" is 40px tall, "sm" 30px, as Input. */
  size?: "md" | "sm";
  /** A first option with no value, shown until one is chosen: "Choose a model". */
  placeholder?: string;
  /** In error without a Field around it. */
  invalid?: boolean;
  ref?: Ref<HTMLSelectElement>;
};

/**
 * The browser's own select in the Input's box with a chevron: on a phone its
 * own picker, and `multiple`. Only the closed box is drawn; the open list is
 * the system's. Options are its children. In a Field it takes the label, hint
 * and error from it.
 */
export function NativeSelect({ size = "md", placeholder, invalid, className, id, required, disabled, children, ref, ...rest }: NativeSelectProps) {
  const field = useField({ id, required, disabled, invalid, "aria-describedby": rest["aria-describedby"], "aria-invalid": rest["aria-invalid"] });
  const blank = placeholder !== undefined && !rest.multiple;
  // With a placeholder and no value given, the placeholder is what shows first.
  const defaultValue = blank && rest.value === undefined && rest.defaultValue === undefined ? "" : rest.defaultValue;
  return (
    <span
      className={cn("s1-native-select", `s1-native-select--${size}`, rest.multiple && "s1-native-select--multiple", className)}
      data-invalid={field["aria-invalid"] !== undefined && field["aria-invalid"] !== false && field["aria-invalid"] !== "false" ? "" : undefined}
      data-disabled={field.disabled ? "" : undefined}
    >
      <select ref={ref} className="s1-native-select__control" {...rest} defaultValue={defaultValue} {...field}>
        {blank && (
          <option value="" disabled={field.required}>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    </span>
  );
}
