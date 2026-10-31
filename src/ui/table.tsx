"use client";

import { useId, useRef, useState, type CSSProperties, type HTMLAttributes, type Key, type MouseEvent, type ReactNode } from "react";
import { cn } from "./cn";
import { Skeleton } from "./skeleton";
import { useOverflow } from "./use-overflow";
import { VisuallyHidden } from "./visually-hidden";
import { useS1Words } from "./words";
import "./tokens.css";
import "./table.css";

export interface Column<Row> {
  /** Unique among the columns; the sort key, and the row's field shown when there is no `cell`. */
  key: string;
  header: ReactNode;
  /** What the cell shows; by default the row's field named `key`. */
  cell?: (row: Row, index: number) => ReactNode;
  /** A number: at the end of the cell, in mono with figures of one width. */
  numeric?: boolean;
  align?: "start" | "center" | "end";
  /** The header is a button that asks for this column's sort. */
  sortable?: boolean;
  /** Let the cell's words wrap (a description); cells keep to one line by default, and the table scrolls. */
  wrap?: boolean;
  /** A CSS width for the column. In a table that fits (`fit`), the widths share out the frame. */
  width?: CSSProperties["width"];
  /** The cell keeps to this many lines and ends in "…" (give the whole in `title`). */
  clamp?: number;
  /** The cell's tooltip: the whole of a clamped text, or what a short figure stands for. */
  title?: (row: Row, index: number) => string | undefined;
  /** The cell takes this many columns from here, and the row skips the cells it covers: one line for a row whose figures are of another kind. */
  span?: (row: Row, index: number) => number | undefined;
  /** Added to the column's header and cells: a hook for the page's own rules (a column a narrow box leaves out). */
  className?: string;
}

export interface Sort {
  key: string;
  dir: "asc" | "desc";
}

/** Attributes for a row's <tr>: a class, data attributes, a click that opens the row's link. */
export type RowProps = HTMLAttributes<HTMLTableRowElement> & { [data: `data-${string}`]: string | number | boolean | undefined };

/** Rows under a heading row across the table: a <tbody> of their own. */
export interface RowGroup<Row> {
  /** Unique among the groups: the group's React key, and the key its open state is kept under. */
  key: string;
  /** The heading, as the page draws it (a name, a mark, chips). Given a function, it is told whether the group is open, so a closed group can show its summary. */
  heading: ReactNode | ((open: boolean) => ReactNode);
  /** At the end of the heading row: a count, a summary. A function is told whether the group is open. */
  meta?: ReactNode | ((open: boolean) => ReactNode);
  /** The group's name in words, for its toggle; without it the toggle is named by the heading. */
  label?: string;
  rows: Row[];
  /** One row across the group when it has no rows. */
  empty?: ReactNode;
  /** Added to the group's <tbody>. */
  className?: string;
  /** On the group's <tbody>: a custom property its heading and rows draw in (a hue). */
  style?: CSSProperties;
}

/**
 * Which groups are open: every group but `except` (`all: true`), or only `except` (`all: false`). A group that
 * comes later (a refresh, a filter undone) follows `all`. Plain data, so a page can keep it (sessionStorage).
 */
export interface OpenGroups {
  all: boolean;
  except: readonly string[];
}

export const ALL_GROUPS_OPEN: OpenGroups = { all: true, except: [] };
export const ALL_GROUPS_CLOSED: OpenGroups = { all: false, except: [] };

export function isGroupOpen(open: OpenGroups, key: string): boolean {
  return open.all !== open.except.includes(key);
}

/** `open` with one group opened or closed. */
export function withGroupOpen(open: OpenGroups, key: string, value: boolean): OpenGroups {
  if (isGroupOpen(open, key) === value) return open;
  const except = open.except.includes(key) ? open.except.filter((k) => k !== key) : [...open.except, key];
  return { all: open.all, except };
}

/** Every one of these groups open (true), or every one closed. */
export function allGroupsOpen(open: OpenGroups, keys: readonly string[]): boolean {
  return keys.length > 0 && keys.every((k) => isGroupOpen(open, k));
}

