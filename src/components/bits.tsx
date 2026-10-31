/* The blog's small parts: sources and pictures held elsewhere. The shared parts are in src/ui/. */
import type { ReactNode } from "react";

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
 * A figure whose pictures belong to someone else and are not reproduced here:
 * each named and linked to where it can be seen, in a dashed frame, with the
 * figure's caption under them.
 */
export function Elsewhere({ pictures, children }: { pictures: [string, string][]; children: ReactNode }) {
  return (
    <figure className="elsewhere">
      <p className="elsewhere__label mono" lang="en">
        Pictures at their sources
      </p>
      <ul>
        {pictures.map(([name, href]) => (
          <li key={name}>
            <a href={href}>{name}&nbsp;↗</a>
          </li>
        ))}
      </ul>
      <figcaption>{children}</figcaption>
    </figure>
  );
}
