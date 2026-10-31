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

export type GroupId = "start" | "foundations" | "parts" | "forms" | "data" | "overlays" | "feedback" | "text" | "hooks";

export interface Group {
  id: GroupId;
  name: string;
  /** The chapter of the index it stands in; the parts' families share one. */
  chapter: string;
  blurb: string;
}

export const GROUPS: Group[] = [
  {
    id: "start",
    name: "Getting started",
    chapter: "Getting started",
    blurb: "From an empty app to the first part, and how the parts' stylesheets sit beside your own, with Tailwind or without.",
  },
  {
    id: "foundations",
    name: "Foundations",
    chapter: "Foundations",
    blurb: "What every part is drawn in and says: the tokens, the night, the status hues, the words. Set them once and the parts take your colours, your night and your language.",
  },
  {
    id: "parts",
    name: "Editorial",
    chapter: "Parts",
    blurb: "The parts the issue is set with, each a component and its own stylesheet, drawn in the tokens. Each brings the tokens and cn with it.",
  },
  {
    id: "forms",
    chapter: "Parts",
    name: "Forms",
    blurb: "Native controls in the house's hairline, wired for screen readers: a Field gives its control a label, a hint and an error, and the control says it is invalid. Every one works with a keyboard, a phone's own pickers and a form's own submit.",
  },
  {
    id: "data",
    chapter: "Parts",
    name: "Data",
    blurb: "Tables, figures and statuses for a console: keys, usage, orders, models. Statuses are told apart by line, fill and shape in one ink, never by hue alone, so they read in greyscale and to anyone who does not see colour.",
  },
  {
    id: "overlays",
    chapter: "Parts",
    name: "Overlays",
    blurb: "What opens over the page or in place of part of it: a dialog, a menu of actions, tabs, toasts. Each follows the ARIA practices for its keys and its focus, on native elements where there is one (<dialog>, the Popover API).",
  },
  {
    id: "feedback",
    chapter: "Parts",
    name: "Feedback",
    blurb: "What the page says while it works and after: a notice where it applies, a spinner for a moment, bars where something is still coming.",
  },
  {
    id: "text",
    chapter: "Parts",
    name: "Text and keys",
    blurb: "Code, API keys and the clipboard: copy that falls back where the clipboard is unavailable, a key that is not in the page while it is hidden, words for screen readers only.",
  },
  {
    id: "hooks",
    name: "Hooks and cn",
    chapter: "Hooks and cn",
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
  label: "Accessibility" | "Keyboard" | "Reduced motion" | "Phone" | "Dark mode" | "Cost" | "Network" | "Styles" | "Server";
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
    group: "foundations",
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
      { name: "--s1-ok", type: "colour", default: "unset: the ink", desc: "A good status: an ok badge's line and tick, a notice's edge, a meter's fill, a stat that rises, a switch that is on. See Theming." },
      { name: "--s1-ok-tint", type: "colour", default: "unset: the paper", desc: "The ground of an ok badge." },
      { name: "--s1-warn", type: "colour", default: "unset: the ink", desc: "A warning: a warn badge's line, hatch and triangle, a notice's hatched edge, a meter past its warning share." },
      { name: "--s1-warn-tint", type: "colour", default: "unset: the paper", desc: "The ground under a warn badge's hatch." },
      { name: "--s1-bad", type: "colour", default: "unset: the ink", desc: "An error: a bad badge's fill, a notice's double line and cross, a meter over its limit, a stat that falls." },
      { name: "--s1-bad-tint", type: "colour", default: "unset: the paper", desc: "A ground for your own bad rows and pills; no part draws it (the bad badge is solid)." },
      { name: "--s1-info", type: "colour", default: "unset: the ink", desc: "A note: an info badge's dotted line and ring, a notice's edge." },
      { name: "--s1-info-tint", type: "colour", default: "unset: the paper", desc: "The ground of an info badge." },
      { name: "--s1-on-status", type: "colour", default: "unset: the paper", desc: "The words on a solid status fill: the bad badge's." },
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
    group: "foundations",
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
    id: "theming",
    name: "Theming",
    group: "foundations",
    exports: [],
    summary:
      "The parts are drawn in one ink, and a status says itself by its line, its fill and its shape. An app that wants hues sets the status tokens, which are left unset: a badge, a notice, a meter, a stat's change and a switch that is on then take them, and the shapes stay, so nothing rests on colour alone. Until they are set every status falls back to the ink around it, so a page that sets none looks as it always has.",
    example: "none",
    usage: `/* your theme, after the parts: the status hues, and the go button's shadow in your brand */
:root {
  --s1-ok: #1d733b;   --s1-ok-tint: #dce7de;
  --s1-warn: #925600; --s1-warn-tint: #ebe3d7;
  --s1-bad: #c0261b;  --s1-bad-tint: #f0ddda;
  --s1-info: #1f5fb8; --s1-info-tint: #dce4ed;
  --s1-on-status: #f6f6f4;   /* the words on the solid bad badge */
  --s1-accent: #0f7a6c;
}
/* night: the same names, on the selectors Dark mode lists */
.dark { --s1-ok: #5cc281; --s1-ok-tint: #1a281f; --s1-bad: #ff6b5e; --s1-on-status: #111; }

// a stat whose fall is good, and one with no good way
<Stat label="p50 latency" value="820 ms" delta="-12%" trend="down" data-good="down" />
<Stat label="Requests" value="2,619" delta="+4%" trend="up" data-good="none" />`,
    notes: [
      { label: "Styles", text: "Set them outside a cascade layer, or in one after `base`: the parts' tokens sit in `@layer base`, so an unlayered rule wins. A hue set on an element holds for its part of the page, as every token does." },
      { label: "Accessibility", text: "Check each hue at 4.5:1 against both papers and its own tint; the words on a tint stay in the ink. In forced colours every hue gives way to the system's, and the shapes carry the status." },
      { label: "Dark mode", text: "Give each a night value on the same selectors the tokens use (see Dark mode), or the day's hues stay on the night paper." },
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
  {
    id: "words",
    name: "Words",
    group: "foundations",
    item: "words",
    exports: ["S1Words", "useS1Words", "S1_WORDS", "S1WordMap"],
    summary:
      "The words the parts say for themselves (Copy and Copied, a dialog's Close, Previous and Next, Show and Hide, Loading, and what a screen reader hears after a copy or before a status) come from one place, in English. Give your app's words once, with `S1Words` around it, and every part says them; a prop given to one part still wins there.",
    example: "live",
    usage: `import { S1Words, type S1WordMap } from "@/components/s1lin/words";

// your dictionary: only the words you translate; the rest stay English
const zh: Partial<S1WordMap> = {
  copy: "复制", copied: "已复制", close: "关闭",
  previous: "上一页", next: "下一页",
  page: (n) => \`第 \${n} 页\`,
  pageOf: (n, count) => \`第 \${n} 页，共 \${count} 页\`,
};

// inside whatever holds the language, so a switch gives the parts new words
<S1Words words={lang === "zh" ? zh : {}}>
  <App />
</S1Words>

// one place that needs other words: its prop wins
<Dialog closeLabel="Close without saving" … />`,
    props: [
      { name: "words", type: "Partial<S1WordMap>", required: true, desc: "The words to say inside, by key; a key left out keeps the word around it (English at the top). The few that take a number or a name are functions: `page(n)`, `pageOf(n, count)`, `copyName(name)`." },
      { name: "children", type: "ReactNode", desc: "Your app, or the part of it in that language." },
      { name: "useS1Words", type: "() => S1WordMap", desc: "The words in force here, for a part of your own that should speak as the others do." },
      { name: "S1_WORDS", type: "S1WordMap", desc: "The English, every key: the list of what there is to translate." },
    ],
    notes: [
      { label: "Accessibility", text: "The words only a screen reader hears are here too: the status word before a notice or a toast, a trend's direction, a secret's \"hidden\", the message after a copy. Translate them with the rest, and set `lang` on the page." },
      { label: "Server", text: "A React context, so server HTML is in the words given; with no provider it is in English." },
    ],
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
    where: "The comments: Post, Load more, Use this, the model chip, Sign out. On this page: Copy, the dialogs, the menus.",
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

  // ------------------------------------------------------------ forms
  {
    id: "field",
    name: "Field",
    group: "forms",
    item: "field",
    exports: ["Field", "Fieldset", "useField", "FieldProps", "FieldsetProps", "FieldControlProps"],
    summary:
      "A label, one control, a hint and an error, wired together: the label points at the control, the control is described by the error and the hint, and it is marked invalid while there is an error. `Fieldset` does the same for a group (a key's scopes), with a legend. `useField` gives a control of your own the same wiring.",
    example: "live",
    usage: `import { Field, Fieldset } from "@/components/s1lin/field";
import { Input } from "@/components/s1lin/input";
import { Checkbox } from "@/components/s1lin/checkbox";

<Field label="Name" hint="Shown in your list of keys." error={errors.name} required aside={\`\${name.length}/40\`}>
  <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
</Field>

<Fieldset legend="Scopes" error={errors.scopes}>
  <Checkbox name="scope" value="chat">Chat</Checkbox>
  <Checkbox name="scope" value="images">Images</Checkbox>
</Fieldset>`,
    props: [
      { name: "label", type: "ReactNode", required: true, desc: "Field: what the control is; a `<label>` whose `for` is the control's id." },
      { name: "children", type: "ReactNode", required: true, desc: "Field: one Input, Textarea or Select, or a control that calls `useField`. Fieldset: the checkboxes, switches or radios." },
      { name: "hint", type: "ReactNode", desc: "Help under the control (under the legend in a Fieldset), read as its description." },
      { name: "error", type: "ReactNode", desc: "What is wrong, under it with a cross, read first in its description. While it is set the control has `aria-invalid` and a double line." },
      { name: "required", type: "boolean", default: "false", desc: "Passed to the control, which a screen reader then calls required; the label shows a \"*\" (hidden from screen readers)." },
      { name: "disabled", type: "boolean", default: "false", desc: "Field: passed to the control; the label greys. Fieldset: disables every control inside, as a fieldset does." },
      { name: "id", type: "string", desc: "The control's id. Set it on the Field, not the control, so the label still points at it." },
      { name: "aside", type: "ReactNode", desc: "Field: words at the other end of the label's line: a count, a link." },
      { name: "legend", type: "ReactNode", required: true, desc: "Fieldset: what the group is." },
      { name: "useField", type: "(own?: FieldControlProps) => attributes", desc: "In a control of your own: the id, aria-describedby, aria-invalid, required and disabled to spread on it. Its own props win; outside a Field they come back as they are." },
    ],
    notes: [
      { label: "Accessibility", text: "Checked in Chrome's accessibility tree: the control's name is the label, its description the error then the hint, `aria-invalid` is true while there is an error. Move focus to the first field in error after a submit; the error is read with it. A Fieldset is a group named by its legend, described by its hint and error." },
      { label: "Phone", text: "The label and its aside wrap onto two lines at 320px; the error and hint wrap under the control." },
    ],
  },
  {
    id: "input",
    name: "Input",
    group: "forms",
    item: "input",
    exports: ["Input", "InputProps"],
    summary:
      "A text box: a native `<input>` of any text type (text, number, search, password, email, url) in a hairline box, 40px tall as a Button or 30px as a small one, with words or a button inside it before or after.",
    example: "live",
    usage: `import { Input } from "@/components/s1lin/input";

<Field label="Amount"><Input type="number" inputMode="decimal" min={5} prefix="$" suffix="USD" /></Field>
<Input type="search" size="sm" aria-label="Search keys" placeholder="Search keys" />
<Input suffix={<Button size="sm" onClick={apply}>Apply</Button>} aria-label="Coupon" />`,
    props: [
      { name: "size", type: "\"md\" | \"sm\"", default: "\"md\"", desc: "40px tall in 16px type, or 30px in 14px (16px on a touch screen, which would zoom into smaller type)." },
      { name: "prefix", type: "ReactNode", desc: "Before the text, inside the box: a currency, a scheme. Words here are read as part of its description." },
      { name: "suffix", type: "ReactNode", desc: "After the text: a unit, or a small Button. Words here are read as part of its description." },
      { name: "invalid", type: "boolean", desc: "In error without a Field around it; sets `aria-invalid`." },
      { name: "type", type: "string", default: "\"text\"", desc: "Any text type. Numbers are set in mono; give them `inputMode=\"decimal\"` for a phone's number pad." },
      { name: "className", type: "string", desc: "Added to the box (`s1-input`); every other prop goes to the `<input>`, `ref` too." },
    ],
    notes: [
      { label: "Accessibility", text: "A native input: its name comes from the Field's label, or give it `aria-label`. Focus draws a 2px ring in the ink round the whole box; in error the line doubles, so the state is not told by colour. Placeholder text is in the third ink and is never the label." },
      { label: "Dark mode", text: "Native parts of the control (a number's arrows, a search's clear) follow `--s1-scheme`." },
    ],
  },
  {
    id: "textarea",
    name: "Textarea",
    group: "forms",
    item: "textarea",
    exports: ["Textarea", "TextareaProps"],
    summary: "Lines of text in the Input's box: four lines tall, dragged taller, or growing with what is typed where the browser can (`field-sizing`).",
    example: "live",
    usage: `import { Textarea } from "@/components/s1lin/textarea";

<Field label="What is it for?" aside={\`\${note.length}/280\`}>
  <Textarea grow rows={3} maxRows={8} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
</Field>`,
    props: [
      { name: "rows", type: "number", default: "4", desc: "Lines tall at first." },
      { name: "grow", type: "boolean", default: "false", desc: "Grow with the text from `rows` to `maxRows` lines; where `field-sizing` is not supported it is dragged taller instead." },
      { name: "maxRows", type: "number", default: "12", desc: "The most lines it grows to before it scrolls." },
      { name: "invalid", type: "boolean", desc: "In error without a Field around it." },
      CLASS,
    ],
    notes: [{ label: "Accessibility", text: "A native textarea, wired to its Field as Input is. In error the line doubles." }],
  },
  {
    id: "select",
    name: "Select",
    group: "forms",
    item: "select",
    exports: ["Select", "SelectProps"],
    summary:
      "A choice from a list: the native `<select>`, so the phone's own picker, typing to jump and every screen reader work as they always do, drawn in the Input's box with a chevron. Options are its children.",
    example: "live",
    usage: `import { Select } from "@/components/s1lin/select";

<Field label="Model" required>
  <Select placeholder="Choose a model" value={model} onChange={(e) => setModel(e.target.value)}>
    <option value="qwen-3.8">qwen-3.8</option>
    <option value="gpt-image-2">gpt-image-2</option>
  </Select>
</Field>`,
    props: [
      { name: "placeholder", type: "string", desc: "A first option with no value, shown until one is chosen; it cannot be chosen again when the select is required." },
      { name: "size", type: "\"md\" | \"sm\"", default: "\"md\"", desc: "40px or 30px tall, as Input." },
      { name: "invalid", type: "boolean", desc: "In error without a Field around it." },
      { name: "className", type: "string", desc: "Added to the box (`s1-select`); every other prop goes to the `<select>`." },
    ],
    notes: [
      { label: "Accessibility", text: "A native select: a combobox to screen readers, opened with Space or Alt+↓, typing jumps to an option. Nothing about it is redrawn but its box." },
      { label: "Dark mode", text: "The list of options follows `--s1-scheme` where the system draws it." },
    ],
  },
  {
    id: "checkbox",
    name: "Checkbox",
    group: "forms",
    item: "checkbox",
    exports: ["Checkbox", "CheckboxProps"],
    summary: "A native checkbox in a drawn box: a tick in paper on ink when on, a bar when some of what it stands for are on. The label is beside it, a hint under it.",
    example: "live",
    usage: `import { Checkbox } from "@/components/s1lin/checkbox";

<Checkbox checked={all} indeterminate={some} onChange={toggleAll}>All scopes</Checkbox>
<Checkbox name="scope" value="chat" defaultChecked hint="Chat completions and responses">Chat</Checkbox>
<Checkbox aria-label="Select prod-key" />`,
    props: [
      { name: "children", type: "ReactNode", desc: "The label. Without one, give it `aria-label`." },
      { name: "hint", type: "ReactNode", desc: "A line under the label, read as the checkbox's description." },
      { name: "indeterminate", type: "boolean", default: "false", desc: "Some are on: a bar in the box, and \"mixed\" to a screen reader. A click turns it on." },
      { name: "className", type: "string", desc: "Added to the part's wrapper; every other prop (`checked`, `onChange`, `name`, `ref`) goes to the `<input>`." },
    ],
    notes: [
      { label: "Accessibility", text: "The `<input>` lies over the drawn box, invisible: it takes the click, the focus and Space, and a screen reader hears a checkbox, checked, not checked or mixed. The whole label is the target, at least 24px tall." },
      { label: "Styles", text: "In a high-contrast mode (forced colours) the browser's own checkbox is shown instead of the drawing." },
    ],
  },
  {
    id: "radio-group",
    name: "RadioGroup",
    group: "forms",
    item: "radio-group",
    exports: ["RadioGroup", "RadioGroupProps", "RadioOption"],
    summary:
      "One choice of a few: native radios with one name in a fieldset that is the radiogroup. As a list, as cards to pick an amount or a plan, or as a segmented row for a range (24h · 7d · 30d).",
    example: "live",
    usage: `import { RadioGroup } from "@/components/s1lin/radio-group";

<RadioGroup legend="Amount" variant="cards" value={amount} onValueChange={setAmount}
  options={[{ value: "10", label: "$10", hint: "about 2M tokens" }, { value: "20", label: "$20" }]} />

<RadioGroup legend="Range" variant="segmented" defaultValue="7d"
  options={["24h", "7d", "30d"].map((r) => ({ value: r, label: r }))} />`,
    props: [
      { name: "legend", type: "ReactNode", required: true, desc: "What the choice is: the group's name." },
      { name: "options", type: "RadioOption[]", required: true, desc: "`{ value, label, hint?, disabled? }` each; the hint is read as the option's description." },
      { name: "value", type: "string", desc: "The chosen value, when controlled." },
      { name: "defaultValue", type: "string", desc: "The value chosen at first, when not." },
      { name: "onValueChange", type: "(value: string) => void", desc: "Called with the value chosen." },
      { name: "variant", type: "\"list\" | \"cards\" | \"segmented\"", default: "\"list\"", desc: "Radios down the page; a tile each, in a grid that wraps; one joined row, the chosen word in reverse." },
      { name: "orientation", type: "\"vertical\" | \"horizontal\"", default: "\"vertical\"", desc: "A list's radios in a row that wraps." },
      { name: "name", type: "string", desc: "The radios' name in a form; one is made up if not given." },
      { name: "hint", type: "ReactNode", desc: "Under the legend." },
      { name: "error", type: "ReactNode", desc: "Under the options; the group is marked invalid." },
      { name: "required", type: "boolean", desc: "The group must have a choice." },
    ],
    notes: [
      { label: "Keyboard", text: "Native radios: Tab enters the group at the chosen radio (or the first), ↑ ↓ ← → move and choose, Tab leaves. Nothing is scripted." },
      { label: "Accessibility", text: "The fieldset has `role=\"radiogroup\"`, named by the legend, with `aria-invalid` and `aria-required` when they apply. Each radio is named by its label alone and described by its hint. Cards and segments show focus as a ring round the whole tile." },
      { label: "Phone", text: "Cards fall to one a row under 320px; a segmented row wraps." },
    ],
  },
  {
    id: "switch",
    name: "Switch",
    group: "forms",
    item: "switch",
    exports: ["Switch", "SwitchProps"],
    summary: "On or off, taking effect at once: a native checkbox with `role=\"switch\"`, drawn as a track and a thumb, in ink and to the right when on. For a choice that waits for a Save, use a Checkbox.",
    example: "live",
    usage: `import { Switch } from "@/components/s1lin/switch";

<Switch reverse checked={alerts} onChange={(e) => setAlerts(e.target.checked)} hint="When spend passes 80% of the budget">
  Email me
</Switch>`,
    props: [
      { name: "children", type: "ReactNode", desc: "The label: what it turns on." },
      { name: "hint", type: "ReactNode", desc: "A line under the label, read as the switch's description." },
      { name: "reverse", type: "boolean", default: "false", desc: "The label first and the switch at the far end of the row, for a list of settings." },
      { name: "className", type: "string", desc: "Added to the wrapper; every other prop goes to the `<input>`." },
    ],
    notes: [
      { label: "Accessibility", text: "A screen reader hears a switch, on or off (`role=\"switch\"` on a checkbox, so the state is the checkbox's own). Space toggles it. Off and on differ in fill and in the thumb's side, not only in colour." },
      { label: "Reduced motion", text: "The thumb jumps instead of sliding." },
    ],
  },

  {
    id: "slider",
    name: "Slider",
    group: "forms",
    item: "slider",
    exports: ["Slider", "SliderProps", "SliderMark"],
    summary:
      "A number in a range, dragged or set with the arrow keys: a native `<input type=\"range\">` drawn as the Meter's hairline track, filled in ink up to a thumb with a needle in it, its label and value above and marks under it if you want them. For a setting that takes effect as it moves: a line's contrast, a temperature, a warning share.",
    example: "live",
    usage: `import { Slider } from "@/components/s1lin/slider";

<Slider label="Line contrast" min={0} max={60} step={2} value={contrast} onValueChange={setContrast}
  format={(v) => \`\${v}%\`} hint="How dark the hairlines between rows are drawn."
  marks={[{ value: 0, label: "None" }, { value: 14, label: "Default" }, { value: 60, label: "Strong" }]} />

<Slider label="Temperature" name="temperature" min={0} max={2} step={0.1} defaultValue={0.7} marks={[0, 1, 2]} />`,
    props: [
      { name: "label", type: "ReactNode", desc: "What is set: a `<label>` for the range. Without one, give the slider an `aria-label`." },
      { name: "value", type: "number", desc: "The value, when controlled; held between `min` and `max`." },
      { name: "defaultValue", type: "number", default: "min", desc: "The value at first, when not." },
      { name: "onValueChange", type: "(value: number) => void", desc: "Called with each new value as it moves. The native `onChange` is called too." },
      { name: "min", type: "number", default: "0", desc: "The lowest value." },
      { name: "max", type: "number", default: "100", desc: "The highest value." },
      { name: "step", type: "number", default: "1", desc: "The smallest move, by an arrow key or the pointer." },
      { name: "format", type: "(value: number) => string", desc: "The value in words: shown beside the label and read as its `aria-valuetext`, so a screen reader hears \"40%\" and not \"40\"." },
      { name: "marks", type: "(number | SliderMark)[]", desc: "Ticks under the track: numbers, or `{ value, label? }` with words under the tick. The tick the value sits on is drawn in the ink, and its words are read with the value (\"14%, Default\")." },
      { name: "hideValue", type: "boolean", default: "false", desc: "Keep the value out of sight, where what it changes shows it; it is still read." },
      { name: "hint", type: "ReactNode", desc: "A line under the track, read as the slider's description." },
      { name: "invalid", type: "boolean", default: "false", desc: "In error: the track's line doubles, and the range has `aria-invalid`." },
      { name: "disabled", type: "boolean", default: "false", desc: "Dashed, in the third ink; the value still shows." },
      { name: "className", type: "string", desc: "Added to the wrapper (`s1-slider`), as `style` is; every other prop (`name`, `form`, `ref`, `aria-*`) goes to the `<input>`." },
    ],
    notes: [
      { label: "Keyboard", text: "A native range: ← and ↓ move a step down, → and ↑ a step up, Page Up and Page Down a larger step, Home and End go to the ends. Nothing is scripted." },
      { label: "Accessibility", text: "A slider to screen readers, named by its label, with its min, max and value, and the words from `format` as its `aria-valuetext`. The value printed beside the label is hidden from them, so it is not read twice. Focus draws a 2px outline in the ink round the thumb. The whole track takes a press, 24px tall." },
      { label: "Phone", text: "The track takes the width of its box, and a tap on it moves the thumb there. The words under the end marks keep inside the box." },
      { label: "Styles", text: "In a high-contrast mode (forced colours) the track, the thumb and the fill are drawn in the system's colours, the fill in its highlight." },
    ],
  },

  // ------------------------------------------------------------ data
  {
    id: "table",
    name: "Table",
    group: "data",
    item: "table",
    exports: ["Table", "TableProps", "Column", "Sort", "RowProps", "RowGroup", "OpenGroups", "GroupWords", "ALL_GROUPS_OPEN", "ALL_GROUPS_CLOSED", "isGroupOpen", "withGroupOpen", "allGroupsOpen"],
    summary:
      "A data table from columns and rows: a caption, column headers and row headers, numbers set to the end in mono, a row for when there is nothing, rows of bars while loading, headers that ask for a sort, and actions at the end of each row. Rows can come in groups, each under a heading row across the table that a button opens and closes, with \"Expand all\" above. Wider than its frame, it scrolls sideways inside it and says so, never the page; with `fit` it is never wider than its frame.",
    example: "live",
    usage: `import { Table, type Column } from "@/components/s1lin/table";

const columns: Column<Key>[] = [
  { key: "name", header: "Name" },
  { key: "status", header: "Status", cell: (k) => <Badge status={k.active ? "ok" : "neutral"}>{k.active ? "Active" : "Off"}</Badge> },
  { key: "spend", header: "Spend", numeric: true, sortable: true, cell: (k) => usd(k.spend) },
];

<Table caption="API keys" hideCaption columns={columns} rows={keys} rowKey="id"
  sort={sort} onSortChange={setSort} loading={!keys}
  empty={<EmptyState size="sm" title="No keys yet" action={<Button variant="go">Create key</Button>} />}
  actions={(k) => <Menu variant="icon" size="sm" align="end" label={\`Actions for \${k.name}\`} items={…} />} />

// Rows in groups that open and close, in a table that fits its frame:
import { Table, isGroupOpen, withGroupOpen, type OpenGroups } from "@/components/s1lin/table";

const [open, setOpen] = useState<OpenGroups>({ all: false, except: troubled }); // closed but the troubled ones
<Table caption="Models by group" fit collapsible expandAll columns={columns} rowKey="id"
  openGroups={open} onOpenGroupsChange={setOpen}
  groups={groups.map((g) => ({
    key: String(g.id), label: g.name, rows: g.models, empty: "No models",
    heading: (open) => <GroupHeading group={g} summary={!open} />,
    meta: (open) => (open ? \`\${g.models.length} models\` : priceRange(g)),
  }))}
  rowProps={(m) => ({ "data-status": m.status, onClick: openDetail })} />`,
    props: [
      { name: "caption", type: "ReactNode", required: true, desc: "What the table is: its `<caption>`, read first, and the name of its frame when the frame scrolls." },
      { name: "hideCaption", type: "boolean", default: "false", desc: "Keep the caption for screen readers only, where a heading above says it." },
      {
        name: "columns",
        type: "Column<Row>[]",
        required: true,
        desc: "Each `{ key, header, cell?, numeric?, align?, sortable?, wrap?, width?, clamp?, title?, span?, className? }`. Without `cell` the row's field `key` is shown; `numeric` sets it to the end in mono; `clamp` keeps it to that many lines and `title(row)` gives the whole; `span(row)` takes the next columns too.",
      },
      { name: "rows", type: "Row[]", desc: "The rows, in the order shown: the table does not sort or page them. Give `rows` or `groups`." },
      {
        name: "groups",
        type: "RowGroup<Row>[]",
        desc: "Rows in groups instead: each `{ key, heading, meta?, label?, rows, empty?, className?, style? }` is a `<tbody>` under a heading row across the table. `heading` and `meta` may be functions, told whether the group is open.",
      },
      { name: "rowKey", type: "keyof Row | (row, index) => Key", required: true, desc: "Each row's React key." },
      { name: "rowHeader", type: "string", default: "the first column", desc: "The column whose cells name their rows (`<th scope=\"row\">`)." },
      { name: "rowProps", type: "(row, index) => RowProps", desc: "Attributes for a row's `<tr>`: a class, `data-` attributes, a click that follows the row's own link." },
      { name: "empty", type: "ReactNode", default: "\"Nothing here yet.\"", desc: "One row across the table when there are no rows: words, or an EmptyState. By default the `empty` of the words in force (`S1Words`)." },
      { name: "loading", type: "boolean | number", default: "false", desc: "Rows of bars in place of the rows (5, or the number given), and `aria-busy` on the table." },
      { name: "sort", type: "{ key, dir: \"asc\" | \"desc\" } | null", desc: "The sort to show: that header marked, and `aria-sort` on it." },
      { name: "onSortChange", type: "(sort) => void", desc: "Called when a sortable header is pressed: ascending first, then the other way. Sort the rows yourself." },
      { name: "actions", type: "(row, index) => ReactNode", desc: "A last column of buttons: a Menu, a Button. Its header is named for screen readers only." },
      { name: "actionsLabel", type: "string", default: "\"Actions\"", desc: "That header's name; by default the words' `actions`." },
      { name: "stickyHeader", type: "boolean", default: "false", desc: "The header row stays while the rows scroll inside the frame, `maxHeight` tall." },
      { name: "maxHeight", type: "CSS length", default: "\"28rem\"", desc: "The frame's height with a sticky header." },
      { name: "dense", type: "boolean", default: "false", desc: "Tighter rows in 13px type, for a log." },
      { name: "fit", type: "boolean", default: "false", desc: "As wide as the frame and no wider: the columns share it out (by `width`, the rest evenly) and words wrap. For a dense table that must not scroll sideways." },
      { name: "collapsible", type: "boolean", default: "false", desc: "Each group's heading row gets a button that opens and closes it; a click on the row's background does the same. A closed group keeps its heading row only." },
      { name: "openGroups", type: "OpenGroups", desc: "The open groups, controlled: `{ all, except }`, every group but `except` when `all`, else only `except`; groups that come later follow `all`. `isGroupOpen`, `withGroupOpen`, `allGroupsOpen` read and change it." },
      { name: "defaultOpenGroups", type: "OpenGroups", default: "ALL_GROUPS_OPEN", desc: "The open groups at first, uncontrolled." },
      { name: "onOpenGroupsChange", type: "(open: OpenGroups) => void", desc: "Called after a toggle or Expand all, with the groups now open." },
      { name: "expandAll", type: "boolean", default: "false", desc: "A button above the table that opens every group, and closes them all once all are open." },
      { name: "groupWords", type: "{ expandAll, collapseAll }", default: "\"Expand all\", \"Collapse all\"", desc: "That button's words; translate them here." },
      { name: "scrollHint", type: "string", default: "\"Scroll sideways for more\"", desc: "The line under a table wider than its frame; by default the words' `scrollHint`." },
      { name: "sortWords", type: "{ asc, desc, none }", desc: "What a sortable header adds for screen readers: \"sorted ascending\"; by default the words' `sortAscending`, `sortDescending`, `sortNone`." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "A real `<table>`: the caption names it, headers have `scope`, the first column's cells are row headers, so a screen reader reads \"prod-key, Spend, $41.20\" moving across. A sortable header is a button inside the `<th>`, and the `<th>` carries `aria-sort`. Shapes in the arrows and the badges, not colour, carry state. Each group is a `<tbody>` named by its heading row (`<th scope=\"rowgroup\">` across the table). Its toggle is a button named by the group's `label` (or its heading) with `aria-expanded`, so a screen reader hears \"Claude, collapsed\"; the triangle points down at the rows when they show. A heading may hold its own links and buttons: a click on them does not toggle." },
      { label: "Keyboard", text: "When the table is wider than its frame (or the header is sticky), the frame becomes a region named by the caption, with `tabIndex=0`, so the arrow keys scroll it; when it fits, it is no stop at all. Tab reaches each group's toggle, Enter or Space opens and closes it." },
      { label: "Phone", text: "Cells keep to one line, so columns never squeeze to a word a line; the table scrolls sideways inside its frame, with a shade at the edge that has more and \"Scroll sideways for more\" under it. With `fit`, leave out what a phone cannot hold (mark the column with `className`, then give it no width and hide its words in a container query: not `display: none`, since a group's heading row spans every column), or fold it into the first cell." },
    ],
  },
  {
    id: "pagination",
    name: "Pagination",
    group: "data",
    item: "pagination",
    exports: ["Pagination", "pageList"],
    summary:
      "Pages of a long list: Previous and Next, the first and the last, this page and its neighbours, a gap where pages are left out. Buttons, or links with `href`. In a box under 30rem the numbers give way to \"Page 3 of 12\".",
    example: "live",
    usage: `import { Pagination } from "@/components/s1lin/pagination";

<Pagination page={page} pageCount={Math.ceil(total / 20)} onPageChange={setPage}
  summary={\`\${(page - 1) * 20 + 1}–\${Math.min(page * 20, total)} of \${total}\`} />

<Pagination page={page} pageCount={12} href={(p) => \`?page=\${p}\`} />`,
    props: [
      { name: "page", type: "number", required: true, desc: "The page shown, from 1." },
      { name: "pageCount", type: "number", required: true, desc: "How many pages there are." },
      { name: "onPageChange", type: "(page: number) => void", desc: "Called with the page asked for." },
      { name: "href", type: "(page: number) => string", desc: "Make the pages links. `onPageChange` is still called on a click." },
      { name: "siblings", type: "number", default: "1", desc: "Pages either side of this one before a gap." },
      { name: "summary", type: "ReactNode", desc: "At the start of the row: \"21–40 of 213\"." },
      { name: "label", type: "string", default: "\"Pagination\"", desc: "The `<nav>`'s name." },
      { name: "words", type: "{ previous, next, page(n), of(n, count) }", desc: "The words, translated." },
      CLASS,
      { name: "pageList", type: "(page, count, siblings?) => (number | \"gap\")[]", desc: "The numbers it shows, for a pager of your own." },
    ],
    notes: [
      { label: "Accessibility", text: "A `<nav>` named \"Pagination\"; the page shown has `aria-current=\"page\"`; each number is named \"Page 3\"; Previous and Next are marked `aria-disabled` at the ends, not hidden and not `disabled`, so Next pressed onto the last page keeps its focus. \"Page 3 of 12\" is read in every width." },
      { label: "Phone", text: "Narrow, it keeps ← Previous, \"Page 3 of 12\", Next →, so it never wraps to two lines of numbers." },
    ],
  },
  {
    id: "badge",
    name: "Badge",
    group: "data",
    item: "badge",
    exports: ["Badge", "BadgeProps"],
    summary:
      "A status in a word, in mono caps in a small box. The five statuses differ in line, fill and shape: neutral a hairline and a dash, info dotted with a ring, ok in ink with a tick, warn hatched with a triangle, bad in reverse with a cross.",
    example: "live",
    usage: `import { Badge } from "@/components/s1lin/badge";

<Badge status="ok">Active</Badge>
<Badge status="warn">90% used</Badge>
<Badge status="bad">Expired</Badge>
<Badge plain>Beta</Badge>`,
    props: [
      { name: "status", type: "\"neutral\" | \"info\" | \"ok\" | \"warn\" | \"bad\"", default: "\"neutral\"", desc: "Which status." },
      { name: "plain", type: "boolean", default: "false", desc: "No shape before the words." },
      { name: "children", type: "ReactNode", required: true, desc: "The status in words: they are what a screen reader reads." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "The words are the status; the shape is hidden from screen readers. No status is told by hue: the five read apart in greyscale and to anyone who does not see colour." },
      { label: "Styles", text: "One ink by design. An app that wants hues sets the status tokens (see Theming): each status then takes its hue on its line, its shape and its ground, and the words stay in the ink." },
    ],
  },
  {
    id: "glyph",
    name: "Glyph",
    group: "data",
    item: "glyph",
    exports: ["Glyph", "Status"],
    summary:
      "A status as a shape, cut out of the ink around it in CSS: a dash, a ring, a tick, a triangle, a cross. Badge, Notice, Toast, Menu and Field draw their statuses with it; it needs no font and no icon set.",
    example: "live",
    usage: `import { Glyph } from "@/components/s1lin/glyph";

<li><Glyph status="ok" /> Included in your plan</li>`,
    props: [
      { name: "status", type: "\"neutral\" | \"info\" | \"ok\" | \"warn\" | \"bad\"", required: true, desc: "Which shape. `Status` is the type every part uses." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "Decorative (`aria-hidden`): the words beside it must say the status." },
      { label: "Styles", text: "0.78em square, in `currentColor`: it takes the size and the ink of the text it sits in." },
    ],
  },
  {
    id: "stat",
    name: "Stat",
    group: "data",
    item: "stat",
    exports: ["Stat", "StatGroup", "StatProps"],
    summary:
      "A figure that matters: its label in mono caps, the number large in the display face, the change under it with a triangle. `StatGroup` sets a row of them with hairlines between, wrapping as the width needs.",
    example: "live",
    usage: `import { Stat, StatGroup } from "@/components/s1lin/stat";

<StatGroup>
  <Stat label="Spend this month" value="$41.20" delta="+12.5%" trend="up" note="vs September" />
  <Stat label="Requests" value="128,420" />
  <Stat label="Balance" value="$8.80" unit="USD" loading={!account} />
</StatGroup>`,
    props: [
      { name: "label", type: "ReactNode", required: true, desc: "What is counted; it names the stat for screen readers." },
      { name: "value", type: "ReactNode", required: true, desc: "The number, formatted." },
      { name: "unit", type: "ReactNode", desc: "After the number, small, in mono." },
      { name: "delta", type: "ReactNode", desc: "The change, with its sign: \"+12.5%\"." },
      { name: "trend", type: "\"up\" | \"down\" | \"flat\"", desc: "A triangle up or down, a bar for none. Whether up is good (spend, latency) is for the words to say." },
      { name: "note", type: "ReactNode", desc: "After the change, in the second ink." },
      { name: "loading", type: "boolean", default: "false", desc: "A bar where the number will be; `aria-busy` on the stat." },
      { name: "trendLabels", type: "{ up, down, flat }", desc: "The words read before the change (\"Up\"); translate here." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "Each stat is a group named by its label; a screen reader reads \"Spend this month, $41.20, Up +12.5%, vs September\". The triangle is hidden; the word says the direction." },
      { label: "Phone", text: "The group puts as many stats a row as fit at 11.5rem each, down to one a row at 320px." },
      { label: "Styles", text: "With the status hues set (see Theming) a rise is drawn in ok and a fall in bad; `data-good=\"down\"` on the stat turns that round (latency, errors) and `data-good=\"none\"` keeps the change in the ink." },
    ],
  },
  {
    id: "meter",
    name: "Meter",
    group: "data",
    item: "meter",
    exports: ["Meter"],
    summary:
      "How much of a limit is used: a quota, a budget, a rate limit. A bar in ink with the value in words beside its label; hatched from the warning share on, and doubled with the bar full once the limit is passed.",
    example: "live",
    usage: `import { Meter } from "@/components/s1lin/meter";

<Meter label="Spend this month" value={41.2} max={50} valueText="$41.20 of $50" hint="Keys pause at the limit." />`,
    props: [
      { name: "label", type: "ReactNode", required: true, desc: "What is measured; it names the meter." },
      { name: "value", type: "number", required: true, desc: "How much is used; it may pass `max`." },
      { name: "max", type: "number", default: "100", desc: "The limit." },
      { name: "min", type: "number", default: "0", desc: "Where the bar starts." },
      { name: "valueText", type: "string", default: "\"value / max\"", desc: "The value in words, shown and read: \"$41.20 of $50\"." },
      { name: "warnAt", type: "number", default: "0.8", desc: "The share of the range from which the bar is hatched." },
      { name: "hint", type: "ReactNode", desc: "A line under the bar, read as its description." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "`role=\"meter\"` with its min, max and value, and the words as `aria-valuetext`; past the limit the value stays at the max and the words say how far over. The hatching and the double line show the levels without colour; `data-level` (ok, warn, over) is there to style." },
    ],
  },
  {
    id: "description-list",
    name: "DescriptionList",
    group: "data",
    item: "description-list",
    exports: ["DescriptionList", "Description"],
    summary: "Facts as names and values in a `<dl>`: an order, an account, a key. Names in mono caps on the left, values beside them, a hairline between rows; name over value in a box under 26em.",
    example: "live",
    usage: `import { DescriptionList } from "@/components/s1lin/description-list";

<DescriptionList items={[
  { label: "Order", value: <Code>ord_7Q2…</Code> },
  { label: "Amount", value: "$20.00" },
  { label: "Status", value: <Badge status="ok">Paid</Badge> },
]} />`,
    props: [
      { name: "items", type: "{ label, value, key? }[]", required: true, desc: "The names and values; `key` when a label is not a string." },
      { name: "layout", type: "\"rows\" | \"stacked\"", default: "\"rows\"", desc: "Names beside values (stacked in a narrow box), or always name over value." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "A description list: screen readers announce it as a list of so many items and read each name with its value." },
      { label: "Phone", text: "It stacks by its own width (a container query), so it stacks inside a narrow column on a desktop too." },
    ],
  },
  {
    id: "panel",
    name: "Panel",
    group: "data",
    item: "panel",
    exports: ["Panel"],
    summary:
      "A block of a console page in a hairline frame: the heading in the display face with its actions beside it, the body, a footer. With `marks`, the Plate's \"+\" at each corner; with `flush`, no padding round a table.",
    example: "live",
    usage: `import { Panel } from "@/components/s1lin/panel";

<Panel title="API keys" description="Keys belong to this workspace." actions={<Button variant="go">Create key</Button>} flush>
  <Table caption="API keys" hideCaption … />
</Panel>`,
    props: [
      { name: "title", type: "ReactNode", desc: "The heading; it names the section." },
      { name: "level", type: "2 | 3 | 4", default: "2", desc: "The heading's level, for where the panel sits." },
      { name: "description", type: "ReactNode", desc: "A line under the heading." },
      { name: "actions", type: "ReactNode", desc: "Buttons at the right of the heading; under it on a phone." },
      { name: "footer", type: "ReactNode", desc: "A line under the body." },
      { name: "flush", type: "boolean", default: "false", desc: "No padding round the body." },
      { name: "marks", type: "boolean", default: "false", desc: "\"+\" marks at the corners; leave 6px round it." },
      CLASS,
    ],
    notes: [{ label: "Accessibility", text: "A `<section>` named by its heading, so it is a region a screen reader can list and jump to." }],
  },
  {
    id: "empty-state",
    name: "EmptyState",
    group: "data",
    item: "empty-state",
    exports: ["EmptyState"],
    summary: "Nothing here yet, said plainly: an empty frame marked at its corners, a line in the display face, what to do next. For an empty list, a search with no results, a page before its first use.",
    example: "live",
    usage: `import { EmptyState } from "@/components/s1lin/empty-state";

<EmptyState title="No keys yet" action={<Button variant="go" onClick={create}>Create key</Button>}>
  <p>A key lets an app call the models on your balance.</p>
</EmptyState>`,
    props: [
      { name: "title", type: "ReactNode", required: true, desc: "What is missing." },
      { name: "children", type: "ReactNode", desc: "Why, or what to do." },
      { name: "action", type: "ReactNode", desc: "The one thing to do." },
      { name: "size", type: "\"md\" | \"sm\"", default: "\"md\"", desc: "`sm` inside a table or a small panel." },
      CLASS,
    ],
    notes: [{ label: "Accessibility", text: "The frame is decorative; the title is a paragraph, not a heading, so it can sit in a table cell. Put a heading round it where it stands for a whole page." }],
  },

  // ------------------------------------------------------------ overlays
  {
    id: "dialog",
    name: "Dialog",
    group: "overlays",
    item: "dialog",
    exports: ["Dialog"],
    summary:
      "A modal dialog on the native `<dialog>`, opened with showModal(): the page behind turns inert, so focus stays inside with no trap of our own, and Esc, the close button or a click on the veil close it. A heading names it; actions sit at its foot.",
    example: "live",
    usage: `import { Dialog } from "@/components/s1lin/dialog";

<Dialog open={open} onClose={() => setOpen(false)} title="Create a key" description="Keys can call every model on your balance."
  actions={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="go" type="submit" form="new-key">Create</Button></>}>
  <form id="new-key" onSubmit={create}>
    <Field label="Name"><Input data-autofocus /></Field>
  </form>
</Dialog>`,
    props: [
      { name: "open", type: "boolean", required: true, desc: "Open or not. The dialog follows it." },
      { name: "onClose", type: "() => void", required: true, desc: "Asked to close: Esc, the close button, the veil, or the browser. Set `open` false here." },
      { name: "title", type: "ReactNode", required: true, desc: "The heading (`<h2>`); it names the dialog." },
      { name: "description", type: "ReactNode", desc: "A line under the heading; it describes the dialog." },
      { name: "children", type: "ReactNode", desc: "The body. Mounted only while open, so a form in it starts afresh each time." },
      { name: "actions", type: "ReactNode", desc: "The buttons at the foot, the main one last." },
      { name: "size", type: "\"sm\" | \"md\" | \"lg\"", default: "\"md\"", desc: "420, 560 or 760px at most; the screen less 16px a side on a phone." },
      { name: "dismissible", type: "boolean", default: "true", desc: "Esc, the close button and the veil close it. False for what must be answered: a key shown once. Browsers still close it on a second Esc in a row (so no page can trap a reader); `onClose` is called then too." },
      { name: "initialFocus", type: "RefObject<HTMLElement>", desc: "What to focus on opening; by default the first element with `data-autofocus`, else the first that takes focus." },
      { name: "closeLabel", type: "string", default: "\"Close\"", desc: "The close button's name." },
      CLASS,
    ],
    notes: [
      { label: "Keyboard", text: "Tab and Shift+Tab stay inside (the page behind is inert); Esc closes unless it is not dismissible; on closing, focus goes back to what opened it. A Menu inside keeps Esc for itself." },
      { label: "Accessibility", text: "A modal dialog named by its heading and described by its description, checked in Chrome's accessibility tree. The page behind leaves the accessibility tree while it is open, and stops scrolling. A body taller than the dialog becomes a region named by the heading that takes focus, so a keyboard can scroll it. Unmounted while open, it closes first, so focus still goes back." },
      { label: "Phone", text: "At 390px it is the screen less 8px a side, the body scrolls between a fixed head and foot, and the buttons share the foot's row." },
      { label: "Styles", text: "Toasts sit under the veil, and are not read, while a dialog stays open: inside a dialog, say it with a Notice. `close(); toast(…)` in one handler works: the Toaster shows a toast a frame later, once the page behind is live again." },
    ],
  },
  {
    id: "menu",
    name: "Menu",
    group: "overlays",
    item: "menu",
    exports: ["Menu", "MenuItem"],
    summary:
      "A button that opens a short list of actions, the menu button of the ARIA practices. The list sits in the top layer (the Popover API), so no table frame or panel clips it; it opens below the button, or above when there is no room.",
    example: "live",
    usage: `import { Menu } from "@/components/s1lin/menu";

<Menu variant="icon" size="sm" align="end" label={\`Actions for \${key.name}\`} items={[
  { label: "Rename", onSelect: rename },
  { label: "Usage", href: \`/usage?key=\${key.id}\` },
  "separator",
  { label: "Revoke", danger: true, onSelect: confirmRevoke },
]} />`,
    props: [
      { name: "items", type: "MenuItem[]", required: true, desc: "`{ label, onSelect?, href?, disabled?, danger?, hint?, text? }` or `\"separator\"`. `href` makes a link; `danger` puts a cross before it; `hint` is words at the right; `text` is what a typed letter matches when the label is not a string." },
      { name: "children", type: "ReactNode", desc: "What the button shows; three dots when left out." },
      { name: "label", type: "string", desc: "The button's name, needed when it shows no words." },
      { name: "align", type: "\"start\" | \"end\"", default: "\"start\"", desc: "Which edge of the button the list lines up with; it is kept on the screen either way." },
      { name: "variant", type: "ButtonVariant", default: "\"plain\"", desc: "The button: `icon` for three dots." },
      { name: "size", type: "\"md\" | \"sm\"", default: "\"md\"", desc: "The button's size." },
      CLASS,
    ],
    notes: [
      { label: "Keyboard", text: "Enter, Space or ↓ opens it on the first item, ↑ on the last; ↑ ↓ move and wrap, Home and End go to the ends, a letter jumps to the next item that starts with it, Enter chooses, Esc closes and gives focus back to the button, Tab closes and moves on." },
      { label: "Accessibility", text: "The button has `aria-haspopup=\"menu\"` and `aria-expanded`; the list is a `menu` named by the button, its items `menuitem`. A disabled item stays in the list and the arrows reach it, marked `aria-disabled`, so it is heard but not chosen, as the ARIA practices have it. Choosing runs after the menu has closed and focus is back on the button, so a dialog it opens returns focus there. With no items it does not open." },
      { label: "Phone", text: "The list is kept 8px inside the screen and scrolls when it is taller than 60% of it." },
    ],
  },
  {
    id: "tabs",
    name: "Tabs",
    group: "overlays",
    item: "tabs",
    exports: ["Tabs", "Tab"],
    summary:
      "Panels behind a row of tabs, as the ARIA practices draw them: one tab stop for the row, the arrow keys between tabs, the open tab marked with a bar in ink. On a narrow screen the row scrolls sideways.",
    example: "live",
    usage: `import { Tabs } from "@/components/s1lin/tabs";

<Tabs label="Usage" tabs={[
  { id: "overview", label: "Overview", content: <Overview /> },
  { id: "requests", label: "Requests", content: <Requests /> },
  { id: "exports", label: "Exports", content: null, disabled: true },
]} />`,
    props: [
      { name: "tabs", type: "Tab[]", required: true, desc: "`{ id, label, content, disabled? }` each." },
      { name: "label", type: "string", required: true, desc: "What the tabs are: the tablist's name." },
      { name: "value", type: "string", desc: "The open tab, when controlled." },
      { name: "defaultValue", type: "string", desc: "The tab open at first; the first usable by default." },
      { name: "onValueChange", type: "(id: string) => void", desc: "Called with the tab opened." },
      { name: "activation", type: "\"auto\" | \"manual\"", default: "\"auto\"", desc: "The arrow keys open the tab they reach, or only move to it (Enter or Space opens): manual suits panels that load." },
      { name: "keepMounted", type: "boolean", default: "false", desc: "Keep every panel mounted, hidden, so its state survives a switch." },
      CLASS,
    ],
    notes: [
      { label: "Keyboard", text: "Tab reaches the open tab only (roving tabindex); ← → move between tabs and wrap, Home and End go to the ends, skipping disabled tabs; Tab again goes into the panel, which takes focus itself." },
      { label: "Accessibility", text: "`tablist`, `tab` with `aria-selected` and `aria-controls`, `tabpanel` named by its tab. Every panel is in the page (hidden ones `hidden`), so each tab's `aria-controls` points at something." },
    ],
  },
  {
    id: "toast",
    name: "Toast",
    group: "overlays",
    item: "toast",
    exports: ["toast", "Toaster", "ToastOptions"],
    summary:
      "Short messages about something just done. Call `toast(\"Key created\")` from anywhere; one `<Toaster />` on the page shows them in a corner, in a live region that is there from the start, so each is read out without moving focus.",
    example: "live",
    usage: `import { toast, Toaster } from "@/components/s1lin/toast";

// once, at the root
<Toaster />

toast("Key created");
toast({ title: "Payment failed", description: "The card was declined.", status: "bad" });
const id = toast({ title: "Saving…", duration: Infinity });
toast({ id, title: "Saved", status: "ok" });       // the same toast, replaced
toast({ title: "Key revoked", action: { label: "Undo", onClick: undo } });`,
    props: [
      { name: "toast", type: "(message | ToastOptions) => id", desc: "Show one. `{ title, description?, status?, action?: { label, onClick }, duration?, id? }`. Give an id again to replace a toast in place. `toast.dismiss(id?)` takes one, or all, away." },
      { name: "duration", type: "number", default: "5000", desc: "Milliseconds on screen; Infinity to stay. A toast with an action stays until it is dismissed." },
      { name: "position", type: "\"bottom-end\" | \"bottom-start\" | \"top-end\" | \"top-start\"", default: "\"bottom-end\"", desc: "Toaster: the corner. On a phone they take the width of the screen at that edge." },
      { name: "label", type: "string", default: "\"Notifications\"", desc: "Toaster: the region's name." },
      { name: "dismissLabel", type: "string", default: "\"Dismiss\"", desc: "Toaster: the close buttons' name." },
      { name: "statusLabels", type: "Record<Status, string>", desc: "Toaster: the status words read first (\"Error: \"); translate here." },
    ],
    notes: [
      { label: "Accessibility", text: "A polite live region (`aria-live=\"polite\"`) in a region named \"Notifications\", in the server HTML before any toast, so a new toast is read without taking focus; the status word is read first. Each toast has a close button." },
      { label: "Keyboard", text: "A toast stays while the pointer is over the toasts or focus is in them, and one with an action stays until dismissed, so there is time to Tab to its button (WCAG 2.2.1). Dismissing the toast that has focus moves focus to the next toast, or back to where it came from." },
      { label: "Reduced motion", text: "Toasts appear without sliding in." },
    ],
  },

  // ------------------------------------------------------------ feedback
  {
    id: "notice",
    name: "Notice",
    group: "feedback",
    item: "notice",
    exports: ["Notice", "NoticeProps"],
    summary:
      "A message in the page, where it applies: a balance running low, a key that expires, a payment that failed. A hairline box with a heavy edge in ink; hatched for a warning, doubled for an error; a title, words, an action, a close button.",
    example: "live",
    usage: `import { Notice } from "@/components/s1lin/notice";

<Notice status="warn" title="Balance low" action={<Button size="sm" href="/billing">Top up</Button>}>
  $2.10 left: about a day at this week's rate.
</Notice>
<Notice status="bad" role="alert" title="Payment failed">The card was declined.</Notice>`,
    props: [
      { name: "status", type: "\"neutral\" | \"info\" | \"ok\" | \"warn\" | \"bad\"", default: "\"info\"", desc: "Its shape and edge." },
      { name: "title", type: "ReactNode", desc: "The first line, in bold." },
      { name: "children", type: "ReactNode", desc: "What to know." },
      { name: "action", type: "ReactNode", desc: "A button or a link under the words." },
      { name: "onDismiss", type: "() => void", desc: "Shows a close button; called when it is pressed." },
      { name: "dismissLabel", type: "string", default: "\"Dismiss\"", desc: "The close button's name." },
      { name: "statusLabel", type: "string", desc: "The word read first (\"Warning: \"); \"\" for none." },
      { name: "className", type: "string", desc: "Added to the box; any other attribute (`role`, `id`) goes to it." },
    ],
    notes: [
      { label: "Accessibility", text: "A screen reader hears the status word first (\"Warning: Balance low\"); the shape is hidden. Give it `role=\"alert\"` when it appears in answer to something the reader did, so it is read at once; a notice that is there when the page loads needs no role." },
    ],
  },
  {
    id: "spinner",
    name: "Spinner",
    group: "feedback",
    item: "spinner",
    exports: ["Spinner"],
    summary: "Waiting, for a moment: a hairline ring with a quarter in ink, turning, at 12, 16 or 28px. A status a screen reader reads, or decorative where something else says the page is busy.",
    example: "live",
    usage: `import { Spinner } from "@/components/s1lin/spinner";

<Spinner label="Loading keys" showLabel />
<Button variant="go" disabled={saving} aria-busy={saving}>{saving && <Spinner size="sm" decorative />} Save</Button>`,
    props: [
      { name: "label", type: "string", default: "\"Loading\"", desc: "What is happening, read by screen readers." },
      { name: "showLabel", type: "boolean", default: "false", desc: "Show the label beside the ring." },
      { name: "size", type: "\"sm\" | \"md\" | \"lg\"", default: "\"md\"", desc: "12, 16 or 28px." },
      { name: "decorative", type: "boolean", default: "false", desc: "Hidden from screen readers, where `aria-busy` or words already say it." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "`role=\"status\"` with the label. A status that appears together with its words is often not read: for a wait that matters, keep a status on the page and change its words, or say the result (a toast, the content arriving)." },
      { label: "Reduced motion", text: "It turns three times slower." },
    ],
  },
  {
    id: "skeleton",
    name: "Skeleton",
    group: "feedback",
    item: "skeleton",
    exports: ["Skeleton"],
    summary: "Where something is still coming: bars the shape of the text or box it will be, a lighter band passing over them. Table and Stat use it while loading.",
    example: "live",
    usage: `import { Skeleton } from "@/components/s1lin/skeleton";

<div aria-busy={!data}>
  {data ? <Text /> : <Skeleton lines={3} />}
</div>`,
    props: [
      { name: "shape", type: "\"line\" | \"block\" | \"circle\"", default: "\"line\"", desc: "A bar a line high, a box, or a disc." },
      { name: "lines", type: "number", default: "1", desc: "Lines of text: a bar each, the last shorter." },
      { name: "width", type: "CSS length", desc: "Lines and blocks fill their box by default." },
      { name: "height", type: "CSS length", desc: "A block's height: 4rem by default." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "Hidden from screen readers. Mark the region that is loading with `aria-busy`, and say \"Loading\" once if the wait is long." },
      { label: "Reduced motion", text: "The bars stand still." },
    ],
  },

  // ------------------------------------------------------------ text and keys
  {
    id: "code",
    name: "Code",
    group: "text",
    item: "code",
    exports: ["Code"],
    summary: "Code in mono, in one ink: inline in a sentence (a model id, a header), or a block with a bar for its name and Copy (a request to try). A long line scrolls inside the block.",
    example: "live",
    usage: `import { Code } from "@/components/s1lin/code";

Send <Code>Authorization: Bearer …</Code> with each request.
<Code block copy label="curl">{\`curl https://api.tokensbeat.com/v1/chat/completions …\`}</Code>`,
    props: [
      { name: "children", type: "string", required: true, desc: "The code, as text." },
      { name: "block", type: "boolean", default: "false", desc: "A block of its own; inline by default." },
      { name: "copy", type: "boolean", default: "false", desc: "A Copy button in the block's bar." },
      { name: "label", type: "ReactNode", desc: "The block's bar: \"curl\". It also names the Copy button (\"Copy curl\")." },
      CLASS,
    ],
    notes: [
      { label: "Keyboard", text: "A block whose lines are wider than it becomes a region named by its label that takes focus (`tabIndex=0`, found with useOverflow), so the arrow keys scroll it; a block that fits is no stop." },
      { label: "Phone", text: "Inline code wraps anywhere; a block scrolls sideways inside its frame, never the page." },
    ],
  },
  {
    id: "copy",
    name: "Copy",
    group: "text",
    item: "copy",
    exports: ["Copy", "copyText"],
    summary:
      "A button that copies a value and says \"Copied\" for two seconds, to the eye and to a screen reader. Where the Clipboard API is unavailable (a page on http, an old browser) it uses the copy command; where that fails too, it says so and tells the page.",
    example: "live",
    usage: `import { Copy, copyText } from "@/components/s1lin/copy";

<Copy value={key} label="Copy API key" />
<Copy value={() => JSON.stringify(config, null, 2)} label="Copy the config" variant="go" size="md" />

const ok = await copyText(text);`,
    props: [
      { name: "value", type: "string | () => string", required: true, desc: "The text, or a function that gives it when pressed." },
      { name: "label", type: "string", desc: "The button's name: \"Copy API key\". Begin it with the visible word." },
      { name: "children", type: "ReactNode", default: "\"Copy\"", desc: "The visible word." },
      { name: "copiedText", type: "string", default: "\"Copied\"", desc: "The word after a copy." },
      { name: "failedText", type: "string", default: "\"Failed\"", desc: "The word when the copy failed." },
      { name: "messages", type: "{ copied, failed }", desc: "What a screen reader hears after each; translate here." },
      { name: "onCopy", type: "(ok: boolean) => void", desc: "After each press. On false, show the text to copy by hand (Secret does)." },
      { name: "variant", type: "ButtonVariant", default: "\"plain\"", desc: "The Button's look." },
      { name: "size", type: "\"md\" | \"sm\"", default: "\"sm\"", desc: "The Button's size." },
      CLASS,
      { name: "copyText", type: "(text, near?) => Promise<boolean>", desc: "The same, without a button. Pass the element pressed as `near`, so the fallback works inside a modal dialog." },
    ],
    notes: [
      { label: "Accessibility", text: "The result is said in a `role=\"status\"` beside the button, not in its name, so it is read once and the name stays \"Copy API key\"." },
      { label: "Network", text: "The Clipboard API needs a secure page (https or localhost); elsewhere the old copy command is used, which most browsers still allow on a click." },
    ],
  },
  {
    id: "secret",
    name: "Secret",
    group: "text",
    item: "secret",
    exports: ["Secret"],
    summary:
      "An API key as dots with its ends left showing, Show and Copy. Copy takes the whole key without showing it. While it is hidden the page holds only the dots and the ends, so the key is not in the HTML, a screenshot or the accessibility tree.",
    example: "live",
    usage: `import { Secret } from "@/components/s1lin/secret";

<Secret value={key.secret} label="API key" keep={[3, 4]} />`,
    props: [
      { name: "value", type: "string", required: true, desc: "The secret." },
      { name: "label", type: "string", default: "\"Secret\"", desc: "What it is: names the group and the buttons (\"Show API key\", \"Copy API key\")." },
      { name: "keep", type: "[number, number]", default: "[0, 4]", desc: "Characters left showing at the start and the end while hidden: `[3, 4]` shows \"sk-••••…a1b2\". None at all when they would show more than half the value." },
      { name: "revealed", type: "boolean", desc: "Shown, when controlled." },
      { name: "defaultRevealed", type: "boolean", default: "false", desc: "Shown at first, when not: a key shown once, at its creation." },
      { name: "onRevealedChange", type: "(revealed: boolean) => void", desc: "Called on Show and Hide." },
      { name: "noCopy", type: "boolean", default: "false", desc: "No Copy button." },
      { name: "words", type: "{ show, hide, hidden }", desc: "The words, translated." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "A group named by the label. Hidden, a screen reader hears \"API key, hidden\", not a string of dots; Show and Hide are named \"Show API key\" and \"Hide API key\" and keep the visible word first. If the copy fails, the key is shown and selected for copying by hand." },
      { label: "Phone", text: "The key breaks anywhere; the buttons wrap under it and take the row." },
    ],
  },
  {
    id: "visually-hidden",
    name: "VisuallyHidden",
    group: "text",
    item: "visually-hidden",
    exports: ["VisuallyHidden"],
    summary: "Words for screen readers only: a pixel square, clipped, out of the flow, and still read. For the name of a column of buttons, the word a shape stands for, a hint a picture gives.",
    example: "live",
    usage: `import { VisuallyHidden } from "@/components/s1lin/visually-hidden";

<th scope="col"><VisuallyHidden>Actions</VisuallyHidden></th>
<Button variant="icon"><svg aria-hidden="true" …/><VisuallyHidden>Close</VisuallyHidden></Button>`,
    props: [
      { name: "as", type: "\"span\" | \"div\" | \"p\"", default: "\"span\"", desc: "The element." },
      { name: "children", type: "ReactNode", required: true, desc: "The words." },
      CLASS,
    ],
    notes: [{ label: "Accessibility", text: "Hidden with clipping, not `display: none`, so it stays in the accessibility tree; it never makes the page wider." }],
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
    id: "use-overflow",
    name: "useOverflow",
    group: "hooks",
    item: "use-overflow",
    exports: ["useOverflow"],
    summary: "True while an element is wider than its box, so its content scrolls sideways. Table and Code make their frames focusable only then, so a keyboard can scroll a frame that needs it and skips one that fits.",
    example: "live",
    propsTitle: "Signature",
    props: [{ name: "useOverflow", type: "(ref) => boolean", desc: "`ref` to the box that scrolls; kept current as it or its first child changes size." }],
    usage: `const frame = useRef<HTMLDivElement>(null);
const over = useOverflow(frame);
<div ref={frame} tabIndex={over ? 0 : undefined} style={{ overflowX: "auto" }}>…</div>`,
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
