/*
 * The inventory behind /ui/, as plain data: the library's items, documented in
 * full (summary, live example, props, notes), and the site's own parts, listed
 * briefly at the end. What each item installs (its files, its npm packages,
 * the items it brings with it) is not repeated here: the page reads it from
 * registry.json, the registry itself. No JSX and no imports, so
 * test/uidocs.test.ts can read this under `node --test` and check it against
 * registry.json and the source: every item is documented, every export of
 * src/ui/ is named, every prop is in its file, and every exported component in
 * src/components appears in the list of site parts.
 */

export type GroupId = "start" | "parts" | "hooks";

export interface Group {
  id: GroupId;
  name: string;
  blurb: string;
}

export const GROUPS: Group[] = [
  {
    id: "start",
    name: "Getting started",
    blurb: "From an empty app to the first part, then how the parts take your colours, your night and your stylesheet.",
  },
  {
    id: "parts",
    name: "Parts",
    blurb: "The parts the issue is set with, each a component and its own stylesheet, drawn in the tokens. Each brings the tokens and cn with it.",
  },
  {
    id: "hooks",
    name: "Hooks and cn",
    blurb: "Small helpers the parts share. Each hook answers false (or 1) on the server and on the first render in the browser, so server HTML and hydration agree; the real answer comes a moment later.",
  },
];

/** "live": an example on the page (examples.tsx); "guide": steps written out (guides.tsx); "none": neither. */
export type ExampleKind = "live" | "guide" | "none";

export interface PropDoc {
  name: string;
  type: string;
  /** Shown in the Default column; "—" when it is required. */
  default?: string;
  required?: boolean;
  desc: string;
}

export interface Note {
  label: "Accessibility" | "Reduced motion" | "Phone" | "Dark mode" | "Cost" | "Network" | "Styles" | "Server";
  text: string;
}

export interface Entry {
  /** The anchor; the item's name, when it documents one. */
  id: string;
  name: string;
  group: GroupId;
  /** The registry item (in registry.json) this entry documents. */
  item?: string;
  /** Names the item exports; the test checks each is exported from the item's files. */
  exports: string[];
  summary: string;
  example: ExampleKind;
  usage?: string;
  /** "Props" by default; hooks and tokens have other headings. */
  propsTitle?: string;
  props?: PropDoc[];
  notes?: Note[];
  /** Where it is in use on the site. */
  where?: string;
}

/** A part of the site that is not published: listed, with what it is. */
export interface Listed {
  name: string;
  sources: string[];
  exports: string[];
  /** Where it is on the site, as a link. */
  where: string;
  why: string;
}

/** Where the registry is served: an item is fetched from here by its name. */
export const REGISTRY = "https://s1lin.tokensbeat.com/r";

const CLASS: PropDoc = { name: "className", type: "string", desc: "Added to the part's own class." };

