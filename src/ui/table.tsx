import { useId, useRef, type CSSProperties, type Key, type ReactNode } from "react";
import { cn } from "./cn";
import { Skeleton } from "./skeleton";
import { useOverflow } from "./use-overflow";
import { VisuallyHidden } from "./visually-hidden";
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
  /** A CSS width for the column. */
  width?: CSSProperties["width"];
}

export interface Sort {
  key: string;
  dir: "asc" | "desc";
}

export type TableProps<Row> = {
  /** What the table is: read first by screen readers, and the name of its scrolling frame. */
  caption: ReactNode;
  /** Keep the caption for screen readers only, where a heading above already says it. */
  hideCaption?: boolean;
  columns: Column<Row>[];
  rows: Row[];
  /** Each row's React key: a field's name, or a function. */
  rowKey: keyof Row | ((row: Row, index: number) => Key);
  /** The column whose cells name their rows (row headers); the first by default. */
  rowHeader?: string;
  /** Shown in one row across the table when there are no rows: words, or an EmptyState. */
  empty?: ReactNode;
  /** Rows still coming: that many rows of bars (5 for true), the frame marked busy. */
  loading?: boolean | number;
  /** The sort shown: the column marked and its direction. The table does not sort; sort the rows yourself. */
  sort?: Sort | null;
  /** Called with the sort asked for when a sortable header is pressed: ascending first, then the other way. */
  onSortChange?: (sort: Sort) => void;
  /** Buttons at the end of each row: a Menu, a Button. */
  actions?: (row: Row, index: number) => ReactNode;
  /** The actions column's name, for screen readers. */
  actionsLabel?: string;
  /** The header row stays while the rows scroll inside the frame, which is `maxHeight` tall. */
  stickyHeader?: boolean;
  /** The frame's height with a sticky header. */
  maxHeight?: CSSProperties["maxHeight"];
  /** Tighter rows, for a log. */
  dense?: boolean;
  /** The line under a table that is wider than its frame. */
  scrollHint?: string;
  /** The words a screen reader hears for each sort direction; translate them here. */
  sortWords?: { asc: string; desc: string; none: string };
  className?: string;
};

const SORT_WORDS = { asc: "sorted ascending", desc: "sorted descending", none: "sort" };

/**
 * A data table: a real <table> with a caption, column headers and row
 * headers, numbers set to the end in mono, an empty row, rows of bars while
 * loading, sortable headers with aria-sort, and actions at the end of each row.
 * Wider than its frame, it scrolls sideways inside it and says so under it,
 * never the page; the frame is then a region named by the caption that takes
 * focus, so a keyboard can scroll it.
 */
export function Table<Row>({
  caption,
  hideCaption = false,
  columns,
  rows,
  rowKey,
  rowHeader,
  empty = "Nothing here yet.",
  loading = false,
  sort,
  onSortChange,
  actions,
  actionsLabel = "Actions",
  stickyHeader = false,
  maxHeight = "28rem",
  dense = false,
  scrollHint = "Scroll sideways for more",
  sortWords = SORT_WORDS,
  className,
}: TableProps<Row>) {
  const id = useId();
  const frame = useRef<HTMLDivElement>(null);
  const over = useOverflow(frame);
  const head = rowHeader ?? columns[0]?.key;
  const span = columns.length + (actions ? 1 : 0);
  const busy = loading !== false && loading !== 0;
  const skeletons = typeof loading === "number" ? loading : 5;
  const keyOf = (row: Row, i: number) => (typeof rowKey === "function" ? rowKey(row, i) : (row[rowKey] as unknown as Key));
  // The frame is a named, focusable region only when it scrolls, so a keyboard can scroll it.
  const scrolls = over || stickyHeader;
  const cls = (c: Column<Row>) => cn(c.numeric && "s1-table__num", c.align && `s1-table__${c.align}`, c.wrap && "s1-table__wrap");

  return (
    <div className={cn("s1-table", stickyHeader && "s1-table--sticky", dense && "s1-table--dense", className)} data-overflow={over ? "" : undefined}>
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
                    className={cls(c)}
                    style={c.width !== undefined ? { width: c.width } : undefined}
                    aria-sort={c.sortable ? (on === "asc" ? "ascending" : on === "desc" ? "descending" : "none") : undefined}
                  >
                    {c.sortable ? (
                      <button type="button" className="s1-table__sort" data-dir={on} onClick={() => onSortChange?.({ key: c.key, dir: on === "asc" ? "desc" : "asc" })}>
                        {c.header}
                        <span className="s1-table__arrow" aria-hidden="true" />
                        <VisuallyHidden>, {on ? sortWords[on] : sortWords.none}</VisuallyHidden>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
              {actions && (
                <th scope="col" className="s1-table__actions">
                  <VisuallyHidden>{actionsLabel}</VisuallyHidden>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {busy
              ? Array.from({ length: skeletons }, (_, r) => (
                  <tr key={`loading-${r}`} className="s1-table__loading">
                    {Array.from({ length: span }, (_, c) => (
                      <td key={c}>
                        <Skeleton width={c === 0 ? "70%" : "50%"} />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.length === 0
                ? (
                    <tr>
                      <td colSpan={span} className="s1-table__empty">
                        {empty}
                      </td>
                    </tr>
                  )
                : rows.map((row, r) => (
                    <tr key={keyOf(row, r)}>
                      {columns.map((c) => {
                        const value = c.cell ? c.cell(row, r) : ((row as Record<string, unknown>)[c.key] as ReactNode);
                        return c.key === head ? (
                          <th key={c.key} scope="row" className={cls(c)}>
                            {value}
                          </th>
                        ) : (
                          <td key={c.key} className={cls(c)}>
                            {value}
                          </td>
                        );
                      })}
                      {actions && <td className="s1-table__actions">{actions(row, r)}</td>}
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
      <p className="s1-table__hint" aria-hidden="true">
        {scrollHint} <span>→</span>
      </p>
    </div>
  );
}
