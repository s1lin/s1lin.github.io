import type { ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./pagination.css";

type Props = {
  /** The page shown, from 1. */
  page: number;
  /** How many pages there are. */
  pageCount: number;
  /** Called with the page asked for. */
  onPageChange?: (page: number) => void;
  /** Make the pages links: the address of each. `onPageChange` is still called. */
  href?: (page: number) => string;
  /** Pages shown either side of this one, before a gap. */
  siblings?: number;
  /** At the start of the row: "21–40 of 213". */
  summary?: ReactNode;
  /** The navigation's name, for screen readers. */
  label?: string;
  /** The words, translated: Previous, Next, and "Page {n}" and "Page {n} of {count}". */
  words?: { previous: string; next: string; page: (n: number) => string; of: (n: number, count: number) => string };
  className?: string;
};

const WORDS = { previous: "Previous", next: "Next", page: (n: number) => `Page ${n}`, of: (n: number, count: number) => `Page ${n} of ${count}` };

/** The page numbers to show: the ends, this page and its siblings; a gap where pages are left out, a page where only one would be. */
export function pageList(page: number, count: number, siblings = 1): (number | "gap")[] {
  const keep = new Set([1, count]);
  for (let p = page - siblings; p <= page + siblings; p++) if (p >= 1 && p <= count) keep.add(p);
  const sorted = [...keep].filter((p) => p >= 1).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev === 2) out.push(prev + 1);
    else if (prev !== undefined && p - prev > 2) out.push("gap");
    out.push(p);
  });
  return out;
}

/**
 * Pages of a long list: Previous and Next, the first and last page, this one
 * and its neighbours, gaps between. A <nav> with the page shown marked
 * `aria-current="page"`; buttons, or links with `href`. In a narrow box the
 * numbers give way to "Page 3 of 12".
 */
export function Pagination({ page, pageCount, onPageChange, href, siblings = 1, summary, label = "Pagination", words = WORDS, className }: Props) {
  const count = Math.max(1, pageCount);
  const at = Math.min(Math.max(1, page), count);
  const step = (to: number, body: ReactNode, opts: { cls: string; name?: string; current?: boolean; disabled?: boolean }) => {
    const props = { className: opts.cls, "aria-label": opts.name, "aria-current": opts.current ? ("page" as const) : undefined };
    if (!href)
      return (
        <button type="button" {...props} disabled={opts.disabled} onClick={() => onPageChange?.(to)}>
          {body}
        </button>
      );
    // a link with nowhere to go: no href, so no focus, but still a link to a screen reader, marked disabled
    if (opts.disabled)
      return (
        <a {...props} role="link" aria-disabled="true">
          {body}
        </a>
      );
    return (
      <a {...props} href={href(to)} onClick={() => onPageChange?.(to)}>
        {body}
      </a>
    );
  };
  return (
    <nav className={cn("s1-pages", className)} aria-label={label}>
      {summary && <p className="s1-pages__summary">{summary}</p>}
      <p className="s1-pages__status">{words.of(at, count)}</p>
      <ul className="s1-pages__list">
        <li>{step(at - 1, <><span aria-hidden="true">←</span> <span className="s1-pages__word">{words.previous}</span></>, { cls: "s1-pages__step", name: words.previous, disabled: at <= 1 })}</li>
        {pageList(at, count, siblings).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} className="s1-pages__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p} className="s1-pages__n">
              {step(p, p, { cls: "s1-pages__page", name: words.page(p), current: p === at })}
            </li>
          ),
        )}
        <li>{step(at + 1, <><span className="s1-pages__word">{words.next}</span> <span aria-hidden="true">→</span></>, { cls: "s1-pages__step", name: words.next, disabled: at >= count })}</li>
      </ul>
    </nav>
  );
}