export const ENTRIES: Entry[] = [
  // ------------------------------------------------------------ getting started
  {
    id: "install",
    name: "Install",
    group: "start",
    exports: [],
    summary:
      "The parts are published as a shadcn registry: one command copies a part's source into your app, with its stylesheet and whatever else it needs, and the copy is yours to change. A React 19 app with an import alias is all it takes; Tailwind is not needed.",
    example: "guide",
  },
  {
    id: "tokens",
    name: "Tokens",
    group: "start",
    item: "tokens",
    exports: [],
    summary:
      "Every part is drawn in these CSS variables: a paper, a second paper for plates and wells, the ink, two greys, two hairline strengths, one accent, five typefaces, the \"+\" marks, and the scheme for native controls. They come in with any part; set them to restyle the lot.",
    example: "live",
    propsTitle: "Variables",
    props: [
      { name: "--s1-paper", type: "colour", default: "#f6f6f4 · #0f0f0f", desc: "The page, and the face of a plain button." },
      { name: "--s1-paper-2", type: "colour", default: "#ececea · #191919", desc: "Plates, wells, a chip under the pointer." },
      { name: "--s1-ink", type: "colour", default: "#111 · #ededed", desc: "Text, marks, the go button's face." },
      { name: "--s1-ink-2", type: "colour", default: "#4d4d4d · #b3b3b3", desc: "Second ink: labels, a link among buttons." },
      { name: "--s1-ink-3", type: "colour", default: "#8a8a8a · #7a7a7a", desc: "Third ink: page numbers, hints, guide lines." },
      { name: "--s1-rule", type: "colour", default: "ink at 14%", desc: "Hairlines between things." },
      { name: "--s1-rule-strong", type: "colour", default: "ink at 80%", desc: "Hairlines under a label, round a box or a button." },
      { name: "--s1-accent", type: "colour", default: "#d62d20 · #f0574b", desc: "The one colour: the go button's offset shadow. Set it to the ink for a press in one ink." },
      { name: "--s1-scheme", type: "light | dark", default: "light · dark", desc: "The colour scheme native controls are drawn in: a select's list, a number's arrows, a date's picker." },
      { name: "--s1-font-display", type: "font stack", default: "Instrument Serif…", desc: "Headlines." },
      { name: "--s1-font-sans", type: "font stack", default: "Inter Tight…", desc: "Text, and the roundel's letter." },
      { name: "--s1-font-mono", type: "font stack", default: "JetBrains Mono…", desc: "Labels, buttons, numbers." },
      { name: "--s1-font-mincho", type: "font stack", default: "Shippori Mincho B1…", desc: "The Japanese word in a kicker or a label." },
      { name: "--s1-font-gothic", type: "font stack", default: "Zen Kaku Gothic New…", desc: "Japanese in text." },
      { name: "--s1-corners", type: "background", desc: "Eight gradients that draw a \"+\" at each corner of a box, in its text colour. Plate uses it; give any box an `::after` 11px larger with it." },
    ],
    usage: `/* your CSS: the press in one ink, and your own face for text */
:root { --s1-accent: var(--s1-ink); --s1-font-sans: "Geist", system-ui, sans-serif; }
.dark { --s1-paper: #141816; }`,
    notes: [
      { label: "Styles", text: "The typefaces are named first and fall back to the system's: load Instrument Serif, Inter Tight and JetBrains Mono (Fontsource has them all) for the site's look, or point the font tokens at your own." },
      { label: "Dark mode", text: "Each colour has a night value, the second of the two above: see Dark mode, next." },
    ],
  },
  {
    id: "dark",
    name: "Dark mode",
    group: "start",
    exports: [],
    summary:
      "The tokens turn to night with the system's dark scheme, unless the root says otherwise, and on any element that asks. Three ways of asking are understood, so the parts follow whatever your app already does.",
    example: "live",
    usage: `<html class="dark">        <!-- shadcn, next-themes, Tailwind's dark: -->
<html data-theme="dark">   <!-- this site -->
<html data-mode="dark">    <!-- Kumo -->

<!-- paper again inside a dark page -->
<section class="light">…</section>`,
    notes: [
      { label: "Dark mode", text: "Light on the root (`class=\"light\"`, `data-theme=\"light\"` or `data-mode=\"light\"`) holds the paper when the system is dark. An app that marks only dark (`.dark`, nothing for light) should mark light too, or a dark system turns the parts. `useDark()` reads the same rules." },
    ],
  },
  {
    id: "styles",
    name: "Styles and Tailwind",
    group: "start",
    exports: [],
    summary:
      "Each part imports its own stylesheet, so there is nothing to set up. Class names begin `s1-` and variables `--s1-`, so nothing collides with Tailwind, Kumo or your own classes.",
    example: "guide",
  },

  // ------------------------------------------------------------ parts
  {
    id: "button",
    name: "Button",
    group: "parts",
    item: "button",
    exports: ["Button", "buttonClass", "ButtonProps", "ButtonVariant", "ButtonSize"],
    summary:
      "The house buttons. `plain` is a hairline box in mono type; `go`, the same in ink with an offset shadow in the accent, is for the one thing to do; `chip` is a pill; `link` is words underlined; `icon` is the plain box made square, for a mark with an aria-label. Pressed, a box sinks into its shadow.",
    example: "live",
    usage: `import { Button } from "@/components/s1lin/button";

<Button variant="go" onClick={post}>Post</Button>
<Button size="sm" onClick={cancel}>Cancel</Button>
<Button variant="link" onClick={signOut}>Sign out</Button>
<Button variant="go" href="/signup">Create an account</Button>
<Button variant="icon" aria-label="Close" onClick={close}><svg …/></Button>`,
    props: [
      { name: "variant", type: "\"plain\" | \"go\" | \"chip\" | \"link\" | \"icon\"", default: "\"plain\"", desc: "Which button. `icon` is 40px square (30px at `sm`) for an svg or one character, and needs an `aria-label`." },
      { name: "size", type: "\"md\" | \"sm\"", default: "\"md\"", desc: "`sm` is 30px tall in 11px type, for a row of small actions." },
      { name: "href", type: "string", desc: "Makes it a link, `<a>`, that looks the part; the other props go to the `<a>`." },
      { name: "type", type: "\"button\" | \"submit\" | \"reset\"", default: "\"button\"", desc: "As on `<button>`; it submits a form only when asked to." },
      CLASS,
      { name: "buttonClass", type: "({ variant, size }?, className?) => string", desc: "The same classes, for an element that cannot be a Button: a `<span>` chip, a `<label>`." },
    ],
    notes: [
      { label: "Accessibility", text: "A real `<button>` or `<a>`, every other prop passed on (`aria-*`, `disabled`, `ref`). Focus shows a 2px outline in the ink." },
      { label: "Reduced motion", text: "The press does not move." },
    ],
    where: "The comments: Post, Load more, Use this, the model chip, Sign out.",
  },
  {
    id: "section-label",
    name: "SectionLabel",
    group: "parts",
    item: "section-label",
    exports: ["SectionLabel"],
    summary: "A section's label: mono caps over a strong hairline, a word in Japanese first, set large in mincho. It draws in from the left as it scrolls into view.",
    example: "live",
    usage: `import { SectionLabel } from "@/components/s1lin/section-label";

<SectionLabel ja="目次">Contents</SectionLabel>
<SectionLabel as="h3" ja="草">On GitHub</SectionLabel>`,
    props: [
      { name: "ja", type: "string", desc: "The word before the label, with `lang=\"ja\"`." },
      { name: "as", type: "\"h2\" | \"h3\" | \"h4\" | \"p\"", default: "\"h2\"", desc: "The element: a heading at the right level, or a paragraph." },
      { name: "children", type: "ReactNode", required: true, desc: "The label." },
      { name: "className", type: "string", desc: "Added to `s1-section-label`; any other attribute (`id`…) goes to the element." },
    ],
    notes: [{ label: "Reduced motion", text: "The draw-in needs scroll-driven animations; without them, or for readers who prefer reduced motion, the label is simply there." }],
    where: "Contents, Foreword, On GitHub, With agents, The long version.",
  },
  {
    id: "kicker",
    name: "Kicker",
    group: "parts",
    item: "kicker",
    exports: ["Kicker"],
    summary: "The line over a heading: a Japanese label in mincho, then the rest in spaced mono caps.",
    example: "live",
    usage: `import { Kicker } from "@/components/s1lin/kicker";

<Kicker ja="随筆">Blog · No. 03</Kicker>`,
    props: [
      { name: "ja", type: "string", desc: "The Japanese label, with `lang=\"ja\"`." },
      { name: "children", type: "ReactNode", required: true, desc: "The rest: section, pages, number." },
      CLASS,
    ],
    where: "Every section opener, the blog, the cover's special feature.",
  },
  {
    id: "roundel",
    name: "Roundel",
    group: "parts",
    item: "roundel",
    exports: ["Roundel"],
    summary: "A metro-style station roundel: a line's letter in a ring, 1.9em across, so it sizes with the type around it.",
    example: "live",
    usage: `import { Roundel } from "@/components/s1lin/roundel";

<h2><Roundel hidden>T</Roundel> TokensBeat</h2>`,
    props: [
      { name: "children", type: "ReactNode", required: true, desc: "The letter, usually one character." },
      { name: "hidden", type: "boolean", default: "false", desc: "Hide it from screen readers, when the name beside it says the same." },
      CLASS,
    ],
    where: "Cover lines, contents, feature titles, the workshop.",
  },
  {
    id: "folio",
    name: "Folio",
    group: "parts",
    item: "folio",
    exports: ["Folio"],
    summary: "A page number, \"— 04 —\", centred at the foot of the nearest positioned box, as on a printed page.",
    example: "live",
    usage: `import { Folio } from "@/components/s1lin/folio";

<section style={{ position: "relative" }}>… <Folio page="04" /></section>`,
    props: [{ name: "page", type: "string", required: true, desc: "The page, as printed." }, CLASS],
    notes: [{ label: "Styles", text: "Placed 22px from the bottom of its box, which needs `position: relative`." }],
    where: "The foot of each spread of the issue.",
  },
  {
    id: "barcode",
    name: "Barcode",
    group: "parts",
    item: "barcode",
    exports: ["Barcode"],
    summary: "An id as a barcode, drawn from its hex digits between guards, the id printed under it. Each id draws its own; it is not a code a scanner reads.",
    example: "live",
    usage: `import { Barcode } from "@/components/s1lin/barcode";

<Barcode id={post.id} />
<Barcode id={post.id} label={false} /> {/* the bars alone */}`,
    props: [
      { name: "id", type: "string", required: true, desc: "Hex digits; dashes are dropped. A UUID works." },
      { name: "label", type: "boolean", default: "true", desc: "Print the id under the bars." },
      CLASS,
    ],
    notes: [{ label: "Accessibility", text: "The bars are hidden from screen readers; the id is in the label and the `title`." }],
    where: "Each blog post in place of a date; the contents, bars only.",
  },
  {
    id: "stack",
    name: "Stack",
    group: "parts",
    item: "stack",
    exports: ["Stack"],
    summary: "A line of small hairline tags in mono, for what something is built with.",
    example: "live",
    usage: `import { Stack } from "@/components/s1lin/stack";

<Stack items={["React 19", "TypeScript", "Vite 8"]} />`,
    props: [{ name: "items", type: "string[]", required: true, desc: "The tags. Each is its own React key, so keep them unique." }, CLASS],
    where: "Under each feature's story.",
  },
  {
    id: "screen",
    name: "Screen",
    group: "parts",
    item: "screen",
    exports: ["Screen"],
    summary: "A screenshot in a hairline browser frame: a bar with three dots and the address, an offset plate behind.",
    example: "live",
    usage: `import { Screen } from "@/components/s1lin/screen";

<Screen bar="tokensbeat.com">
  <img src="/home.webp" width={1600} height={1000} alt="…" />
</Screen>`,
    props: [
      { name: "bar", type: "string", required: true, desc: "What the address bar says." },
      { name: "children", type: "ReactNode", required: true, desc: "The picture, set to the frame's width." },
      CLASS,
    ],
    notes: [{ label: "Styles", text: "The offset plate reaches 14px to the right and below: leave it the room." }],
    where: "The features' screenshots.",
  },
  {
    id: "plate",
    name: "Plate",
    group: "parts",
    item: "plate",
    exports: ["Plate"],
    summary: "A box in a strong hairline with a \"+\" registration mark at each corner, in its own ink, as on a drawing sheet. It sets no padding: give it room yourself.",
    example: "live",
    usage: `import { Plate } from "@/components/s1lin/plate";

<Plate as="figure" className="machine" ref={box}>…</Plate>`,
    props: [
      { name: "as", type: "\"div\" | \"section\" | \"figure\" | \"article\" | \"aside\"", default: "\"div\"", desc: "The element the plate is." },
      { name: "ref", type: "Ref<HTMLElement>", desc: "To the element." },
      { name: "className", type: "string", desc: "Added to `s1-plate`; any other attribute goes to the element." },
    ],
    notes: [{ label: "Styles", text: "The marks hang 5.5px outside the box (`::after`, `inset: -6px`): a parent with `overflow: hidden` cuts them." }],
    where: "The cover's two machines, the token chart's champion, the colophon, every example on this page.",
  },
  {
    id: "mark",
    name: "Mark",
    group: "parts",
    item: "mark",
    exports: ["Mark", "MarkSetOut"],
    summary: "The site's mark, a cross on a block of ink, and the same set out with compass and square. At night the block takes the light ink and the cross the dark paper.",
    example: "live",
    usage: `import { Mark, MarkSetOut } from "@/components/s1lin/mark";

<Mark className="logo" />   {/* .logo { width: 18px; height: 18px; } */}
<MarkSetOut />`,
    props: [{ name: "className", type: "string", desc: "Mark: added to `s1-mark`. It has no size of its own; give it one in CSS. MarkSetOut is 96px square." }],
    notes: [{ label: "Accessibility", text: "Mark is decorative (`aria-hidden`): set it beside a name, never in place of one. MarkSetOut is an image with its own description." }],
    where: "The running head, the favicon, the colophon.",
  },
  {
    id: "ascii-art",
    name: "AsciiArt",
    group: "parts",
    item: "ascii-art",
    exports: ["AsciiArt"],
    summary: "An ascii.rest piece (MIT, by @bas3line). Text pieces draw into a `<pre>` that holds a still frame until they start; pieces with a palette switch to a canvas once the page is live.",
    example: "live",
    usage: `import * as typewriter from "ascii.rest/pieces/typewriter";
import { AsciiArt } from "@/components/s1lin/ascii-art";

<AsciiArt
  piece={typewriter}
  options={{ prefix: "parts: ", phrases: ["roundels.", "barcodes."] }}
  label="A typewriter typing the names of parts"
  still="parts: roundels.▌" />`,
    props: [
      { name: "piece", type: "Piece", required: true, desc: "A piece from ascii.rest/pieces/*, or one made with `banner()` or the kit." },
      { name: "options", type: "MountOptions", desc: "The piece's options, and fps or motion. Compared by value, so an inline object does not restart it." },
      { name: "label", type: "string", required: true, desc: "What the picture shows, for screen readers." },
      { name: "still", type: "string", default: "\"\"", desc: "The frame shown before it starts and without JavaScript; capture it from the piece so nothing jumps." },
      { name: "className", type: "string", desc: "Added to `s1-ascii`." },
    ],
    notes: [
      { label: "Accessibility", text: "`role=\"img\"` with the label; the characters themselves are not read out." },
      { label: "Reduced motion", text: "ascii.rest shows the still moment the piece names for it." },
      { label: "Styles", text: "Line and block characters want \"ascii.rest mono\", a 3 KB font: declare it where you serve it (the rule is in ascii-art.css), or system monospace stands in." },
    ],
    where: "The cover banner, the typewriter, the skyline, the departures board, the closing plates.",
  },
  {
    id: "tex",
    name: "Tex",
    group: "parts",
    item: "tex",
    exports: ["Tex", "setKatex"],
    summary: "LaTeX set by KaTeX, inline or on a line of its own. On a server it writes finished HTML with MathML beside it, and the browser loads no KaTeX; anywhere else KaTeX and its stylesheet load when the first formula mounts. A mistake shows in red in place.",
    example: "live",
    usage: `import { Tex } from "@/components/s1lin/tex";

<Tex>{String.raw\`P(A \\mid B) = 80\\%\`}</Tex>
<Tex block>{String.raw\`\\int_0^1 x^2\\,dx = \\tfrac{1}{3}\`}</Tex>`,
    props: [
      { name: "children", type: "string", required: true, desc: "The source. Write it with String.raw so backslashes stay." },
      { name: "block", type: "boolean", default: "false", desc: "On a line of its own (display mode)." },
      CLASS,
      { name: "setKatex", type: "(katex) => void", desc: "On a server: hand Tex the KaTeX module before rendering, so maths is set into the HTML." },
    ],
    notes: [
      { label: "Styles", text: "KaTeX's stylesheet is the part's `tex.css`, in a layer of its own (`katex`). Tex fetches it the first time it shows maths on a page that has none, so pages without maths never load it." },
      { label: "Server", text: "On a page rendered on a server, call `setKatex(katex)` there and import `tex.css` on the page, so its maths is styled before any script runs. This site does both; Tex then reads back the HTML already in the page." },
    ],
    where: "The blog's posts.",
  },

  // ------------------------------------------------------------ hooks
  {
    id: "use-near",
    name: "useNear",
    group: "hooks",
    item: "use-near",
    exports: ["useNear"],
    summary: "True while an element is within a margin of the viewport. Mount heavy things on it, and unmount them when it turns false.",
    example: "live",
    propsTitle: "Signature",
    props: [{ name: "useNear", type: "(ref, margin = \"400px\") => boolean", desc: "`ref` to the element; `margin` above and below the viewport." }],
    usage: `import { useNear } from "@/components/s1lin/use-near";

const box = useRef<HTMLDivElement>(null);
const near = useNear(box, "300px");
return <div ref={box}>{near ? <Heavy /> : <Still />}</div>;`,
  },
  {
    id: "use-media",
    name: "useMedia",
    group: "hooks",
    item: "use-media",
    exports: ["useMedia"],
    summary: "A media query's answer, kept current.",
    example: "live",
    propsTitle: "Signature",
    props: [{ name: "useMedia", type: "(query: string) => boolean", desc: "Any media query." }],
    usage: `const mouse = useMedia("(hover: hover) and (pointer: fine)");`,
  },
  {
    id: "use-dark",
    name: "useDark",
    group: "hooks",
    item: "use-dark",
    exports: ["useDark"],
    summary: "True on night paper, read as the tokens read it: the root's data-theme, a dark or light class or data-mode, else the system's scheme. For anything drawn in script that must turn with the page.",
    example: "live",
    propsTitle: "Signature",
    props: [{ name: "useDark", type: "() => boolean", desc: "Kept current as the root's attributes or the system change." }],
    usage: `const dark = useDark();
// read the colours again when it changes
const ink = getComputedStyle(canvas).getPropertyValue("--s1-ink");`,
  },
  {
    id: "use-hydrated",
    name: "useHydrated",
    group: "hooks",
    item: "use-hydrated",
    exports: ["useHydrated"],
    summary: "False in server HTML and while hydrating, true after: for output only a browser should make, without a hydration mismatch.",
    example: "live",
    propsTitle: "Signature",
    props: [{ name: "useHydrated", type: "() => boolean", desc: "No arguments." }],
    usage: `const live = useHydrated();
return live ? <canvas … /> : <pre>{still}</pre>;`,
  },
  {
    id: "use-scale",
    name: "useScale",
    group: "hooks",
    item: "use-scale",
    exports: ["useScale"],
    summary: "How many CSS pixels one unit of a drawing comes to once it is laid out, so its words can be set at a size that holds as an SVG scales.",
    example: "live",
    propsTitle: "Signature",
    props: [{ name: "useScale", type: "(ref, width: number) => number", desc: "`ref` to the drawing; `width` its width in its own units." }],
    usage: `const k = useScale(svg, 1200);
<text fontSize={9 / k}>Jan</text> {/* 9px on screen at any width */}`,
  },
  {
    id: "cn",
    name: "cn",
    group: "hooks",
    item: "cn",
    exports: ["cn"],
    summary: "Class names joined, the falsy ones dropped: clsx, under the name shadcn's parts use. It merges no Tailwind classes; the parts have none.",
    example: "live",
    propsTitle: "Signature",
    props: [{ name: "cn", type: "(...inputs: ClassValue[]) => string", desc: "Strings, arrays, and objects of class: condition." }],
    usage: `cn("s1-btn", active && "is-active", className)`,
  },
];

