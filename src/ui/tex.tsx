import { useEffect, useId, useState } from "react";
import type { KatexOptions } from "katex";
import { cn } from "./cn";

/*
 * Maths in LaTeX, set by KaTeX. Where the page is rendered on a server, hand
 * Tex the KaTeX module first (setKatex) and readers get finished HTML, with
 * MathML beside it for screen readers, and no KaTeX script: on the client Tex
 * reads back the HTML already in the page, so hydration matches. Anywhere
 * else (a page rendered in the browser, a dev server) it loads KaTeX when the
 * first formula mounts and sets it then. KaTeX's stylesheet is not imported
 * here, so pages without maths never load it: import
 * "katex/dist/katex.min.css" on the pages that have some.
 */
type Katex = { renderToString(tex: string, options?: KatexOptions): string };
let katex: Katex | undefined;

/** Lets Tex set maths synchronously, on a server: `setKatex((await import("katex")).default)`. */
export function setKatex(k: Katex) {
  katex = k;
}

const options = (block: boolean): KatexOptions => ({ displayMode: block, throwOnError: false, output: "htmlAndMathml" });

/**
 * LaTeX, inline by default or on a line of its own with `block`. Write the
 * source with String.raw so its backslashes stay: <Tex>{String.raw`\frac{a}{b}`}</Tex>.
 * A mistake in it is shown in red in place, not thrown.
 */
export function Tex({ children, block = false, className }: { children: string; block?: boolean; className?: string }) {
  const id = useId();
  const key = `${block ? "block" : "inline"}:${children}`;
  const [set, setSet] = useState(() => ({
    key,
    html: katex
      ? katex.renderToString(children, options(block))
      : typeof document === "undefined"
        ? ""
        : (document.getElementById(id)?.innerHTML ?? ""),
  }));
  const html = set.key === key ? set.html : "";
  useEffect(() => {
    if (html) return;
    let live = true;
    void import("katex").then(({ default: k }) => {
      if (live) setSet({ key, html: k.renderToString(children, options(block)) });
    });
    return () => {
      live = false;
    };
  }, [html, key, children, block]);
  return <span id={id} className={cn("s1-tex", block && "s1-tex--block", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
