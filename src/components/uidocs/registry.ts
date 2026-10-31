/*
 * The inventory behind /ui/: every component and shared part in src/, as plain
 * data. Entries are documented in full (summary, live example, props, notes);
 * the site's own sections are listed briefly at the end. No JSX and no imports,
 * so test/uidocs.test.ts can read it under `node --test` and check it against
 * the source: every export named here exists, every prop is in its file, and
 * every exported component in src/components appears somewhere.
 */

export type GroupId = "foundations" | "primitives" | "page" | "effects" | "media" | "social" | "life" | "hooks";

export interface Group {
  id: GroupId;
  name: string;
  blurb: string;
}

export const GROUPS: Group[] = [
  { id: "foundations", name: "Foundations", blurb: "The tokens every part is made of: ink, type, the grid, hairlines and marks, buttons, theme and motion. All in src/styles/site.css." },
  { id: "primitives", name: "Primitives", blurb: "Small parts with no state, used across the issue, the blog and the docs: the mark, roundels, kickers, barcodes, sources, maths." },
  { id: "page", name: "Page", blurb: "What makes a page of the site: the running head, the spread it is set in, and the feature template." },
  { id: "effects", name: "Effects", blurb: "Canvas UI effects, patched to run in any WebGL2 browser, and the wrappers that meet them to photographs and titles. Each mounts only near the viewport." },
  { id: "media", name: "Pictures and charts", blurb: "ASCII pieces, the GitHub heatmap, the metro player, the token charts and the workshop slider." },
  { id: "social", name: "Social", blurb: "Comments, likes, reposts and shapes, served by Aha Social. On this page they are specimens with mock data: nothing here signs in, posts or calls Aha." },
  { id: "life", name: "Life", blurb: "The boards and copy helpers of /life/, drawn on 2D canvases in the ARC palette." },
  { id: "hooks", name: "Hooks", blurb: "The small hooks the parts above share: theme, media queries, nearness to the viewport, hydration, drawing scale." },
];

export type ExampleKind = "live" | "specimen" | "on-click" | "none";

export interface PropDoc {
  name: string;
  type: string;
  /** Shown in the Default column; "—" when it is required. */
  default?: string;
  required?: boolean;
  desc: string;
}

export interface Note {
  label: "Accessibility" | "Reduced motion" | "Phone" | "Dark mode" | "Cost" | "Network" | "Styles" | "Data" | "Reuse";
  text: string;
}

export interface Entry {
  id: string;
  name: string;
  group: GroupId;
  /** Files or folders (ending in "/") the exports live in, from the repository root. */
  sources: string[];
  /** Names the test checks are exported from `sources`. */
  exports: string[];
  /** The import line, as a page would write it. */
  import?: string;
  summary: string;
  example: ExampleKind;
  usage?: string;
  /** "Props" by default; hooks and CSS have other headings. */
  propsTitle?: string;
  props?: PropDoc[];
  notes?: Note[];
  /** Where it is in use on the site. */
  where?: string;
  /** Where to see it working, when this page has no example of its own. */
  see?: { href: string; label: string };
}

/** A part of the site that is not meant for reuse: listed, with why. */
export interface Listed {
  name: string;
  sources: string[];
  exports: string[];
  /** Where it is on the site, as a link. */
  where: string;
  why: string;
}

const SITE_CSS = "src/styles/site.css";