export interface GroupWords {
  /** The button that opens every group. */
  expandAll: string;
  /** The same button once every group is open. */
  collapseAll: string;
}


type Body<Row> =
  | {
      rows: Row[];
      groups?: undefined;
    }
  | {
      rows?: undefined;
      /** Rows in groups, each under a heading row across the table, in the order given. */
      groups: RowGroup<Row>[];
    };

export type TableProps<Row> = Body<Row> & {
  /** What the table is: read first by screen readers, and the name of its scrolling frame. */
  caption: ReactNode;
  /** Keep the caption for screen readers only, where a heading above already says it. */
  hideCaption?: boolean;
  columns: Column<Row>[];
  /** Each row's React key: a field's name, or a function. */
  rowKey: keyof Row | ((row: Row, index: number) => Key);
  /** The column whose cells name their rows (row headers); the first by default. */
  rowHeader?: string;
  /** Attributes for each row's <tr>: a class, data attributes, a click. */
  rowProps?: (row: Row, index: number) => RowProps;
  /** Shown in one row across the table when there are no rows: words, or an EmptyState (the words' `empty` by default). */
  empty?: ReactNode;
  /** Rows still coming: that many rows of bars (5 for true), the frame marked busy. */
  loading?: boolean | number;
  /** The sort shown: the column marked and its direction. The table does not sort; sort the rows yourself. */
  sort?: Sort | null;
  /** Called with the sort asked for when a sortable header is pressed: ascending first, then the other way. */
  onSortChange?: (sort: Sort) => void;
  /** Buttons at the end of each row: a Menu, a Button. */
  actions?: (row: Row, index: number) => ReactNode;
  /** The actions column's name, for screen readers (the words' `actions` by default). */
  actionsLabel?: string;
  /** The header row stays while the rows scroll inside the frame, which is `maxHeight` tall. */
  stickyHeader?: boolean;
  /** The frame's height with a sticky header. */
  maxHeight?: CSSProperties["maxHeight"];
  /** Tighter rows, for a log. */
  dense?: boolean;
  /**
   * The table is as wide as its frame and no wider: the columns share it out (by their `width`, the rest evenly),
   * words wrap, and a clamped cell keeps to its lines. For a dense table that must not scroll sideways.
   */
  fit?: boolean;
  /** Each group's heading row has a button that opens and closes it (groups only). */
  collapsible?: boolean;
  /** The groups open now (controlled); with `onOpenGroupsChange`. */
  openGroups?: OpenGroups;
  /** The groups open at first (uncontrolled): all by default. */
  defaultOpenGroups?: OpenGroups;
  /** Called with the groups open after a toggle or "Expand all". */
  onOpenGroupsChange?: (open: OpenGroups) => void;
  /** A button above the table that opens every group, or closes them all when all are open. */
  expandAll?: boolean;
  /** The words of that button; translate them here. */
  groupWords?: GroupWords;
  /** The line under a table that is wider than its frame (the words' `scrollHint` by default). */
  scrollHint?: string;
  /** The words a screen reader hears for each sort direction (the words' `sortAscending`… by default). */
  sortWords?: { asc: string; desc: string; none: string };
  className?: string;
};

/** A click on the heading row (not on its controls, not a selection) opens or closes the group, as its button does. */
function fromRowBackground(e: MouseEvent<HTMLElement>): boolean {
  if (e.defaultPrevented || e.button !== 0) return false;
  const control = (e.target as HTMLElement).closest("a, button, input, select, textarea, label, summary, [role='button'], [tabindex]");
  if (control && e.currentTarget.contains(control)) return false;
  return !window.getSelection?.()?.toString();
}

/**
 * A data table: a real <table> with a caption, column headers and row
 * headers, numbers set to the end in mono, an empty row, rows of bars while
 * loading, sortable headers with aria-sort, and actions at the end of each row.
 * Rows can come in groups, each a <tbody> under a heading row across the table,
 * which a button opens and closes. Wider than its frame, it scrolls sideways
 * inside it and says so under it, never the page; the frame is then a region
 * named by the caption that takes focus, so a keyboard can scroll it. With
 * `fit` it is never wider than its frame.
 */
