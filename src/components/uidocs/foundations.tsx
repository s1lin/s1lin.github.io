import { useSyncExternalStore } from "react";
import { Plate } from "@/ui/plate";
import { useDark } from "@/ui/use-dark";
import { useMedia } from "@/ui/use-media";

/*
 * The live examples of the getting-started entries: the tokens drawn in
 * themselves, and the theme as this page has it now.
 */

const COLOURS = [
  { token: "--s1-paper", light: "#f6f6f4", dark: "#0f0f0f" },
  { token: "--s1-paper-2", light: "#ececea", dark: "#191919" },
  { token: "--s1-ink", light: "#111111", dark: "#ededed" },
  { token: "--s1-ink-2", light: "#4d4d4d", dark: "#b3b3b3" },
  { token: "--s1-ink-3", light: "#8a8a8a", dark: "#7a7a7a" },
  { token: "--s1-rule", light: "ink 14%", dark: "ink 14%" },
  { token: "--s1-rule-strong", light: "ink 80%", dark: "ink 80%" },
  { token: "--s1-accent", light: "#d62d20", dark: "#f0574b" },
];

const FAMILIES = [
  { token: "--s1-font-display", name: "Instrument Serif", sample: "Architecture, set like a magazine." },
  { token: "--s1-font-sans", name: "Inter Tight", sample: "One gateway to every model." },
  { token: "--s1-font-mono", name: "JetBrains Mono", sample: "VOL.30 · 2026 · 0123456789" },
  { token: "--s1-font-mincho", name: "Shippori Mincho B1", sample: "設計 部品", ja: true },
  { token: "--s1-font-gothic", name: "Zen Kaku Gothic New", sample: "夜 紙 随筆", ja: true },
];

/** Each colour as a chip in the theme now showing, with both its values; the typefaces; the marks. */
export function Tokens() {
  return (
    <>
      <ul className="ud-swatches">
        {COLOURS.map((t) => (
          <li key={t.token} className="ud-swatch">
            <i style={{ background: `var(${t.token})` }} aria-hidden="true" />
            <b>{t.token}</b>
            <span>
              {t.light} · {t.dark}
            </span>
          </li>
        ))}
      </ul>
      <ul className="ud-type">
        {FAMILIES.map((f) => (
          <li key={f.token}>
            <p className="ud-type__spec">
              <b>{f.name}</b>
              var({f.token})
            </p>
            <p className="ud-type__sample" style={{ fontFamily: `var(${f.token})` }} lang={f.ja ? "ja" : undefined}>
              {f.sample}
            </p>
          </li>
        ))}
      </ul>
      <Plate className="ud-corner-box">
        <p className="mono">--s1-corners</p>
        <p>A &ldquo;+&rdquo; at each corner, in the box&rsquo;s own ink: this box is a Plate.</p>
      </Plate>
    </>
  );
}

/* The theme attribute itself, as the page has it now. */
function subscribeTheme(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

/** What the theme is on this page, right now, and a well in the tokens to watch turn. */
export function DarkDemo() {
  const dark = useDark();
  const system = useMedia("(prefers-color-scheme: dark)");
  const attr = useSyncExternalStore(subscribeTheme, () => document.documentElement.dataset.theme ?? "", () => "");
  return (
    <>
      <dl className="ud-readout">
        <dt>&lt;html data-theme&gt;</dt>
        <dd>{attr ? `"${attr}"` : "not set: following the system"}</dd>
        <dt>prefers-color-scheme: dark</dt>
        <dd>{String(system)}</dd>
        <dt>useDark()</dt>
        <dd>{String(dark)}</dd>
      </dl>
      <p className="cap">Flip the theme with 夜 / 紙 in the running head and watch every example on this page turn with it.</p>
    </>
  );
}