/** The site's own parts and pages: each written for one place, and not in the registry. */
export const LISTED: Listed[] = [
  { name: "Runhead", sources: ["src/components/Runhead.tsx"], exports: ["Runhead"], where: "/ui/", why: "The running head: the mark and S1LIN, the section being read, the 夜/紙 toggle. The bar at the top of this page." },
  { name: "Feature", sources: ["src/components/Feature.tsx"], exports: ["Feature"], where: "/#tokensbeat", why: "One line of the issue as a spread: numeral, roundel, kanji, spec sheet, story." },
  { name: "Ref, SourceLink, Elsewhere", sources: ["src/components/bits.tsx"], exports: ["Ref", "SourceLink", "Elsewhere"], where: "/blog/bayes/", why: "A post's numbered sources, and pictures held elsewhere, linked rather than rehosted." },
  { name: "Effects", sources: ["src/components/effects.tsx"], exports: ["GlitchTitle", "LoupeShot", "RipplePhoto", "ErasePhoto", "FrostPane", "SandPane"], where: "/#cities", why: "Where Canvas UI's effects meet the photographs, the titles and the page; the eraser is the site's own." },
  { name: "Canvas UI", sources: ["src/components/canvasui/"], exports: ["Ripple", "Magnify", "Glitch", "Frost", "ParticleScroll"], where: "https://canvasui.dev", why: "Canvas UI's effects, patched to paint an <img> in WebGL. Not this library's to publish: add them from canvasui.dev." },
  { name: "GitHubHeatmap", sources: ["src/components/GitHubHeatmap.tsx"], exports: ["GitHubHeatmap"], where: "/#contents", why: "A year of contributions, from a snapshot built with the site." },
  { name: "TokenSkyline", sources: ["src/components/TokenSkyline.tsx"], exports: ["TokenSkyline"], where: "/#contents", why: "The editor's tokens with coding agents, in colour by the owner's choice." },
  { name: "Metro2Line", sources: ["src/components/Metro2Line.tsx", "src/hooks/useMetro2Line.ts"], exports: ["MetroBar", "MetroMap", "MetroCaption", "useMetro2Line"], where: "/#cover", why: "The metro player: ride a city or guess it." },
  { name: "WorkshopSlider", sources: ["src/components/WorkshopSlider.tsx"], exports: ["WorkshopSlider"], where: "/#workshop", why: "Two playable builds as a row to swipe." },
  { name: "Social", sources: ["src/components/social/"], exports: ["Comments", "Composer", "Reactions", "SignInBar", "ShapeGallery", "ShapeSubmit", "Icon", "Avatar"], where: "/blog/bayes/", why: "Comments, likes, reposts and shapes through Aha Social, set with Button." },
  { name: "Life", sources: ["src/components/life/"], exports: ["Board", "Thumb", "Rich", "LangProvider", "Puzzle", "Playground"], where: "/life/", why: "The boards, puzzles, playground and words of Life." },
  { name: "Cover", sources: ["src/components/Cover.tsx"], exports: ["Cover"], where: "/#cover", why: "The masthead, the two machines and the cover lines." },
  { name: "BrickMachine", sources: ["src/components/BrickLocator.tsx"], exports: ["BrickMachine"], where: "/#cover", why: "Brick Locator's sample, stepped through." },
  { name: "Contents", sources: ["src/components/Contents.tsx"], exports: ["Contents"], where: "/#contents", why: "The contents, the foreword and the charts under them." },
  { name: "FeatureOpener", sources: ["src/components/FeatureOpener.tsx"], exports: ["FeatureOpener"], where: "/#feature", why: "The route map and timetables of one career." },
  { name: "Features", sources: ["src/components/Features.tsx"], exports: ["Features"], where: "/#tokensbeat", why: "The five features' words and figures, set in Feature." },
  { name: "TokensbeatSection", sources: ["src/components/TokensbeatFigures.tsx"], exports: ["TokensbeatSection"], where: "/#tokensbeat", why: "The platform drawn as a building section." },
  { name: "HiRainFigures", sources: ["src/components/HiRainFigures.tsx"], exports: ["HiRainFigures"], where: "/#hirain", why: "The three-points-to-five schematic." },
  { name: "Cities", sources: ["src/components/Cities.tsx"], exports: ["Cities"], where: "/#cities", why: "The photo essay, on black stock." },
  { name: "Workshop", sources: ["src/components/Workshop.tsx"], exports: ["Workshop"], where: "/#workshop", why: "The workshop's bench of builds." },
  { name: "Departures", sources: ["src/components/Departures.tsx"], exports: ["Departures"], where: "/#departures", why: "The split-flap board and the ledger." },
  { name: "Colophon", sources: ["src/components/Colophon.tsx"], exports: ["Colophon"], where: "/#colophon", why: "The colophon, Find the editor, the letters, the closing plates." },
  { name: "BlogPage", sources: ["src/components/Blog.tsx"], exports: ["BlogPage"], where: "/blog/", why: "The blog's index and its posts." },
  { name: "LifePage", sources: ["src/components/Life.tsx"], exports: ["LifePage"], where: "/life/", why: "Life: rules, puzzles, playground, study." },
  { name: "UiPage", sources: ["src/components/uidocs/UiDocs.tsx"], exports: ["UiPage"], where: "/ui/", why: "This page." },
];
