import type { ReactNode } from "react";

/** A metro-style station roundel: a line's letter in a ring. */
export function Roundel({ children, hidden }: { children: ReactNode; hidden?: boolean }) {
  return (
    <span className="roundel" aria-hidden={hidden || undefined}>
      {children}
    </span>
  );
}

/** Kicker line over a heading: a Japanese label, then English. */
export function Kicker({ ja, children }: { ja: string; children: ReactNode }) {
  return (
    <p className="kicker">
      <span lang="ja">{ja}</span> {children}
    </p>
  );
}

export function Folio({ page }: { page: string }) {
  return <span className="folio">— {page} —</span>;
}

/** A screenshot in a hairline browser frame. */
export function Screen({ bar, children }: { bar: string; children: ReactNode }) {
  return (
    <div className="screen">
      <div className="screen__bar">{bar}</div>
      {children}
    </div>
  );
}

export function Stack({ items }: { items: string[] }) {
  return (
    <p className="stack">
      {items.map((s) => (
        <span key={s}>{s}</span>
      ))}
    </p>
  );
}

/** A pointer to a post's source n, listed under its text (components/Blog.tsx). */
export function Ref({ n }: { n: number }) {
  return (
    <sup className="ref">
      <a href={`#ref-${n}`}>[{n}]</a>
    </sup>
  );
}

/** An address under a post's sources, on its own line and shown without its scheme. */
export function SourceLink({ href }: { href: string }) {
  return (
    <>
      <br />
      <a href={href}>{decodeURI(href.replace(/^https?:\/\//, ""))}</a>
    </>
  );
}

/**
 * An id as a barcode, the id printed under it. The bars are drawn from the
 * id's hex digits, two bars and two spaces a digit, between guards at the ends
 * and the middle; each id draws its own, but it is not a code a scanner reads.
 */
export function Barcode({ id, label = true }: { id: string; label?: boolean }) {
  let x = 0;
  let d = "";
  const bar = (w: number) => {
    d += `M${x} 0h${w}v1h-${w}z`;
    x += w;
  };
  const guard = () => {
    bar(1);
    x += 1;
    bar(1);
    x += 1;
  };
  const hex = id.replace(/-/g, "");
  guard();
  [...hex].forEach((c, i) => {
    const n = parseInt(c, 16);
    if (i === hex.length / 2) guard();
    bar(1 + (n & 1));
    x += 1 + ((n >> 1) & 1);
    bar(1 + ((n >> 2) & 1));
    x += 1 + ((n >> 3) & 1);
  });
  guard();
  return (
    <span className="code" title={id}>
      <svg viewBox={`0 0 ${x - 1} 1`} preserveAspectRatio="none" aria-hidden="true">
        <path d={d} />
      </svg>
      {label && <span className="code__id">{id}</span>}
    </span>
  );
}
