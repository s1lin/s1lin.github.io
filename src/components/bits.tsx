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
