"use client";

import { useEffect, useId, useRef, useState, type HTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { cn } from "./cn";
import { Glyph, type Status } from "./glyph";
import { VisuallyHidden } from "./visually-hidden";
import "./tokens.css";
import "./side-nav.css";

/** A place to go: a page, a part of one, a chat. */
export interface SideNavItem {
  /** What `current` names; unique in the nav. */
  id: string;
  label: ReactNode;
  /** The label in plain words, where it is not a string: for the phone's bar, and the rail's tooltip and name. */
  text?: string;
  href?: string;
  /** Called when it is chosen; without `href` the item is a button. */
  onSelect?: (item: SideNavItem) => void;
  /** A picture before the label, 16px, hidden from screen readers. */
  icon?: ReactNode;
  /** After the label, in mono: a time (2m), a count, a Badge. */
  meta?: ReactNode;
  /** A status mark after the label, a shape in the ink (or the status hue): running, failed, new. */
  status?: Status;
  /** What the mark means, for screen readers: "running". */
  statusLabel?: string;
  /** Items under this one, on a rail of their own. */
  items?: SideNavItem[];
  disabled?: boolean;
  lang?: string;
}

/** A section of the tree: a chapter, numbered; a family under it, with a count; or an app's list, with an action. */
export interface SideNavSection {
  id: string;
  /** Its name; with none, its items stand without a head. */
  title?: ReactNode;
  /** The title in plain words, where it is not a string. */
  text?: string;
  /** Before the title, in the third ink: "01". A numbered section is set as a chapter and its contents are indented. */
  number?: ReactNode;
  /** At the end of the head, in the third ink: how many there are. */
  count?: ReactNode;
  /** At the end of the head, outside its link: a Button ("+" to add a project), a link ("All"). */
  action?: ReactNode;
  /** The head as a link. */
  href?: string;
  onSelect?: (section: SideNavSection) => void;
  /** The head opens and closes the section; see `expanded` on SideNav. Its head is then a button, not a link. */
  collapsible?: boolean;
  /** Open at first, when SideNav is given no `defaultExpanded`. */
  defaultOpen?: boolean;
  /** Sections under it: families under a chapter, folders under a list. */
  sections?: SideNavSection[];
  items?: SideNavItem[];
  lang?: string;
}

/** What `renderLink` is handed: spread it on your router's link, with `href` as its destination. */
export interface SideNavLinkProps {
  href: string;
  className: string;
  children: ReactNode;
  "aria-current"?: "page" | "location" | "step" | "true";
  "aria-disabled"?: true;
  title?: string;
  lang?: string;
  onClick: (event: MouseEvent<HTMLElement>) => void;
}

export type SideNavProps = Omit<HTMLAttributes<HTMLElement>, "title" | "children" | "onSelect"> & {
  /** The landmark's name: "Library", "Main", "Account". */
  label: string;
  /** The line over the tree, in small capitals over a rule: "Index". Any node. */
  title?: ReactNode;
  /** At the end of the title's line: Buttons (a new chat, fold the sidebar). */
  titleAction?: ReactNode;
  sections: SideNavSection[];
  /** The id of the item (or section) you are at. */
  current?: string | null;
  /** What `aria-current` says on it: "page" for routes, "location" for places on one page. Sections round it say "true". */
  currentType?: "page" | "location" | "step" | "true";
  /** Your router's link, for every item and head with an `href`; a plain <a> without it. */
  renderLink?: (link: SideNavLinkProps) => ReactNode;
  /** Called on every choice, after the item's own onSelect. The phone's sheet closes by itself. */
  onNavigate?: (target: SideNavItem | SideNavSection) => void;
  /** The ids of the collapsible sections that are open, when the app keeps them (in storage, in a route). */
  expanded?: string[];
  /** The ones open at first, when it does not. */
  defaultExpanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  /** Icons only, the labels as tooltips: a folded sidebar. */
  rail?: boolean;
  /** Up to this width (px) the tree waits behind one bar that says where you are and opens it as a sheet; `true` always, `false` never. */
  sheet?: boolean | 640 | 768 | 900 | 1023;
  /** The bar's place; the current section and item by default ("Editorial · Button"). */
  here?: ReactNode;
  /** The bar's label; the title by default. */
  barLabel?: ReactNode;
  /** Keep the current item in view when the tree scrolls inside its own box (the panel, or the tree itself). */
  followCurrent?: boolean;
  /** Under the tree: the account, a footnote. Where the tree scrolls by itself it stays put under it. */
  footer?: ReactNode;
};

type Step = { section: SideNavSection; item?: undefined } | { item: SideNavItem; section?: undefined };
const plain = (node: ReactNode, text?: string) => text ?? (typeof node === "string" ? node : undefined);
const wordsOf = (s: Step) => (s.section ? plain(s.section.title, s.section.text) : plain(s.item.label, s.item.text));

/** The sections and items from the top down to the one with this id, or [] where there is none. */
function pathTo(sections: SideNavSection[], items: SideNavItem[], id: string | null | undefined): Step[] {
  if (!id) return [];
  for (const section of sections) {
    if (section.id === id) return [{ section }];
    const below = pathTo(section.sections ?? [], section.items ?? [], id);
    if (below.length) return [{ section }, ...below];
  }
  for (const item of items) {
    if (item.id === id) return [{ item }];
    const below = pathTo([], item.items ?? [], id);
    if (below.length) return [{ item }, ...below];
  }
  return [];
}

/** Every collapsible section, and whether it starts open. */
function collapsibles(sections: SideNavSection[]): [string, boolean][] {
  return sections.flatMap((s) => [...(s.collapsible ? [[s.id, s.defaultOpen ?? true] as [string, boolean]] : []), ...collapsibles(s.sections ?? [])]);
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The house's side navigation: the index of these docs, and an app's sidebar.
 * A title over a rule; sections, numbered as chapters or with a count or an
 * action; items on a hairline rail, the current one in the ink with a 2px bar,
 * with an icon, a time or a count, a status mark; nested items, collapsible
 * sections; links through your router or buttons. Folded to a rail of icons,
 * or, on a phone, one bar that says where you are and opens the tree as a
 * sheet (Esc, a choice or a tap outside closes it; Tab stays inside it).
 */
export function SideNav({
  label,
  title,
  titleAction,
  sections,
  current,
  currentType = "page",
  renderLink,
  onNavigate,
  expanded,
  defaultExpanded,
  onExpandedChange,
  rail = false,
  sheet = false,
  here,
  barLabel,
  followCurrent = true,
  footer,
  className,
  ...rest
}: SideNavProps) {
  const auto = useId();
  const panelId = `${auto}-panel`;
  const [open, setOpen] = useState(false);
  const [own, setOwn] = useState<string[]>(() => defaultExpanded ?? collapsibles(sections).filter(([, o]) => o).map(([id]) => id));
  const shown = expanded ?? own;
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const tree = useRef<HTMLOListElement>(null);

  const path = pathTo(sections, [], current);
  const at = new Set(path.map((s) => (s.section ?? s.item).id));
  // where you are, for the phone's bar: a section by itself; an item after the section it is in
  const last = path[path.length - 1];
  const holder = last?.item ? [...path].reverse().find((s) => s.section) : undefined;
  const place = here ?? [holder && wordsOf(holder), last && wordsOf(last)].filter(Boolean).join(" · ");

  const toggle = (id: string) => {
    const next = shown.includes(id) ? shown.filter((x) => x !== id) : [...shown, id];
    if (expanded === undefined) setOwn(next);
    onExpandedChange?.(next);
  };
  const chooseItem = (item: SideNavItem) => {
    item.onSelect?.(item);
    onNavigate?.(item);
    setOpen(false);
  };
  const chooseSection = (section: SideNavSection) => {
    section.onSelect?.(section);
    onNavigate?.(section);
    setOpen(false);
  };

  // The sheet: focus goes in, Tab stays among the bar and the sheet, Esc closes and gives focus back to the bar.
  useEffect(() => {
    if (!open) return;
    const box = panel.current;
    const sheetShown = () => bar.current !== null && bar.current.offsetParent !== null;
    if (box && sheetShown()) {
      const target = box.querySelector<HTMLElement>('[aria-current]:not([aria-current="true"])') ?? box.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus({ preventScroll: false });
    }
    const onKey = (e: KeyboardEvent) => {
      if (!sheetShown()) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        bar.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !box) return;
      const all = [bar.current!, ...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      const first = all[0];
      const last = all[all.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const host = root.current;
    host?.addEventListener("keydown", onKey);
    return () => host?.removeEventListener("keydown", onKey);
  }, [open]);

  // Keep the current item in view inside a tree that scrolls in its own box, by scrolling that box alone: the panel, or
  // the tree where an app's sidebar holds its footer still under a tree that scrolls by itself (a sticky footer in a
  // scrolling panel shifted by a fraction of a pixel with each scroll: TokensBeat console and admin, 2026-11-06).
  useEffect(() => {
    const box = [tree.current, panel.current].find((el) => el !== null && el.scrollHeight > el.clientHeight + 1);
    if (!followCurrent || !box) return;
    const marks = box.querySelectorAll<HTMLElement>("[aria-current]");
    const link = box.querySelector<HTMLElement>('[aria-current]:not([aria-current="true"])') ?? marks[marks.length - 1];
    if (!link) return;
    const top = link.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    if (top < box.scrollTop + 48 || top > box.scrollTop + box.clientHeight - 48) box.scrollTo({ top: top - box.clientHeight / 3 });
  }, [current, followCurrent]);

  const link = (props: SideNavLinkProps) => (renderLink ? renderLink(props) : <a {...props} />);
  const mark = (id: string) => (id === current ? currentType : at.has(id) ? "true" : undefined);

  // plain functions, not components, so a choice re-renders the tree in place and focus stays where it is
  const renderItem = (item: SideNavItem): ReactNode => {
    const name = plain(item.label, item.text);
    const cls = cn("s1-sidenav__item", item.icon != null && "s1-sidenav__item--icon", item.disabled && "s1-sidenav__item--disabled");
    const body = (
      <>
        {item.icon != null ? (
          <span className="s1-sidenav__icon" aria-hidden="true">
            {item.icon}
          </span>
        ) : (
          rail && (
            <span className="s1-sidenav__monogram" aria-hidden="true">
              {(name ?? "·").slice(0, 1)}
            </span>
          )
        )}
        <span className="s1-sidenav__label">{item.label}</span>
        {item.status && (
          <span className="s1-sidenav__status">
            <Glyph status={item.status} />
            {item.statusLabel && <VisuallyHidden>, {item.statusLabel}</VisuallyHidden>}
          </span>
        )}
        {item.meta != null && <span className="s1-sidenav__meta">{item.meta}</span>}
      </>
    );
    const common = { className: cls, title: rail ? name : undefined, lang: item.lang };
    let el: ReactNode;
    if (item.disabled)
      el = (
        <span {...common} aria-disabled="true">
          {body}
        </span>
      );
    else if (item.href !== undefined)
      el = link({ ...common, href: item.href, "aria-current": mark(item.id), onClick: () => chooseItem(item), children: body });
    else
      el = (
        <button type="button" {...common} aria-current={mark(item.id)} onClick={() => chooseItem(item)}>
          {body}
        </button>
      );
    return (
      <li key={item.id} className="s1-sidenav__entry">
        {el}
        {item.items && item.items.length > 0 && !rail && <ul className="s1-sidenav__items s1-sidenav__items--nested">{item.items.map(renderItem)}</ul>}
      </li>
    );
  };

  const renderSection = (section: SideNavSection, depth: number): ReactNode => {
    const isOpen = !section.collapsible || shown.includes(section.id);
    const bodyId = `${auto}-${section.id}`;
    const kids = (section.sections?.length ?? 0) + (section.items?.length ?? 0);
    const numbered = section.number != null;
    const inner = (
      <>
        {numbered && <span className="s1-sidenav__no">{section.number}</span>}
        <span className="s1-sidenav__name">{section.title}</span>
        {section.count != null && <span className="s1-sidenav__count">{section.count}</span>}
        {section.collapsible && <span className="s1-sidenav__sign" aria-hidden="true" />}
      </>
    );
    const cls = "s1-sidenav__heading";
    let heading: ReactNode = null;
    if (section.title != null) {
      if (section.collapsible)
        heading = (
          <button type="button" className={cls} aria-expanded={isOpen} aria-controls={bodyId} aria-current={mark(section.id)} onClick={() => toggle(section.id)}>
            {inner}
          </button>
        );
      else if (section.href !== undefined) heading = link({ className: cls, href: section.href, "aria-current": mark(section.id), onClick: () => chooseSection(section), children: inner });
      else if (section.onSelect)
        heading = (
          <button type="button" className={cls} aria-current={mark(section.id)} onClick={() => chooseSection(section)}>
            {inner}
          </button>
        );
      else
        heading = (
          <span className={cls} aria-current={mark(section.id)}>
            {inner}
          </span>
        );
    }
    return (
      <li
        key={section.id}
        className={cn("s1-sidenav__section", depth === 1 ? "s1-sidenav__section--top" : "s1-sidenav__section--sub", numbered && "s1-sidenav__section--numbered", kids === 0 && "s1-sidenav__section--leaf")}
        data-current={at.has(section.id) ? "" : undefined}
        lang={section.lang}
      >
        {(heading || section.action) && (
          <div className="s1-sidenav__head">
            {heading}
            {section.action && <span className="s1-sidenav__action">{section.action}</span>}
          </div>
        )}
        {kids > 0 && (
          // the rail draws no heads, so a folded section could not be opened there: its items are always shown
          <div className="s1-sidenav__body" id={bodyId} hidden={!rail && !isOpen}>
            {section.sections && section.sections.length > 0 && <ol className="s1-sidenav__sections">{section.sections.map((s) => renderSection(s, depth + 1))}</ol>}
            {section.items && section.items.length > 0 && <ul className="s1-sidenav__items">{section.items.map(renderItem)}</ul>}
          </div>
        )}
      </li>
    );
  };

  const sheetClass = sheet === true ? "s1-sidenav--sheet-always" : sheet ? `s1-sidenav--sheet-${sheet}` : undefined;
  return (
    <nav ref={root} className={cn("s1-sidenav", rail && "s1-sidenav--rail", sheetClass, className)} aria-label={label} data-open={open ? "" : undefined} {...rest}>
      {sheet !== false && (
        <button ref={bar} type="button" className="s1-sidenav__bar" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
          {(barLabel ?? title) != null && <span className="s1-sidenav__bar-label">{barLabel ?? title}</span>}
          <span className="s1-sidenav__here">{place}</span>
          <span className="s1-sidenav__sign" aria-hidden="true" />
        </button>
      )}
      {sheet !== false && open && <div className="s1-sidenav__scrim" aria-hidden="true" onClick={() => setOpen(false)} />}
      <div className="s1-sidenav__panel" id={panelId} ref={panel}>
        {(title != null || titleAction != null) && (
          <div className="s1-sidenav__title">
            {title != null && <span className="s1-sidenav__title-text">{title}</span>}
            {titleAction != null && <span className="s1-sidenav__title-action">{titleAction}</span>}
          </div>
        )}
        <ol className="s1-sidenav__tree" ref={tree}>
          {sections.map((s) => renderSection(s, 1))}
        </ol>
        {footer != null && <div className="s1-sidenav__foot">{footer}</div>}
      </div>
    </nav>
  );
}
