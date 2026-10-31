import { useEffect, useId, useState } from "react";
import type { KatexOptions } from "katex";
import { cn } from "./cn";

/*
 * Maths in LaTeX, set by KaTeX. Where the page is rendered on a server, hand
 * Tex the KaTeX module first (setKatex) and readers get finished HTML, with
 * MathML beside it for screen readers, and no KaTeX script: in the browser Tex
 * reads back the HTML already in the page, so hydration matches. Anywhere else
 * (a page rendered in the browser, a dev server) it loads KaTeX when the first
 * formula mounts and sets it then. KaTeX's stylesheet (tex.css) comes along
 * the first time a page that has none shows maths; a server-rendered page
 * should import tex.css itself, so its maths is styled before any script runs.
 */
type Katex = { renderToString(tex: string, options?: KatexOptions): string };
let katex: Katex | undefined;

/** Lets Tex set maths synchronously, on a server: `setKatex((await import("katex")).default)`. */
export function setKatex(k: Katex) {
  katex = k;
}

/** Whether KaTeX's rules are on the page: they take its MathML copy out of the flow. */
function styled() {
  const probe = document.createElement("span");
  probe.className = "katex";
  probe.hidden = true;
  probe.innerHTML = '<span class="katex-mathml"></span>';
  document.body.append(probe);
  const yes = getComputedStyle(probe.firstElementChild!).position === "absolute";
  probe.remove();
  return yes;
}
let stylesheet: Promise<unknown> | undefined;
const loadStylesheet = () => (stylesheet ??= styled() ? Promise.resolve() : import("./tex.css"));

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
    if (html) {
      void loadStylesheet();
      return;
    }
    let live = true;
    void Promise.all([import("katex"), loadStylesheet()]).then(([{ default: k }]) => {
      if (live) setSet({ key, html: k.renderToString(children, options(block)) });
    });
    return () => {
      live = false;
    };
  }, [html, key, children, block]);
  return <span id={id} className={cn("s1-tex", block && "s1-tex--block", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