export const ENTRIES: Entry[] = [
  // ------------------------------------------------------------ foundations
  {
    id: "colour",
    name: "Colour",
    group: "foundations",
    sources: [SITE_CSS],
    exports: [],
    summary:
      "One ink on plain stock: a paper, a second paper for plates and wells, the ink (`--sumi`), two greys and two hairline strengths. Every token has a light and a dark value, and the Tailwind theme maps them to utilities.",
    example: "live",
    propsTitle: "Tokens",
    usage: `.well { background: var(--paper-2); color: var(--sumi); border: 0.5px solid var(--rule-strong); }

/* the same in Tailwind (src/index.css maps the tokens) */
<p className="bg-paper-2 text-ink-2">…</p>`,
    notes: [
      { label: "Dark mode", text: "The tokens switch with `prefers-color-scheme`, unless `<html data-theme>` says `light` or `dark` (the 夜/紙 toggle in the running head). A `.night` section is printed on black stock in either theme." },
      { label: "Reuse", text: "New parts stay in these tokens: no new colour accents. Colour on the site comes only from photographs and a short list the owner asked for: the GitHub heatmap's greens, the token charts, the route map's lines, the Metro2Line map, the HiRain schematic, the Glitch RGB split, the ascii.rest plates, the departures board, and the primaries of Life and the social parts." },
    ],
  },
  {
    id: "type",
    name: "Type",
    group: "foundations",
    sources: [SITE_CSS],
    exports: [],
    summary:
      "Five families, each a token: Instrument Serif for display, Inter Tight for text, JetBrains Mono for labels and numbers, Shippori Mincho B1 and Zen Kaku Gothic New for Japanese. A handful of named styles carry the scale, most of them fluid with `clamp()`.",
    example: "live",
    usage: `<h1 className="display">Notes <em>between issues.</em></h1>
<p className="dek">A paragraph set large under a headline.</p>
<p className="mono">Small caps in mono · 0.72rem</p>`,
    notes: [
      { label: "Accessibility", text: "Japanese and Chinese runs carry `lang=\"ja\"` or `lang=\"zh-Hans\"`, which picks their family and line-breaking. Body text never goes under 16px." },
      { label: "Phone", text: "The display sizes are `clamp()`ed against the viewport, so a headline holds at 320px without a breakpoint." },
      { label: "Network", text: "The Japanese families are subset to the characters each page uses: a new kanji must be added to the page's subset, or it falls back to a system font." },
    ],
  },
  {
    id: "grid",
    name: "Grid",
    group: "foundations",
    sources: [SITE_CSS],
    exports: [],
    summary:
      "`.wrap` centres the column at `--max` (1440px) inside a `--gutter`; `.grid` divides it into twelve equal columns with a `--gap`. Most spreads split it 1 / span 5 and 7 / span 6, and fold every child to 1 / -1 at 900px.",
    example: "live",
    usage: `<section className="spread">
  <div className="wrap grid">
    <div style={{ gridColumn: "1 / span 5" }}>…</div>
    <div style={{ gridColumn: "7 / span 6" }}>…</div>
  </div>
</section>`,
    notes: [
      { label: "Phone", text: "Grid children get `min-width: 0`, so a wide `<pre>` or drawing scrolls inside its own frame rather than pushing the page sideways. Fold spans at 900px with a media query, as each section does." },
      { label: "Styles", text: "`--gutter` is clamp(16px, 4vw, 56px) and `--gap` clamp(14px, 2vw, 28px); `--head-h` (44px) is the running head, which `scroll-padding-top` clears for anchors." },
    ],
  },
  {
    id: "rules",
    name: "Rules, frame and marks",
    group: "foundations",
    sources: [SITE_CSS],
    exports: [],
    summary:
      "Hairlines rather than double rules: `0.5px` in `--rule` between items and `--rule-strong` under a label. Every `.spread` stands between two hairlines halfway into the gutter, with a \"+\" where they cross its top rule; a box that needs emphasis gets the same marks at its corners from `--corners`.",
    example: "live",
    usage: `/* "+" registration marks at the corners of a box: an ::after 11px larger, 5.5px out on every side */
.box { position: relative; border: 0.5px solid var(--rule-strong); }
.box::after { content: ""; position: absolute; inset: -6px; pointer-events: none; background: var(--corners); }`,
    notes: [
      { label: "Dark mode", text: "The marks are drawn in `currentColor`, so they follow the ink. The section marks blend by difference, so a \"+\" stays whole where a spread on black stock meets one on paper." },
      { label: "Reuse", text: "Dashed means not there yet: a planned stop, an empty bay, pictures held elsewhere. Dotted is the contents' leader. A 2px solid rule is kept for the feature openers and Life." },
    ],
  },
  {
    id: "buttons",
    name: "Buttons",
    group: "foundations",
    sources: [SITE_CSS, "src/styles/social.css"],
    exports: [],
    summary:
      "There is no shared Button component: each control is styled by its parent's class. They share one manner, though: mono type, a hairline in `--rule-strong`, `--paper-2` on hover, and pressed or chosen printed in reverse, ink for paper.",
    example: "live",
    usage: `<div className="m2l-bar__group" role="group" aria-label="Mode">
  <button type="button" aria-pressed={mode === "ride"}>Ride</button>
  <button type="button" aria-pressed={mode === "guess"}>Guess</button>
</div>`,
    notes: [
      { label: "Accessibility", text: "Toggles use `aria-pressed`, and the style hangs on it, so the state a screen reader hears is the state the eye sees. Focus shows a 2px ink outline everywhere (`:focus-visible`)." },
      { label: "Reuse", text: "To use one outside its parent, copy its rule or lift it into a shared class; the m2l-bar toggle is the most general. The social buttons and Life's wear the primaries (an offset red shadow on the main action); keep those to their own pages." },
    ],
  },
  {
    id: "motion",
    name: "Theme and motion",
    group: "foundations",
    sources: [SITE_CSS, "src/hooks/useDark.ts"],
    exports: ["useDark"],
    summary:
      "The theme lives on `<html data-theme>`, restored from `localStorage[\"s1lin-theme\"]` by a script in each page's head before first paint. Motion is a garnish: section labels draw their rule as they scroll in, pages cross-fade, and readers who ask for reduced motion get none of it.",
    example: "live",
    usage: `import { useDark } from "@/hooks/useDark";

const dark = useDark(); // true on night paper, false on the server`,
    notes: [
      { label: "Reduced motion", text: "site.css stops every CSS animation and transition under `prefers-reduced-motion: reduce`. The canvas effects read the same query: Ripple and Glitch hold still, Frost skips its growth, the sand is not drawn, ascii.rest shows its still frame." },
      { label: "Dark mode", text: "Anything drawn in script reads the theme with `useDark()` and its colours from the computed tokens, so it turns with the page." },
    ],
  },

  // ------------------------------------------------------------ primitives
  {
    id: "mark",
    name: "Mark",
    group: "primitives",
    sources: ["src/components/Mark.tsx"],
    exports: ["Mark"],
    import: `import { Mark } from "@/components/Mark";`,
    summary: "The site's mark: a cross on a block of ink. The favicon is the same drawing. At night the block takes the light ink and the cross the dark paper.",
    example: "live",
    usage: `<Mark className="runhead__mark" /> {/* size it in CSS: width and height */}`,
    props: [{ name: "className", type: "string", desc: "Added to `brand-mark`. The SVG has no size of its own; give it one in CSS." }],
    notes: [{ label: "Accessibility", text: "Decorative (`aria-hidden`): set it beside the name, never in place of it." }],
    where: "The running head; Brick Locator uses the same drawing.",
  },
  {
    id: "mark-set-out",
    name: "MarkSetOut",
    group: "primitives",
    sources: ["src/components/Mark.tsx"],
    exports: ["MarkSetOut"],
    import: `import { MarkSetOut } from "@/components/Mark";`,
    summary: "The mark as set out with compass and square: a circle struck from the centre through the corners, the centre lines, the cross, and the compass point left at the centre.",
    example: "live",
    usage: `<MarkSetOut />`,
    notes: [{ label: "Accessibility", text: "An image with its own description (`role=\"img\"`, `aria-label`). 96px square from `.mark-set-out`." }],
    where: "The colophon, under The mark.",
  },
  {
    id: "roundel",
    name: "Roundel",
    group: "primitives",
    sources: ["src/components/bits.tsx"],
    exports: ["Roundel"],
    import: `import { Roundel } from "@/components/bits";`,
    summary: "A metro-style station roundel: a line's letter in a ring. Every feature and build has one, and it sizes with the type around it (1.9em).",
    example: "live",
    usage: `<h2><Roundel hidden>T</Roundel> Tokensbeat</h2>`,
    props: [
      { name: "children", type: "ReactNode", required: true, desc: "The letter, usually one character." },
      { name: "hidden", type: "boolean", default: "false", desc: "Hide it from screen readers, when the name beside it says the same." },
    ],
    where: "Cover lines, contents, feature titles, the workshop slider.",
  },
  {
    id: "kicker",
    name: "Kicker",
    group: "primitives",
    sources: ["src/components/bits.tsx"],
    exports: ["Kicker"],
    import: `import { Kicker } from "@/components/bits";`,
    summary: "The line over a heading: a Japanese label in mincho, then English in spaced mono caps.",
    example: "live",
    usage: `<Kicker ja="随筆">Blog · No. 03</Kicker>`,
    props: [
      { name: "ja", type: "string", required: true, desc: "The Japanese label, set with `lang=\"ja\"`." },
      { name: "children", type: "ReactNode", required: true, desc: "The English part: section, pages, number." },
    ],
    notes: [{ label: "Network", text: "Its kanji must be in the page's mincho subset, or they fall back to a system font." }],
    where: "Every section opener, the blog, this page.",
  },
  {
    id: "folio",
    name: "Folio",
    group: "primitives",
    sources: ["src/components/bits.tsx"],
    exports: ["Folio"],
    import: `import { Folio } from "@/components/bits";`,
    summary: "A page number, \"— 04 —\", centred at the foot of the nearest positioned box, as on a printed page.",
    example: "live",
    usage: `<section className="spread">…<Folio page="04" /></section>`,
    props: [{ name: "page", type: "string", required: true, desc: "The page, as printed." }],
    notes: [{ label: "Styles", text: "Absolutely placed 22px from the bottom: its parent needs `position: relative` (`.spread` has it)." }],
    where: "The foot of each spread of the issue.",
  },
  {
    id: "screen",
    name: "Screen",
    group: "primitives",
    sources: ["src/components/bits.tsx"],
    exports: ["Screen"],
    import: `import { Screen } from "@/components/bits";`,
    summary: "A screenshot in a hairline browser frame: a bar with three dots and the address, an offset plate behind.",
    example: "live",
    usage: `<Screen bar="tokensbeat.com">
  <img src="/assets/img/web-tokensbeat-home.webp" width={1600} height={1000} loading="lazy" alt="…" />
</Screen>`,
    props: [
      { name: "bar", type: "string", required: true, desc: "What the address bar says." },
      { name: "children", type: "ReactNode", required: true, desc: "The picture; wrap it in `LoupeShot` for the loupe." },
    ],
    where: "The features' screenshots.",
  },
  {
    id: "stack",
    name: "Stack",
    group: "primitives",
    sources: ["src/components/bits.tsx"],
    exports: ["Stack"],
    import: `import { Stack } from "@/components/bits";`,
    summary: "A line of small hairline tags in mono, for what something is built with.",
    example: "live",
    usage: `<Stack items={["React 19", "TypeScript", "Vite 8", "Tailwind 4"]} />`,
    props: [{ name: "items", type: "string[]", required: true, desc: "The tags. Each is its own React key, so keep them unique." }],
    where: "Under each feature's story.",
  },
  {
    id: "barcode",
    name: "Barcode",
    group: "primitives",
    sources: ["src/components/bits.tsx"],
    exports: ["Barcode"],
    import: `import { Barcode } from "@/components/bits";`,
    summary: "An id as a barcode, drawn from its hex digits between guards, the id printed under it. Each id draws its own; it is not a code a scanner reads.",
    example: "live",
    usage: `<Barcode id={post.id} />
<Barcode id={post.id} label={false} /> {/* the bars alone */}`,
    props: [
      { name: "id", type: "string", required: true, desc: "Hex digits; dashes are dropped. A UUID works." },
      { name: "label", type: "boolean", default: "true", desc: "Print the id under the bars." },
    ],
    notes: [{ label: "Accessibility", text: "The bars are hidden from screen readers; the id is in the label and the `title`." }],
    where: "Each blog post in place of a date; the contents, bars only.",
  },
  {
    id: "refs",
    name: "Ref and SourceLink",
    group: "primitives",
    sources: ["src/components/bits.tsx"],
    exports: ["Ref", "SourceLink"],
    import: `import { Ref, SourceLink } from "@/components/bits";`,
    summary: "Sources for a post: `Ref` is a bracketed number in the text that links to `#ref-n`; `SourceLink` sets an address on its own line under a source, without its scheme.",
    example: "live",
    usage: `<p>… as Laplace showed.<Ref n={1} /></p>
…
<li id="ref-1">Laplace, Essai philosophique sur les probabilités.<SourceLink href="https://…" /></li>`,
    propsTitle: "Props",
    props: [
      { name: "n", type: "number", required: true, desc: "Ref: the source's number. The list item needs `id=\"ref-n\"`." },
      { name: "href", type: "string", required: true, desc: "SourceLink: the address; shown decoded, without http(s)://." },
    ],
    where: "The blog's posts.",
  },
  {
    id: "elsewhere",
    name: "Elsewhere",
    group: "primitives",
    sources: ["src/components/bits.tsx"],
    exports: ["Elsewhere"],
    import: `import { Elsewhere } from "@/components/bits";`,
    summary: "A figure for pictures that belong to someone else and are not rehosted: each named and linked to where it can be seen, in a dashed frame, with the caption under them.",
    example: "live",
    usage: `<Elsewhere pictures={[["Earthrise, Apollo 8", "https://…"]]}>
  The caption, as the figure would have it.
</Elsewhere>`,
    props: [
      { name: "pictures", type: "[name: string, href: string][]", required: true, desc: "Each picture's name and where it is." },
      { name: "children", type: "ReactNode", required: true, desc: "The figure's caption." },
    ],
    notes: [{ label: "Styles", text: "Its frame is styled only inside `.post__text` (the blog's column); this example sits in one. Lift the `.post__text .elsewhere` rules to use it elsewhere." }],
    where: "The blog's posts.",
  },
  {
    id: "tex",
    name: "Tex",
    group: "primitives",
    sources: ["src/components/Tex.tsx"],
    exports: ["Tex"],
    import: `import { Tex } from "@/components/Tex";`,
    summary: "LaTeX, set by KaTeX when the page is prerendered: readers get finished HTML with MathML beside it, and no KaTeX script. A mistake shows in red in place.",
    example: "live",
    usage: "<Tex>{String.raw`P(A \\mid B) = 80\\%`}</Tex>\n<Tex block>{String.raw`\\int_0^1 x^2\\,dx = \\tfrac{1}{3}`}</Tex>",
    props: [
      { name: "children", type: "string", required: true, desc: "The source. Write it with String.raw so backslashes stay." },
      { name: "block", type: "boolean", default: "false", desc: "On a line of its own (display mode)." },
    ],
    notes: [
      { label: "Styles", text: "The page must import `styles/tex.css` (KaTeX's stylesheet); its fonts load only where maths is used." },
      { label: "Cost", text: "Only on prerendered pages: on the client it reads back the HTML the server wrote. The dev server sets it in the browser instead." },
    ],
    where: "The blog's posts; this page.",
  },
  {
    id: "text-blocks",
    name: "Text blocks",
    group: "primitives",
    sources: [SITE_CSS],
    exports: [],
    summary: "Editorial patterns that are CSS classes, not components: the section label with its rule, the spec sheet, the lemma, the numbered list, the pull quote, numbered figure captions and the endmark.",
    example: "live",
    propsTitle: "Classes",
    props: [
      { name: ".sect-label", type: "h2 / h3", desc: "Mono caps over a strong hairline, a mincho word first. The rule draws in as it scrolls into view." },
      { name: ".spec", type: "dl", desc: "Two columns of dt/dd between hairlines: a spec sheet." },
      { name: ".lemma", type: "p > b", desc: "Italic display type, its label in mono caps on a line above." },
      { name: ".built", type: "ol", desc: "Numbered 01, 02… in mono, each item over a hairline." },
      { name: ".pull", type: "blockquote", desc: "A hanging pull quote, its `cite` in mono. Styled, not in use at the moment." },
      { name: ".figs", type: "any", desc: "Numbers every figcaption inside it: fig. 01 —, fig. 02 —…" },
      { name: ".endmark", type: "div.mono", desc: "The foot of a page: three links or notes across a strong rule." },
    ],
    usage: `<h3 className="sect-label"><span lang="ja">草</span> On GitHub</h3>
<dl className="spec"><dt>Role</dt><dd>Architect</dd></dl>
<p className="lemma"><b>Lemma 1.</b> A foundation other apps move into.</p>`,
  },

  // ------------------------------------------------------------ page
  {
    id: "runhead",
    see: { href: "#top", label: "The running head at the top of this page" },
    name: "Runhead",
    group: "page",
    sources: ["src/components/Runhead.tsx"],
    exports: ["Runhead"],
    import: `import { Runhead } from "@/components/Runhead";`,
    summary: "The running head: the mark and S1LIN, the label of the section under the reader's eye, the volume, and the 夜/紙 theme toggle. It is the bar at the top of this page.",
    example: "none",
    usage: `<Runhead label="部品 · UI components" home="/" />
…
<section className="spread" data-run="部品 · Foundations">…</section>`,
    props: [
      { name: "label", type: "string", default: "\"特集 · Architecture — nine lines, one proof\"", desc: "The label before any section is reached. Japanese and English parts are split on \" · \"." },
      { name: "home", type: "string", default: "\"#cover\"", desc: "Where the brand leads; off the issue, \"/\"." },
    ],
    notes: [
      { label: "Accessibility", text: "The label follows the nearest `[data-run]` element in the middle of the screen, without being announced (`aria-live=\"off\"`). The toggle is a real button with a label." },
      { label: "Phone", text: "Under 640px the volume is dropped and the label right-aligned and cut with an ellipsis." },
    ],
    where: "Every page.",
  },
  {
    id: "page-shell",
    name: "Page shell",
    group: "page",
    sources: ["src/entry-server.tsx", "vite.config.ts", "scripts/prerender.mjs"],
    exports: ["pages"],
    summary: "How a page of the site is put together, as this one is: an HTML shell under its own folder, an entry that hydrates, a spread on the grid, and a line in the prerender list so it reads without JavaScript.",
    example: "none",
    usage: `// ui/index.html: the head of life/index.html, its own title and description, and
<div id="root"></div><script type="module" src="/src/ui.tsx"></script>

// src/ui.tsx
const page = <StrictMode><UiPage /></StrictMode>;
if (root.hasChildNodes()) hydrateRoot(root, page); else createRoot(root).render(page);

// vite.config.ts: add here("ui/index.html") to rolldownOptions.input
// src/entry-server.tsx: "ui/index.html": () => renderToString(<StrictMode><UiPage /></StrictMode>)`,
    notes: [
      { label: "Accessibility", text: "Start the page with a skip link (`.skip`), then `Runhead`, then `<main>`." },
      { label: "Cost", text: "A prerendered page must render on the server: keep `window` and `document` inside effects, and anything that only the browser can draw behind `useHydrated()`." },
    ],
  },
  {
    id: "feature",
    see: { href: "/#tokensbeat", label: "Feature 01 on the front page" },
    name: "Feature",
    group: "page",
    sources: ["src/components/Feature.tsx"],
    exports: ["Feature"],
    import: `import { Feature, type FeatureProps } from "@/components/Feature";`,
    summary: "One line of the issue's feature as a spread: an outline numeral, the title and roundel, a big kanji, a spec sheet held on one side; the lemma, lede, story, numbered list, stack and figures on the other.",
    example: "none",
    usage: `<Feature id="tokensbeat" num="01" letter="T" title="Tokensbeat" run="特集 T · Tokensbeat"
  kanji={["基", "基盤", "foundation"]} spec={[["Role", "Architect"]]}
  lede={…} body={…} figs={…} folio="08" />`,
    props: [
      { name: "id", type: "string", required: true, desc: "The section's anchor." },
      { name: "num", type: "string", required: true, desc: "The outline numeral, \"01\"; also numbers the lemma." },
      { name: "letter", type: "string", required: true, desc: "The roundel's letter." },
      { name: "title", type: "string", required: true, desc: "The title." },
      { name: "run", type: "string", required: true, desc: "The running head's label for this spread." },
      { name: "lemma", type: "string", desc: "What the line proves toward the foreword's theorem." },
      { name: "kanji", type: "[string, string, string]", required: true, desc: "The big kanji, its word, an English gloss." },
      { name: "spec", type: "[string, ReactNode][]", required: true, desc: "The spec sheet's rows." },
      { name: "lede", type: "ReactNode", required: true, desc: "The opening paragraph, with a drop cap." },
      { name: "body", type: "ReactNode", required: true, desc: "The story." },
      { name: "built", type: "ReactNode[]", desc: "A numbered list of what was built." },
      { name: "stack", type: "string[]", desc: "Tags, as `Stack`." },
      { name: "figs", type: "ReactNode", required: true, desc: "Figures; their captions are numbered." },
      { name: "folio", type: "string", required: true, desc: "The page number." },
      { name: "flip", type: "boolean", default: "false", desc: "Mirror the spread: the head on the right." },
    ],
    notes: [{ label: "Phone", text: "Under 900px the head stops being sticky and the body follows it in one column." }],
    where: "The five features of the issue (Features.tsx). See one at /#tokensbeat.",
  },

  // ------------------------------------------------------------ effects
  {
    id: "glitch-title",
    name: "GlitchTitle",
    group: "effects",
    sources: ["src/components/effects.tsx"],
    exports: ["GlitchTitle"],
    import: `import { GlitchTitle } from "@/components/effects";`,
    summary: "A section title in ink that tears into RGB-split slices for a moment, in colour, as it comes into view and again under the pointer, then settles. Never on a timer.",
    example: "live",
    usage: `<GlitchTitle className="display">5,000 hours.</GlitchTitle>`,
    props: [
      { name: "children", type: "ReactNode", required: true, desc: "The title's words; the patch sets them into the canvas itself." },
      { name: "className", type: "string", desc: "Added to `glitch`; `display` for an opener." },
      { name: "style", type: "CSSProperties", desc: "Inline style for the heading." },
    ],
    notes: [
      { label: "Accessibility", text: "Always an `<h2>`; the live words stay in the DOM, and only hide while a burst runs." },
      { label: "Cost", text: "One WebGL context, made within 400px of the viewport and handed back when it leaves." },
      { label: "Reduced motion", text: "The burst does not run." },
    ],
    where: "The section openers and Find the editor.",
  },
  {
    id: "loupe-shot",
    name: "LoupeShot",
    group: "effects",
    sources: ["src/components/effects.tsx"],
    exports: ["LoupeShot"],
    import: `import { LoupeShot } from "@/components/effects";`,
    summary: "A printer's loupe over a screenshot, in ink: a ring with ticks that follows the pointer and magnifies 2.2×. Readers with a mouse only.",
    example: "live",
    usage: `<Screen bar="workgo.ai">
  <LoupeShot><img src="…" width={1600} height={1000} alt="…" /></LoupeShot>
</Screen>`,
    props: [{ name: "children", type: "ReactNode", required: true, desc: "The picture." }],
    notes: [
      { label: "Phone", text: "Off on touch screens (`hover: hover` and `pointer: fine` only): the picture shows as it is." },
      { label: "Cost", text: "Canvas UI Magnify: one WebGL context within 300px of the viewport." },
    ],
    where: "The features' screenshots.",
  },
  {
    id: "ripple-photo",
    name: "RipplePhoto",
    group: "effects",
    sources: ["src/components/effects.tsx"],
    exports: ["RipplePhoto"],
    import: `import { RipplePhoto } from "@/components/effects";`,
    summary: "A photograph under water: rings follow the cursor and bend the picture below, with a little colour split and shine on the crests.",
    example: "live",
    usage: `<RipplePhoto><img src="/assets/img/cs-night.webp" width={1800} height={1012} alt="…" /></RipplePhoto>`,
    props: [
      { name: "children", type: "ReactNode", required: true, desc: "The picture." },
      { name: "className", type: "string", desc: "On the wrapper." },
    ],
    notes: [
      { label: "Cost", text: "Canvas UI Ripple: one WebGL context within 400px of the viewport." },
      { label: "Reduced motion", text: "No rings." },
      { label: "Reuse", text: "Not on any page of the site at the moment (the city plates use ErasePhoto); kept for reuse." },
    ],
  },
  {
    id: "erase-photo",
    name: "ErasePhoto",
    group: "effects",
    sources: ["src/components/effects.tsx"],
    exports: ["ErasePhoto"],
    import: `import { ErasePhoto } from "@/components/effects";`,
    summary: "A game screenshot over the same frame re-rendered as a photograph. The pointer rubs the game away with a soft round brush: a mouse as it passes, a finger as it drags sideways. What is rubbed out stays, and is redrawn if the figure changes size.",
    example: "live",
    usage: `<ErasePhoto
  game={{ src: "/assets/img/cs-stadium.webp", alt: "…" }}
  photo={{ src: "/assets/img/cs-stadium-snow.webp", alt: "…" }}
  w={1400} h={788} />`,
    props: [
      { name: "game", type: "{ src: string; alt: string }", required: true, desc: "The picture on top, the one rubbed away." },
      { name: "photo", type: "{ src: string; alt: string }", required: true, desc: "The picture underneath." },
      { name: "w", type: "number", required: true, desc: "Width of both pictures; with `h`, the frame's aspect ratio." },
      { name: "h", type: "number", required: true, desc: "Height of both pictures." },
    ],
    notes: [
      { label: "Phone", text: "A vertical drag still scrolls the page (`touch-action: pan-y`); a sideways one rubs." },
      { label: "Cost", text: "A plain 2D canvas, no WebGL. Without JavaScript the game shows." },
    ],
    where: "The Cities photo essay.",
  },
  {
    id: "frost-pane",
    name: "FrostPane",
    group: "effects",
    sources: ["src/components/effects.tsx"],
    exports: ["FrostPane"],
    import: `import { FrostPane } from "@/components/effects";`,
    summary: "Frost on the glass in front of the whole page, like a Montreal window in January: grey rime that grows in from the edges, melts under the cursor and freezes over again.",
    example: "on-click",
    usage: `<main>…</main>
<FrostPane /> {/* once per page, after main */}`,
    notes: [
      { label: "Accessibility", text: "A fixed canvas portalled into `<body>`, `aria-hidden`, and it takes no clicks." },
      { label: "Phone", text: "Keeps closer to the edges under 760px (`reach` 0.3, else 0.4)." },
      { label: "Cost", text: "One WebGL context for the page's life; the loop sleeps while the cursor rests." },
      { label: "Reduced motion", text: "No growth: the frost is simply there." },
    ],
    where: "The issue's front page.",
  },
  {
    id: "sand-pane",
    see: { href: "/#contents", label: "The front page: scroll and watch the foot of the screen" },
    name: "SandPane",
    group: "effects",
    sources: ["src/components/effects.tsx"],
    exports: ["SandPane"],
    import: `import { SandPane } from "@/components/effects";`,
    summary: "The whole page as sand below the last fifth of the screen: whatever scrolls up from the bottom edge arrives as drifting grains and settles into the page at 80% of the way down.",
    example: "none",
    usage: `<main>…</main>
<SandPane />`,
    notes: [
      { label: "Cost", text: "It reads the layout of `<main>` once (src/lib/page-paint.ts) and paints the view from that as it scrolls, again when the size, fonts or theme change. One WebGL context. Too heavy to run twice on one page, so see it on the front page." },
      { label: "Reduced motion", text: "Not drawn at all." },
    ],
    where: "The issue's front page.",
  },
  {
    id: "canvas-ui",
    name: "Canvas UI",
    group: "effects",
    sources: ["src/components/canvasui/"],
    exports: ["Ripple", "Magnify", "Glitch", "Frost", "ParticleScroll", "createRipple", "createMagnify", "createGlitch", "createFrost", "createParticleScroll"],
    import: `import { Ripple, type RippleOptions } from "@/components/canvasui/Ripple";`,
    summary: "The five effects from Canvas UI (canvasui.dev, MIT + Commons Clause), each a React component and a `create*` function. Patched here to paint their `<img>` into WebGL instead of Chrome's experimental HTML-in-Canvas, so they run in any WebGL2 browser.",
    example: "none",
    propsTitle: "Components",
    props: [
      { name: "Ripple", type: "RippleOptions", desc: "amplitude, wavelength, rings, refraction, dispersion, shine, trigger, interval. Patch: scripts/patch-canvasui.py." },
      { name: "Magnify", type: "MagnifyOptions", desc: "size, zoom, color, follow, hud and its parts (ring, ticks, crosshair…), aberration, haze, ripples. Patch: scripts/patch-canvasui.py." },
      { name: "Glitch", type: "GlitchOptions", desc: "intensity, interval, duration, slices, shift, rgbShift, blocks, noise; `burst()` on the instance. Patch: scripts/patch-glitch.py." },
      { name: "Frost", type: "FrostOptions", desc: "tints, opacity, melt and refreeze, reach (added by the patch), and twenty more. Patch: scripts/patch-frost.py." },
      { name: "ParticleScroll", type: "ParticleScrollOptions", desc: "point, band, density, size, spread, gravity, drift, settle, smoothing; painted mode added by scripts/patch-particle-scroll.py." },
    ],
    usage: `npx shadcn@latest add @canvas-ui/ripple-react
python3 scripts/patch-canvasui.py src/components/canvasui/Ripple.tsx src/components/canvasui/Ripple.tsx`,
    notes: [
      { label: "Cost", text: "Every effect hands its WebGL context back when it unmounts (`WEBGL_lose_context`): past Chrome's limit of about sixteen live contexts the oldest is killed. Mount them near the viewport (`useNear`), as the wrappers above do." },
      { label: "Reuse", text: "Use the wrappers in effects.tsx where they fit; reach for these only for a new effect, and re-apply the patch after reinstalling one." },
    ],
  },

  // ------------------------------------------------------------ pictures and charts
  {
    id: "ascii-art",
    name: "AsciiArt",
    group: "media",
    sources: ["src/components/AsciiArt.tsx"],
    exports: ["AsciiArt"],
    import: `import { AsciiArt } from "@/components/AsciiArt";
import * as typewriter from "ascii.rest/pieces/typewriter";`,
    summary: "An ascii.rest piece (MIT, by @bas3line). Text pieces draw into a `<pre>` that holds a still frame until they start; pieces with a palette switch to a canvas once the page is live.",
    example: "live",
    usage: `<AsciiArt
  piece={typewriter}
  options={{ prefix: "parts: ", phrases: ["roundels.", "barcodes.", "registration marks."] }}
  label="A typewriter typing the names of parts"
  still="parts: roundels.▌" />`,
    props: [
      { name: "piece", type: "Piece", required: true, desc: "A piece module from ascii.rest/pieces/*, or one made with `banner()` or the kit." },
      { name: "options", type: "MountOptions", desc: "The piece's options, and fps or motion. Compared by value, so an inline object does not restart it." },
      { name: "label", type: "string", required: true, desc: "What the picture shows, for screen readers." },
      { name: "still", type: "string", default: "\"\"", desc: "The frame shown before it starts and without JavaScript; capture it from the piece so nothing jumps." },
      { name: "className", type: "string", desc: "Added to `ascii`." },
    ],
    notes: [
      { label: "Accessibility", text: "`role=\"img\"` with the label; the characters themselves are not read out." },
      { label: "Reduced motion", text: "ascii.rest shows the still moment the piece names for it." },
      { label: "Network", text: "Line and block characters come in a small font from ascii.rest's own site." },
    ],
    where: "The cover banner, the typewriter, the skyline, the departures board, the closing plates.",
  },
  {
    id: "github-heatmap",
    name: "GitHubHeatmap",
    group: "media",
    sources: ["src/components/GitHubHeatmap.tsx"],
    exports: ["GitHubHeatmap"],
    import: `import { GitHubHeatmap } from "@/components/GitHubHeatmap";`,
    summary: "A year of GitHub contributions, a square a day in GitHub's own greens. The line under it reads out the day under the pointer, or the day last tapped.",
    example: "live",
    usage: `<GitHubHeatmap />`,
    notes: [
      { label: "Data", text: "Drawn at build time from src/content/github.json, which scripts/github-data.py fills from the public profile. The reader's browser never asks GitHub." },
      { label: "Accessibility", text: "The drawing has a title and a two-sentence summary (busiest day, longest run); each square has its own title." },
      { label: "Phone", text: "Below 480px of room the year scrolls in its own box, opened on the latest weeks." },
      { label: "Dark mode", text: "GitHub's dark scale at night: a colour exception the owner asked for." },
      { label: "Reuse", text: "It takes no props: the data and the grid are in lib/calendar.ts. Use it once per page (its title ids are fixed)." },
    ],
    where: "Under the contents on the front page.",
  },
  {
    id: "metro2line",
    name: "Metro2Line",
    group: "media",
    sources: ["src/components/Metro2Line.tsx", "src/hooks/useMetro2Line.ts"],
    exports: ["MetroBar", "MetroMap", "MetroCaption", "useMetro2Line"],
    import: `import { MetroBar, MetroCaption, MetroMap } from "@/components/Metro2Line";
import { useMetro2Line } from "@/hooks/useMetro2Line";`,
    summary: "The metro player as three parts for a layout to place, around one hook: the control bar (ride a city or guess it), the map on a canvas, and the caption with the OpenStreetMap credit.",
    example: "on-click",
    usage: `const root = useRef<HTMLElement>(null);
const canvas = useRef<HTMLCanvasElement>(null);
const m = useMetro2Line({ root, canvas });

<figure ref={root}>
  <MetroBar m={m} />
  <MetroMap m={m} canvas={canvas} />
  <MetroCaption m={m} lead="" />
</figure>`,
    propsTitle: "Parts",
    props: [
      { name: "useMetro2Line", type: "{ root, canvas, insets? }", required: true, desc: "The player's state: `root` is the element around it, `canvas` its map; `insets` keeps the network clear of what sits on the map." },
      { name: "m", type: "Metro2Line", required: true, desc: "What the hook returns, passed to each part." },
      { name: "canvas", type: "RefObject<HTMLCanvasElement | null>", required: true, desc: "MetroMap: the same ref given to the hook." },
      { name: "className", type: "string", desc: "MetroMap: added to `m2l-map`, which needs a height." },
      { name: "children", type: "ReactNode", desc: "MetroMap: laid over the map." },
      { name: "lead", type: "string", required: true, desc: "MetroCaption: words before the description." },
    ],
    notes: [
      { label: "Network", text: "Each city is one JSON file from this site (`/data/metro/<city>.json`), fetched when the player comes within 300px of the viewport. The \"Make your own map\" link goes to Aha; it is only a link." },
      { label: "Dark mode", text: "Drawn in the theme's ink on `--paper-2`; the lines keep their real colours (an exception the owner asked for)." },
      { label: "Cost", text: "2D canvases, no WebGL." },
    ],
    where: "The cover's first machine.",
  },
  {
    id: "token-skyline",
    see: { href: "/#contents", label: "Under the foreword on the front page" },
    name: "TokenSkyline",
    group: "media",
    sources: ["src/components/TokenSkyline.tsx"],
    exports: ["TokenSkyline"],
    import: `import { TokenSkyline } from "@/components/TokenSkyline";`,
    summary: "The editor's tokens with coding agents: a total that rolls up like an odometer, its value at list prices, the weeks drawn by their mix of models, a by-model chart that doubles as the key, and a flow from agent to kind of token.",
    example: "none",
    usage: `<TokenSkyline />`,
    notes: [
      { label: "Data", text: "src/content/tokens.json, written by scripts/token-data.py from cc-switch's usage databases; only daily totals reach the site." },
      { label: "Phone", text: "Its month names are counter-scaled with `useScale`, so they stay 9px at any width; the flow's labels are HTML beside the drawing." },
      { label: "Reuse", text: "Built for this one data set, in colour by the owner's choice. See it under the foreword on the front page." },
    ],
    where: "Under the foreword on the front page.",
  },
  {
    id: "workshop-slider",
    see: { href: "/#workshop", label: "The workshop on the front page" },
    name: "WorkshopSlider",
    group: "media",
    sources: ["src/components/WorkshopSlider.tsx"],
    exports: ["WorkshopSlider"],
    import: `import { WorkshopSlider } from "@/components/WorkshopSlider";`,
    summary: "Two playable builds as a row to swipe: scroll-snap, so touch needs no script; a mouse drags it, the arrows and the keys step it, and the next slide peeks in from the right. Each slide runs a small live picture (a metro network drawn line by line, a glider gun) only while it is on screen.",
    example: "none",
    usage: `<WorkshopSlider />`,
    notes: [
      { label: "Accessibility", text: "A carousel by the book: `aria-roledescription` on the row and each slide, a labelled group per slide, dots as tabs, arrow keys on the focused track." },
      { label: "Reduced motion", text: "Steps jump rather than glide; the pictures show one still frame." },
      { label: "Reuse", text: "Its slides are written inside the file. To reuse the pattern, lift `SLIDES` into a prop; the `.ws-slider` styles are general. See it at /#workshop." },
    ],
    where: "The workshop on the front page.",
  },

  // ------------------------------------------------------------ social
  {
    id: "icon",
    name: "Icon",
    group: "social",
    sources: ["src/components/social/common.tsx"],
    exports: ["Icon"],
    import: `import { Icon } from "@/components/social/common";`,
    summary: "The social parts' line icons, drawn on a 24-unit grid in `currentColor`: heart, repost, bubble, close, caret, enter; and two filled marks, Aha's spark and the model chip's half disc.",
    example: "live",
    usage: `<Icon name="heart" />
<Icon name="sparkle" size={20} />`,
    props: [
      { name: "name", type: "\"heart\" | \"repost\" | \"bubble\" | \"close\" | \"caret\" | \"enter\" | \"sparkle\" | \"half\"", required: true, desc: "Which icon." },
      { name: "size", type: "number", default: "16", desc: "Width and height in CSS pixels." },
    ],
    notes: [{ label: "Accessibility", text: "Always `aria-hidden`: give the button around it a label or words." }],
  },
  {
    id: "avatar",
    name: "Avatar",
    group: "social",
    sources: ["src/components/social/common.tsx"],
    exports: ["Avatar"],
    import: `import { Avatar } from "@/components/social/common";`,
    summary: "A commenter's picture, or their initial on a disc of ink when there is none.",
    example: "live",
    usage: `<Avatar name={author.name} src={author.avatar} />`,
    props: [
      { name: "name", type: "string", required: true, desc: "The name; its first character is the initial." },
      { name: "src", type: "string", desc: "The picture's address (https, from the server). Loaded lazily, with no referrer." },
    ],
    notes: [{ label: "Accessibility", text: "Decorative: the name is always printed beside it." }],
  },
  {
    id: "reactions",
    name: "Reactions",
    group: "social",
    sources: ["src/components/social/Reactions.tsx"],
    exports: ["Reactions"],
    import: `import { Reactions, type ReactionState } from "@/components/social/Reactions";
import { SOCIAL_COPY } from "@/components/social/copy";`,
    summary: "Like and repost with their counts, as on X, and the number of comments. A press flips at once and is undone if the call fails; signed out, a press opens the sign-in window instead.",
    example: "specimen",
    usage: `const [state, setState] = useState<ReactionState>({ likes: 0, reposts: 0, liked: false, reposted: false });
<Reactions target="site:s1lin:blog/my-post" state={state} onState={setState} c={SOCIAL_COPY.en} comments={3} />`,
    props: [
      { name: "target", type: "string", required: true, desc: "What is reacted to: `site:s1lin:<path>` for a page, `shape:<id>` for a shape." },
      { name: "state", type: "ReactionState", required: true, desc: "{ likes, reposts, liked, reposted }; the parent holds it." },
      { name: "onState", type: "(s: ReactionState) => void", required: true, desc: "Called with the new state, and again with the old one if the call fails." },
      { name: "c", type: "SocialCopy", required: true, desc: "The words, `SOCIAL_COPY[lang]`." },
      { name: "comments", type: "number", desc: "Show a comment count before the buttons." },
    ],
    notes: [
      { label: "Network", text: "POSTs a like or repost to Aha Social with the reader's token. This page shows a specimen: the same markup and classes, flipping locally." },
      { label: "Accessibility", text: "Toggle buttons with `aria-pressed` and a spoken label (\"Repost: shows this on your Aha page\")." },
    ],
  },
  {
    id: "comments",
    name: "Comments",
    group: "social",
    sources: ["src/components/social/Comments.tsx"],
    exports: ["Comments"],
    import: `import { Comments } from "@/components/social/Comments";`,
    summary: "A whole thread under a page: its title and reactions, who reposted it, the composer, then the comments with their likes and one level of replies, and Load more.",
    example: "specimen",
    usage: `<Comments target="site:s1lin:blog/my-post" lang="en" />
<Comments target="site:s1lin:editor" lang="en" title="Letters to the editor" placeholder="Write to the editor…" />`,
    props: [
      { name: "target", type: "string", required: true, desc: "The thread: `site:s1lin:<path>`." },
      { name: "lang", type: "\"en\" | \"zh\" | \"ja\"", required: true, desc: "The language of its words and dates." },
      { name: "title", type: "string", default: "\"Comments\"", desc: "The thread's heading, in the page's own words." },
      { name: "placeholder", type: "string", desc: "The empty composer's prompt." },
    ],
    notes: [
      { label: "Network", text: "GETs the thread from Aha when it mounts, and again on sign-in or after a post, so prerendered pages carry no thread. This page shows a specimen built from mock data." },
      { label: "Accessibility", text: "Comment text is shown as typed, never as HTML (`white-space: pre-wrap`). Every comment and shape is screened by Qwen on the server first." },
      { label: "Dark mode", text: "Its primaries lift at night so the blue focus ring and red marks stay readable." },
    ],
    where: "Under each blog post, on Life, and as Letters to the editor in the colophon.",
  },
  {
    id: "composer",
    name: "Composer",
    group: "social",
    sources: ["src/components/social/Composer.tsx"],
    exports: ["Composer"],
    import: `import { Composer } from "@/components/social/Composer";`,
    summary: "One box, like a chat composer: the draft, and a toolbar inside it with the model chip, Revise with Aha and Post (⌘/Ctrl ↵). Revising opens a short thread with Aha above the draft; nothing is posted until Post.",
    example: "specimen",
    usage: `<Composer target={target} c={SOCIAL_COPY.en} lang="en" placeholder="Add a comment." onDone={reload} />`,
    props: [
      { name: "target", type: "string", required: true, desc: "The thread it posts to." },
      { name: "parentId", type: "string", desc: "Reply to this comment." },
      { name: "c", type: "SocialCopy", required: true, desc: "The words." },
      { name: "lang", type: "\"en\" | \"zh\" | \"ja\"", required: true, desc: "For the character count." },
      { name: "placeholder", type: "string", required: true, desc: "The prompt when signed in." },
      { name: "onDone", type: "() => void", required: true, desc: "After a post: reload the thread." },
      { name: "onCancel", type: "() => void", desc: "Show Cancel (replies)." },
    ],
    notes: [
      { label: "Network", text: "Reads the reader's models, asks Aha to revise on their own key, and posts the comment. Signed out it shows the sign-in buttons in its toolbar. This page shows a specimen whose buttons do nothing." },
      { label: "Phone", text: "Under 560px the toolbar wraps: the chip and Revise on one line, the count and Post on the next." },
    ],
  },
  {
    id: "sign-in-bar",
    name: "SignInBar",
    group: "social",
    sources: ["src/components/social/common.tsx"],
    exports: ["SignInBar"],
    import: `import { SignInBar } from "@/components/social/common";`,
    summary: "\"Sign in with TokensBeat\": a link to make an account and a button that opens Aha's sign-in window; signed in, the name and Sign out.",
    example: "specimen",
    usage: `<SignInBar c={SOCIAL_COPY.en} note="Sign in to publish your shape." />`,
    props: [
      { name: "c", type: "SocialCopy", required: true, desc: "The words." },
      { name: "note", type: "ReactNode", desc: "Replaces the prompt above the buttons." },
    ],
    notes: [{ label: "Network", text: "Fetches the sign-up link from Aha's public config; the window posts the session back, accepted from Aha's origin only. This page shows a specimen whose buttons do nothing." }],
  },
  {
    id: "shape-gallery",
    name: "ShapeGallery",
    group: "social",
    sources: ["src/components/social/ShapeGallery.tsx"],
    exports: ["ShapeGallery"],
    import: `import { ShapeGallery } from "@/components/social/ShapeGallery";`,
    summary: "The shapes readers published from Life's launch pad: each a small black board running a few generations a second, with its name, note, author and reactions. A click loads one into the launch pad.",
    example: "specimen",
    usage: `<ShapeGallery lang="en" />`,
    props: [{ name: "lang", type: "\"en\" | \"zh\" | \"ja\"", required: true, desc: "The language of its words." }],
    notes: [
      { label: "Network", text: "GETs the shapes from Aha. This page shows one card built from a mock shape." },
      { label: "Cost", text: "2D canvases; each board runs only while it is on screen and restarts after 160 generations." },
    ],
    where: "Life.",
  },
  {
    id: "shape-submit",
    see: { href: "/life/", label: "The launch pad on /life/" },
    name: "ShapeSubmit",
    group: "social",
    sources: ["src/components/social/ShapeSubmit.tsx"],
    exports: ["ShapeSubmit"],
    import: `import { ShapeSubmit } from "@/components/social/ShapeSubmit";`,
    summary: "\"Publish my shape\" in Life's launch pad: the live cells cropped to their box (64 × 64 at most), previewed, given a name and a note, and sent to be screened.",
    example: "none",
    usage: `<ShapeSubmit grid={board} lang="en" />`,
    props: [
      { name: "grid", type: "Grid", required: true, desc: "The board as it is; cropped when the form opens and while it stays open." },
      { name: "lang", type: "\"en\" | \"zh\" | \"ja\"", required: true, desc: "The language of its words." },
    ],
    notes: [{ label: "Network", text: "POSTs the shape to Aha for screening. Not shown here: it is a form for posting, and it lives in the launch pad on /life/." }],
    where: "Life's launch pad.",
  },

  // ------------------------------------------------------------ life
  {
    id: "board",
    name: "Board",
    group: "life",
    sources: ["src/components/life/Board.tsx"],
    exports: ["Board"],
    import: `import { Board } from "@/components/life/Board";
import { ARC } from "@/lib/life/palette";`,
    summary: "A grid drawn on black, cell by cell, in the ARC palette: living cells in one colour or coloured by age, a grid line between cells from 4px up, and wrong cells in red against a ghost.",
    example: "live",
    usage: `<Board grid={glider} color={ARC.blue} cell={16} label="A glider" />`,
    props: [
      { name: "grid", type: "Grid", required: true, desc: "{ w, h, cells: Uint8Array }, row-major, 1 alive." },
      { name: "color", type: "string", required: true, desc: "The living cells' colour, unless `ages` is given." },
      { name: "cell", type: "number", required: true, desc: "A cell's size in canvas pixels." },
      { name: "ages", type: "Uint16Array", desc: "Colour each cell by age: new yellow, then green, blue, old magenta." },
      { name: "onPointer", type: "(x, y, e) => void", desc: "Makes it drawable: called with the cell under a press or drag." },
      { name: "ghost", type: "Grid | null", desc: "The expected grid; cells that differ show red." },
      { name: "label", type: "string", required: true, desc: "What the board shows, for screen readers." },
      { name: "className", type: "string", desc: "Added to `life__board`." },
    ],
    notes: [
      { label: "Styles", text: "`.life__board` is styled in styles/life.css (pixelated, black); this page gives it the same few rules." },
      { label: "Dark mode", text: "Black in both themes, as ARC boards are." },
    ],
    where: "Life: the rules, puzzles, the playground; shape previews.",
  },
  {
    id: "thumb",
    name: "Thumb",
    group: "life",
    sources: ["src/components/life/Thumb.tsx"],
    exports: ["Thumb"],
    import: `import { Thumb } from "@/components/life/Thumb";`,
    summary: "A creature drawn small on black, padded by a cell, fitting a box.",
    example: "live",
    usage: `<Thumb art={[".#.", "..#", "###"]} />`,
    props: [
      { name: "art", type: "string[]", required: true, desc: "Rows of \".\" and \"#\", as in lib/life/patterns.ts." },
      { name: "box", type: "number", default: "84", desc: "The box it fits, in canvas pixels." },
    ],
    where: "Life's table of creatures and the launch pad's stamps.",
  },
  {
    id: "rich",
    name: "Rich",
    group: "life",
    sources: ["src/components/life/Rich.tsx"],
    exports: ["Rich"],
    import: `import { Rich } from "@/components/life/Rich";`,
    summary: "Copy with a little inline markup, for words kept in data files: **bold**, *italic* and [text](url). Nothing else is read as markup.",
    example: "live",
    usage: `<Rich text="Conway's **Game of Life**, *B3/S23*: [play it](/life/)." />`,
    props: [{ name: "text", type: "string", required: true, desc: "The copy." }],
    where: "Life's copy in three languages.",
  },
  {
    id: "lang",
    see: { href: "/life/", label: "Life, in three languages" },
    name: "LangProvider",
    group: "life",
    sources: ["src/components/life/LangProvider.tsx", "src/components/life/lang.ts"],
    exports: ["LangProvider", "useLang", "useCopy"],
    import: `import { LangProvider } from "@/components/life/LangProvider";
import { useLang, useCopy } from "@/components/life/lang";`,
    summary: "Life's language, English, Chinese or Japanese: from `?lang=`, then the saved choice, then the browser's. It keeps `<html lang>` and the saved choice in step; `useLang()` gives the language and a setter, `useCopy()` the words.",
    example: "none",
    usage: `<LangProvider><Page /></LangProvider>
…
const { lang, setLang, copy } = useLang();`,
    props: [{ name: "children", type: "ReactNode", required: true, desc: "The page." }],
    notes: [{ label: "Reuse", text: "Not shown here: it sets the whole page's `<html lang>`. Its copy is Life's (components/life/copy.ts)." }],
    where: "Life.",
  },

  // ------------------------------------------------------------ hooks
  {
    id: "hooks",
    name: "Hooks and cn",
    group: "hooks",
    sources: ["src/hooks/", "src/lib/utils.ts"],
    exports: ["useDark", "useMedia", "useNear", "useHydrated", "useScale", "cn"],
    import: `import { useNear } from "@/hooks/useNear";
import { cn } from "@/lib/utils";`,
    summary: "Six small helpers. Each hook answers false (or 1) on the server and on the first client render, so prerendered HTML and hydration always agree; the real answer comes a moment later.",
    example: "live",
    propsTitle: "Signatures",
    props: [
      { name: "useDark", type: "() => boolean", desc: "True on night paper: `<html data-theme>`, else the system's scheme." },
      { name: "useMedia", type: "(query: string) => boolean", desc: "A media query's answer, kept current." },
      { name: "useNear", type: "(ref, margin = \"400px\") => boolean", desc: "True while the element is within `margin` of the viewport. Mount heavy things on it." },
      { name: "useHydrated", type: "() => boolean", desc: "False in the prerendered HTML and while hydrating, true after: for output only a browser should make." },
      { name: "useScale", type: "(ref, width: number) => number", desc: "CSS pixels per unit of a drawing `width` units wide, for words that must hold their size as an SVG scales." },
      { name: "cn", type: "(...inputs: ClassValue[]) => string", desc: "clsx and tailwind-merge: join classes, the last Tailwind utility wins." },
    ],
    usage: `const ref = useRef<HTMLDivElement>(null);
const near = useNear(ref, "300px");
return <div ref={ref} className={cn("plate", near && "is-live")}>{near ? <Heavy /> : <Still />}</div>;`,
  },
];

