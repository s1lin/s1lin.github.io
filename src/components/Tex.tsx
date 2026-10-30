import { useEffect, useId, useRef, useState } from "react";

/*
 * Maths in the blog, written in LaTeX and set by KaTeX when the pages are
 * prerendered: readers get finished HTML, with MathML beside it for screen
 * readers, and no KaTeX script. On the client the component hands back the
 * HTML already in the page, so hydration matches. Only the dev server, which
 * prerenders nothing, sets the maths in the browser. KaTeX's stylesheet comes
 * with the blog's (styles/tex.css).
 */
const katex = import.meta.env.SSR ? (await import("katex")).default : undefined;
const typesetLive = import.meta.env.DEV
  ? (el: HTMLElement, tex: string, block: boolean) =>
      void import("katex").then(({ default: k }) => {
        el.innerHTML = k.renderToString(tex, { displayMode: block, throwOnError: false });
      })
  : undefined;

/**
 * LaTeX, inline by default or on a line of its own with `block`. Write the
 * source with String.raw so its backslashes stay: <Tex>{String.raw`\frac{a}{b}`}</Tex>.
 * A mistake in it is shown in red in place, not thrown.
 */
export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const [html] = useState(() =>
    katex
      ? katex.renderToString(children, { displayMode: block, throwOnError: false, output: "htmlAndMathml" })
      : typeof document === "undefined"
        ? ""
        : (document.getElementById(id)?.innerHTML ?? ""),
  );
  useEffect(() => {
    if (typesetLive && !html && ref.current) typesetLive(ref.current, children, block);
  }, [html, children, block]);
  return <span ref={ref} id={id} className={block ? "tex tex--block" : "tex"} dangerouslySetInnerHTML={{ __html: html }} />;
}