export function Table<Row>(props: TableProps<Row>) {
  const {
    caption,
    hideCaption = false,
    columns,
    rows,
    groups,
    rowKey,
    rowHeader,
    rowProps,
    empty,
    loading = false,
    sort,
    onSortChange,
    actions,
    actionsLabel,
    stickyHeader = false,
    maxHeight = "28rem",
    dense = false,
    fit = false,
    collapsible = false,
    openGroups,
    defaultOpenGroups = ALL_GROUPS_OPEN,
    onOpenGroupsChange,
    expandAll = false,
    groupWords,
    scrollHint,
    sortWords,
    className,
  } = props;
  const w = useS1Words();
  const groupSaid = groupWords ?? { expandAll: w.expandAll, collapseAll: w.collapseAll };
  const sortSaid = sortWords ?? { asc: w.sortAscending, desc: w.sortDescending, none: w.sortNone };
  const id = useId();
  const frame = useRef<HTMLDivElement>(null);
  const over = useOverflow(frame);
  const [ownOpen, setOwnOpen] = useState<OpenGroups>(defaultOpenGroups);
  const open = openGroups ?? ownOpen;
  const setOpen = (next: OpenGroups) => {
    if (openGroups === undefined) setOwnOpen(next);
    onOpenGroupsChange?.(next);
  };
  const head = rowHeader ?? columns[0]?.key;
  const span = columns.length + (actions ? 1 : 0);
  const busy = loading !== false && loading !== 0;
  const skeletons = typeof loading === "number" ? loading : 5;
  const keyOf = (row: Row, i: number) => (typeof rowKey === "function" ? rowKey(row, i) : (row[rowKey] as unknown as Key));
  // The frame is a named, focusable region only when it scrolls, so a keyboard can scroll it.
  const scrolls = over || stickyHeader;
  const cls = (c: Column<Row>) =>
    cn(c.numeric && "s1-table__num", c.align && `s1-table__${c.align}`, c.wrap && "s1-table__wrap", c.clamp && "s1-table__clamped", c.className);
  const keys = groups?.map((g) => g.key) ?? [];
  const everyOpen = allGroupsOpen(open, keys);

  const row = (r: Row, i: number) => {
    const extra = rowProps?.(r, i);
    const cells: ReactNode[] = [];
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      const value = col.cell ? col.cell(r, i) : ((r as Record<string, unknown>)[col.key] as ReactNode);
      const wide = Math.max(1, Math.min(col.span?.(r, i) ?? 1, columns.length - c));
      const attrs = { className: cls(col) || undefined, title: col.title?.(r, i), colSpan: wide > 1 ? wide : undefined };
      const content = col.clamp ? (
        <span className="s1-table__clamp" style={{ WebkitLineClamp: col.clamp } as CSSProperties}>
          {value}
        </span>
      ) : (
        value
      );
      cells.push(
        col.key === head ? (
          <th key={col.key} scope="row" {...attrs}>
            {content}
          </th>
        ) : (
          <td key={col.key} {...attrs}>
            {content}
          </td>
        ),
      );
      c += wide - 1;
    }
    return (
      <tr key={keyOf(r, i)} {...extra}>
        {cells}
        {actions && <td className="s1-table__actions">{actions(r, i)}</td>}
      </tr>
    );
  };

  const group = (g: RowGroup<Row>, n: number) => {
    const isOpen = !collapsible || isGroupOpen(open, g.key);
    const headingId = `${id}-g${n}`;
    const toggle = () => setOpen(withGroupOpen(open, g.key, !isOpen));
    const heading = typeof g.heading === "function" ? g.heading(isOpen) : g.heading;
    const meta = typeof g.meta === "function" ? g.meta(isOpen) : g.meta;
    return (
      <tbody key={g.key} className={cn("s1-table__group", g.className)} style={g.style} data-open={isOpen ? "" : undefined} aria-labelledby={headingId}>
        <tr className="s1-table__ghead">
          <th colSpan={span} scope="rowgroup" onClick={collapsible ? (e) => fromRowBackground(e) && toggle() : undefined}>
            <div className="s1-table__gbar">
              {collapsible && (
                <button
                  type="button"
                  className="s1-table__toggle"
                  aria-expanded={isOpen}
                  aria-label={g.label}
                  aria-labelledby={g.label ? undefined : headingId}
                  onClick={toggle}
                >
                  <span className="s1-table__chevron" aria-hidden="true" />
                </button>
              )}
              <div id={headingId} className="s1-table__gheading">
                {heading}
              </div>
              {meta != null && meta !== false && <div className="s1-table__gmeta">{meta}</div>}
            </div>
          </th>
        </tr>
        {isOpen &&
          (g.rows.length === 0 ? (
            g.empty != null && (
              <tr>
                <td colSpan={span} className="s1-table__empty">
                  {g.empty}
                </td>
              </tr>
            )
          ) : (
            g.rows.map(row)
          ))}
      </tbody>
    );
  };

  const nothing = (
    <tr>
      <td colSpan={span} className="s1-table__empty">
        {empty ?? w.empty}
      </td>
    </tr>
  );

  return (
    <div
      className={cn("s1-table", stickyHeader && "s1-table--sticky", dense && "s1-table--dense", fit && "s1-table--fit", groups && "s1-table--groups", className)}
      data-overflow={over ? "" : undefined}
    >
      {expandAll && collapsible && groups && groups.length > 0 && (
        <div className="s1-table__bar">
          <button type="button" className="s1-table__all" aria-expanded={everyOpen} onClick={() => setOpen(everyOpen ? ALL_GROUPS_CLOSED : ALL_GROUPS_OPEN)}>
            <span className="s1-table__chevron" aria-hidden="true" />
            {everyOpen ? groupSaid.collapseAll : groupSaid.expandAll}
          </button>
        </div>
      )}
      <div
        ref={frame}
        className="s1-table__frame"
        role={scrolls ? "region" : undefined}
        aria-labelledby={scrolls ? `${id}-caption` : undefined}
        tabIndex={scrolls ? 0 : undefined}
        style={stickyHeader ? { maxHeight } : undefined}
      >
        <table aria-busy={busy || undefined}>
          <caption id={`${id}-caption`} className={hideCaption ? "s1-table__caption--hidden" : "s1-table__caption"}>
            {caption}
          </caption>
          <thead>
            <tr>
              {columns.map((c) => {
                const on = sort?.key === c.key ? sort.dir : undefined;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    className={cls(c) || undefined}
                    style={c.width !== undefined ? { width: c.width } : undefined}
                    aria-sort={c.sortable ? (on === "asc" ? "ascending" : on === "desc" ? "descending" : "none") : undefined}
                  >
                    {c.sortable ? (
                      <button type="button" className="s1-table__sort" data-dir={on} onClick={() => onSortChange?.({ key: c.key, dir: on === "asc" ? "desc" : "asc" })}>
                        {c.header}
                        <span className="s1-table__arrow" aria-hidden="true" />
                        <VisuallyHidden>, {on ? sortSaid[on] : sortSaid.none}</VisuallyHidden>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
              {actions && (
                <th scope="col" className="s1-table__actions">
                  <VisuallyHidden>{actionsLabel ?? w.actions}</VisuallyHidden>
                </th>
              )}
            </tr>
          </thead>
          {busy ? (
            <tbody>
              {Array.from({ length: skeletons }, (_, r) => (
                <tr key={`loading-${r}`} className="s1-table__loading">
                  {Array.from({ length: span }, (_, c) => (
                    <td key={c}>
                      <Skeleton width={c === 0 ? "70%" : "50%"} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : groups ? (
            groups.length === 0 ? (
              <tbody>{nothing}</tbody>
            ) : (
              groups.map(group)
            )
          ) : (
            <tbody>{rows.length === 0 ? nothing : rows.map(row)}</tbody>
          )}
        </table>
      </div>
      <p className="s1-table__hint" aria-hidden="true">
        {scrollHint ?? w.scrollHint} <span>→</span>
      </p>
    </div>
  );
}