/** The site's own sections and pages: each written for one place, listed here for completeness. */
export const LISTED: Listed[] = [
  { name: "Cover", sources: ["src/components/Cover.tsx"], exports: ["Cover"], where: "/#cover", why: "The masthead, the two machines and the cover lines of this issue." },
  { name: "BrickMachine", sources: ["src/components/BrickLocator.tsx"], exports: ["BrickMachine"], where: "/#cover", why: "Brick Locator's sample, stepped through; its data is the tool's own." },
  { name: "Contents", sources: ["src/components/Contents.tsx"], exports: ["Contents"], where: "/#contents", why: "The contents, the foreword and the charts under them." },
  { name: "FeatureOpener", sources: ["src/components/FeatureOpener.tsx"], exports: ["FeatureOpener"], where: "/#feature", why: "The route map and timetables of one career, drawn for it." },
  { name: "Features", sources: ["src/components/Features.tsx"], exports: ["Features"], where: "/#tokensbeat", why: "The five features' words and figures, set in Feature." },
  { name: "TokensbeatSection", sources: ["src/components/TokensbeatFigures.tsx"], exports: ["TokensbeatSection"], where: "/#tokensbeat", why: "The platform drawn as a building section." },
  { name: "HiRainFigures", sources: ["src/components/HiRainFigures.tsx"], exports: ["HiRainFigures"], where: "/#hirain", why: "The three-points-to-five schematic." },
  { name: "Cities", sources: ["src/components/Cities.tsx"], exports: ["Cities"], where: "/#cities", why: "The photo essay, on black stock." },
  { name: "Workshop", sources: ["src/components/Workshop.tsx"], exports: ["Workshop"], where: "/#workshop", why: "The workshop's bench of builds." },
  { name: "Departures", sources: ["src/components/Departures.tsx"], exports: ["Departures"], where: "/#departures", why: "The split-flap board in airport colours, and the ledger." },
  { name: "Colophon", sources: ["src/components/Colophon.tsx"], exports: ["Colophon"], where: "/#colophon", why: "The colophon, Find the editor, the letters and the closing plates." },
  { name: "BlogPage", sources: ["src/components/Blog.tsx"], exports: ["BlogPage"], where: "/blog/", why: "The blog's index and its posts." },
  { name: "LifePage", sources: ["src/components/Life.tsx"], exports: ["LifePage"], where: "/life/", why: "Life: rules, puzzles, playground, study." },
  { name: "Puzzle", sources: ["src/components/life/Puzzle.tsx"], exports: ["Puzzle"], where: "/life/", why: "Life's ARC-style puzzles, on its levels." },
  { name: "Playground", sources: ["src/components/life/Playground.tsx"], exports: ["Playground"], where: "/life/", why: "Life's 160 × 135 launch pad." },
];
