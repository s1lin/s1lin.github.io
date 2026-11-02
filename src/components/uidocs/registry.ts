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

export type GroupId = "start" | "foundations" | "parts" | "forms" | "data" | "navigation" | "overlays" | "feedback" | "text" | "hooks";

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
    blurb: "What every part is drawn in and says: the tokens, the night, the status hues, the words; and the head an app's parts sit under. Set them once and the parts take your colours, your night and your language.",
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
    id: "navigation",
    chapter: "Parts",
    name: "Navigation",
    blurb: "How a reader finds their way: the index beside these docs, and the sidebar of an app (chats, projects, settings), one part for both; and the language a page is read in. A list of links in a nav landmark, the current one marked for the eye and for a screen reader.",
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
  label: "Accessibility" | "Keyboard" | "Reduced motion" | "Phone" | "Dark mode" | "Cost" | "Network" | "Styles" | "Server" | "Icons" | "Chinese";
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
      "Every part is drawn in these CSS variables: a paper, a second paper for plates and wells, the ink, two greys, two hairline strengths, one accent, a light blue for \"here\", five typefaces and the Chinese faces they end in, the \"+\" marks, and the scheme for native controls. They come in with any part; set them to restyle the lot.",
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
      { name: "--s1-here", type: "colour", default: "#3780e6 · #7fb2ff", desc: "Here: the dot under the language in force (LangSwitch). A light blue in the status blue's hue, a mark beside the ink and weight that also say it (3.6:1 on paper, 8.9:1 at night). Set it to the ink for a switch in one ink." },
      { name: "--s1-ok", type: "colour", default: "unset: the ink", desc: "A good status: an ok badge's line and tick, a notice's edge, a meter's fill, a stat that rises, a switch that is on. See Theming." },
      { name: "--s1-ok-tint", type: "colour", default: "unset: the paper", desc: "The ground of an ok badge." },
      { name: "--s1-warn", type: "colour", default: "unset: the ink", desc: "A warning: a warn badge's line, hatch and triangle, a notice's hatched edge, a meter past its warning share." },
      { name: "--s1-warn-tint", type: "colour", default: "unset: the paper", desc: "The ground under a warn badge's hatch." },
      { name: "--s1-bad", type: "colour", default: "unset: the ink", desc: "An error: a bad badge's fill, a notice's double line and cross, a meter over its limit, a stat that falls." },
      { name: "--s1-bad-tint", type: "colour", default: "unset: the paper", desc: "A ground for your own bad rows and pills; no part draws it (the bad badge is solid)." },
      { name: "--s1-info", type: "colour", default: "unset: the ink", desc: "A note: an info badge's dotted line and ring, a notice's edge." },
      { name: "--s1-info-tint", type: "colour", default: "unset: the paper", desc: "The ground of an info badge." },
      { name: "--s1-on-status", type: "colour", default: "unset: the paper", desc: "The words on a solid status fill: the bad badge's." },
      { name: "--s1-chosen", type: "colour", default: "unset: the ink", desc: "The fill under the chosen option of a filled switcher: a segmented row's, a card's, a pressed ghost button's or chip's. Set it to your brand; see Switchers." },
      { name: "--s1-on-chosen", type: "colour", default: "unset: the paper", desc: "The words on `--s1-chosen`: 4.5:1 on it at least, by day and at night." },
      { name: "--s1-scheme", type: "light | dark", default: "light · dark", desc: "The colour scheme native controls are drawn in: a select's list, a number's arrows, a date's picker." },
      { name: "--s1-font-display", type: "font stack", default: "Instrument Serif… Chinese serif, Chinese sans, serif", desc: "Headlines. Chinese takes `--s1-font-cjk-serif`, then the Chinese sans: never SimSun." },
      { name: "--s1-font-sans", type: "font stack", default: "Inter Tight… var(--s1-font-cjk), sans-serif", desc: "Text, and the roundel's letter." },
      { name: "--s1-font-mono", type: "font stack", default: "JetBrains Mono… var(--s1-font-cjk), monospace", desc: "Labels, buttons, numbers. Chinese in a label is set in the Chinese sans, never in the browser's monospace (SimSun on Windows)." },
      { name: "--s1-font-cjk", type: "font list", default: "PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans SC, Noto Sans CJK SC, Source Han Sans SC", desc: "The Chinese sans faces every stack ends in, after its Latin faces and before its generic family: macOS, Windows, then Linux and Android. End your own sans and mono in it." },
      { name: "--s1-font-cjk-serif", type: "font list", default: "Noto Serif SC, Noto Serif CJK SC, Source Han Serif SC, Songti SC", desc: "The Chinese serif faces the display stack tries before the sans." },
      { name: "--s1-font-mincho", type: "font stack", default: "Shippori Mincho B1…", desc: "The Japanese word in a kicker or a label." },
      { name: "--s1-font-gothic", type: "font stack", default: "Zen Kaku Gothic New…", desc: "Japanese in text." },
      { name: "--s1-corners", type: "background", desc: "Eight gradients that draw a \"+\" at each corner of a box, in its text colour. Plate uses it; give any box an `::after` 11px larger with it." },
    ],
    usage: `/* your CSS: the press in one ink, and your own face for text, still ending in the Chinese faces */
:root {
  --s1-accent: var(--s1-ink);
  --s1-font-sans: "Geist", system-ui, "Segoe UI", var(--s1-font-cjk), sans-serif;
  --s1-font-mono: "Geist Mono", ui-monospace, Menlo, Consolas, var(--s1-font-cjk), monospace;
}
.dark { --s1-paper: #141816; }

<html lang="zh-CN">   <!-- say the language, so the parts set their Chinese labels for it -->`,
    notes: [
      { label: "Styles", text: "The typefaces are named first and fall back to the system's: load Instrument Serif, Inter Tight and JetBrains Mono (Fontsource has them all) for the site's look, or point the font tokens at your own." },
      { label: "Chinese", text: "Every stack ends in Chinese faces before its generic family, so Chinese is never left to the browser's own pick, which on Windows is SimSun (a thin, bitmap-hinted serif) for `monospace` and `serif`. They come after the Latin faces, so Latin text is set as before. A stack of your own should end in `var(--s1-font-cjk)` the same way. Set `lang` (`zh-CN`) on the page or the element: under it the parts' small mono labels drop their tracking and capitals and set Chinese at 12px and weight 500 at least." },
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
      "The parts are drawn in one ink, and a status says itself by its line, its fill and its shape. An app that wants hues sets the status tokens, which are left unset: a badge, a notice, a meter, a stat's change and a switch that is on then take them, and the shapes stay, so nothing rests on colour alone. Until they are set every status falls back to the ink around it, so a page that sets none looks as it always has. The chosen option of a filled switcher is the same: in reverse until `--s1-chosen` and `--s1-on-chosen` give it a brand.",
    example: "none",
    usage: `/* your theme, after the parts: the status hues, and the go button's shadow in your brand */
:root {
  --s1-ok: #1d733b;   --s1-ok-tint: #dce7de;
  --s1-warn: #925600; --s1-warn-tint: #ebe3d7;
  --s1-bad: #c0261b;  --s1-bad-tint: #f0ddda;
  --s1-info: #1f5fb8; --s1-info-tint: #dce4ed;
  --s1-on-status: #f6f6f4;   /* the words on the solid bad badge */
  --s1-accent: #0f7a6c;
  --s1-chosen: #0f7a6c;      /* the chosen segment, card, pressed toggle */
  --s1-on-chosen: #f6f6f4;   /* 4.8:1 on it */
}
/* night: the same names, on the selectors Dark mode lists */
.dark { --s1-ok: #5cc281; --s1-ok-tint: #1a281f; --s1-bad: #ff6b5e; --s1-on-status: #111; --s1-chosen: #3fd1b5; --s1-on-chosen: #0f0f0f; }

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

  {
    id: "head",
    name: "Head",
    group: "foundations",
    exports: [],
    summary:
      "The row at the top of an app: the brand (its mark, its name, the product in small capitals) at one end and the controls (the language, night and day) at the other, on one line and centred on it. Nothing there has a line round it, nor does any group: the language is a LangSwitch (the words, the one in force with a light-blue dot under it, the others dimmer), night and day a `ghost` icon button, each 30px tall.",
    example: "live",
    usage: `import { Button } from "@/components/s1lin/button";
import { LangSwitch } from "@/components/s1lin/lang-switch";
import { Moon, Sun } from "lucide-react";

const LANGS = [{ value: "en", label: "EN", name: "English", lang: "en" }, { value: "zh", label: "中文", lang: "zh-CN" }];

<header className="head">
  <a className="head__brand" href="/">
    <Logo className="head__mark" />
    <b className="head__name">TokensBeat</b>
    <span className="head__product">{t("Console")}</span>
  </a>
  <nav className="head__now">…</nav>
  <div className="head__controls">
    <LangSwitch label={t("Language")} options={LANGS} value={lang} onValueChange={setLang} />
    <Button variant="ghost" size="sm" icon={dark ? <Sun /> : <Moon />} onClick={flip}
      aria-label={dark ? t("Light mode") : t("Dark mode")} title={dark ? t("Light mode") : t("Dark mode")} />
  </div>
</header>

/* one row; everything in it centred on it: no baseline, no nudging by a pixel */
.head { display: flex; align-items: center; gap: 16px; height: 56px; padding: 0 16px; border-bottom: 1px solid var(--s1-rule); }
.head__brand { display: inline-flex; align-items: center; gap: 8px; height: 30px; color: var(--s1-ink); text-decoration: none; }
.head__mark { display: block; flex: none; width: 22px; height: 22px; }
.head__name { font: 700 15px/1 var(--s1-font-sans); }
.head__product {
  padding-left: 8px; border-left: 1px solid var(--s1-rule-strong);
  font: 500 11px/14px var(--s1-font-mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--s1-ink-2);
}
.head__product:lang(zh) { font-size: 12px; letter-spacing: 0; text-transform: none; }
.head__now { flex: 1; min-width: 0; }
.head__controls { display: flex; align-items: center; gap: 2px; }`,
    notes: [
      { label: "Styles", text: "One height for the row and one for what is in it: the controls are `sm` (30px: the LangSwitch, the icon buttons, a go button if the head has one), the brand is a 30px box, and the row centres them all, the mark too (`align-items: center`), never on a baseline and never nudged by a pixel or two. The brand's words are set at `line-height: 1`, so each box is its type and centres with it." },
      { label: "Accessibility", text: "The language is a LangSwitch: a group named by its label, each language a button (`aria-pressed`) or a link (`aria-current=\"page\"`) with its own `lang`, so 中文 is read as Chinese and set in the Chinese sans at 12px. The night button is a mark alone, so it has an `aria-label` and a `title`, both saying what it does next." },
      { label: "Phone", text: "When the row is short the product's name goes first; the mark, the name and the controls stay on the line." },
    ],
  },

  {
    id: "switchers",
    name: "Switchers",
    group: "foundations",
    exports: [],
    summary:
      "A switcher picks one state or one option of a few: a language, a view, a range, a filter, on or off. It never has a line: no border, frame or ring round it, round its group or between its options, in any state (owner, 2026-11-02: \"Never have border\"). It takes one of two designs. Dots, for a few words in a head, a foot or a toolbar: the one in force in the ink, a weight heavier, a dot under it in `--s1-here`, the others dimmer (LangSwitch, RadioGroup `dots`). Filled, for a segmented picker, a filter, a toggle and a switch: the chosen one on a fill (`--s1-chosen`, the ink until a theme sets it), the others words that tint under the pointer (RadioGroup `segmented` and `cards`, a `plain`, `ghost`, `icon` or `chip` Button with `aria-pressed`, Switch).",
    example: "live",
    usage: `import { Button } from "@/components/s1lin/button";
import { LangSwitch } from "@/components/s1lin/lang-switch";
import { RadioGroup } from "@/components/s1lin/radio-group";
import { Switch } from "@/components/s1lin/switch";

// dots: words in a head, a foot or a toolbar
<LangSwitch label={t("Language")} options={LANGS} value={lang} onValueChange={setLang} />
<RadioGroup legend={t("View")} hideLegend variant="dots" value={view} onValueChange={setView}
  options={[{ value: "chart", label: t("Chart") }, { value: "table", label: t("Table") }]} />

// filled: a picker, a filter, a toggle, a switch
<RadioGroup legend={t("Range")} hideLegend variant="segmented" value={range} onValueChange={setRange}
  options={["5m", "30m", "1h", "6h", "24h"].map((r) => ({ value: r, label: r }))} />
<Button variant="chip" size="sm" aria-pressed={platform === "openai"} onClick={…}>OpenAI</Button>
<Button variant="ghost" size="sm" aria-pressed={view === "grid"} onClick={…}>Grid</Button>
<Switch checked={board} onChange={(e) => setBoard(e.target.checked)}>Board</Switch>

/* your theme: the chosen fill in your brand (see Theming) */
:root { --s1-chosen: #0f7a6c; --s1-on-chosen: #f6f6f4; }

/* a switcher of your own: the same two designs, never a line */
.my-seg button { border: 0; background: none; color: var(--s1-ink-2); }
.my-seg button:hover { background: var(--s1-paper-2); color: var(--s1-ink); }
.my-seg button[aria-pressed="true"] { background: var(--s1-chosen, var(--s1-ink)); color: var(--s1-on-chosen, var(--s1-paper)); }
.my-seg button:focus-visible { outline: 2px solid var(--s1-ink); outline-offset: 2px; }
@media (forced-colors: active) {
  .my-seg button[aria-pressed="true"] { forced-color-adjust: none; background: Highlight; color: HighlightText; }
}`,
    notes: [
      { label: "Styles", text: "Which design: dots where the switch sits beside the brand or among small controls and a fill would make it the heaviest thing there (a language, a view in a toolbar); filled where the choice is the matter in hand (a range over a chart, a filter over a list, a setting). No divider between options: 2px of space does it, and the fill or the dot says which one is chosen. A tile of options (cards) is filled the same way, with no frame round each tile. Tabs are navigation, not switchers: they keep the bar under the open one." },
      { label: "Accessibility", text: "The roles stay what they are: radios in a `radiogroup` (RadioGroup), buttons with `aria-pressed` in a named group (LangSwitch, a ghost or chip toggle), a checkbox with `role=\"switch\"` (Switch). The chosen one is told by its fill or its dot and its weight together, never by a colour alone; the words on a fill are 4.5:1 at least, the off and on tracks of a switch 3:1 on the paper. The focus ring (2px, in the ink) shows only for the keyboard (`:focus-visible`) and is not a border. In forced colours the fills vanish, so the chosen segment, card or toggle is drawn in the system's `Highlight`, a dot in `CanvasText`, a switch's track in `GrayText` off and `Highlight` on, and the focus ring in `CanvasText`." },
      { label: "Dark mode", text: "The fill is `--s1-chosen`'s night value (the ink, light at night, until a theme sets one); the dot is `--s1-here`'s." },
    ],
    where: "The heads' language (LangSwitch), every RadioGroup, Switch and pressed ghost Button on this page; Life's tabs, levels, stages, tools and guides; the route map's key, the Metro2Line bar and the colophon's plates on the front page.",
  },

  // ------------------------------------------------------------ parts
  {
    id: "button",
    name: "Button",
    group: "parts",
    item: "button",
    exports: ["Button", "buttonClass", "ButtonProps", "ButtonVariant", "ButtonSize"],
    summary:
      "The house buttons. `plain` is a hairline box in mono type; `go`, the same in ink with an offset shadow in the accent, is for the one thing to do; `ghost` is the box without its line, for a head or a toolbar; `chip` is a pill; `link` is words underlined; `icon` is the plain box made square, for a mark with an aria-label. An action shows an icon and a word: Create, Edit, Delete, Save. Under the pointer every button turns over, the ink and the paper changing places; pressed, a box sinks into its shadow.",
    example: "live",
    usage: `import { Button } from "@/components/s1lin/button";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";   // or any svg

// an action: its icon, then its word
<Button variant="go" icon={<Plus />} onClick={create}>Create key</Button>
<Button icon={<Pencil />} onClick={edit}>Edit</Button>
<Button icon={<Trash2 />} onClick={remove}>Delete</Button>
<Button size="sm" icon={<X />} onClick={cancel}>Cancel</Button>
<Button variant="go" type="submit" icon={<Save />}>Save</Button>

// after the words: a link elsewhere, a menu's caret
<Button variant="link" href="https://docs.tokensbeat.com" iconEnd={<ArrowUpRight />}>Docs</Button>

// in a head or a toolbar: ghost, no line (the language beside it is a LangSwitch); a toggle's pressed one is filled
<Button variant="ghost" size="sm" aria-pressed={view === "grid"} onClick={…}>Grid</Button>
<Button variant="ghost" size="sm" icon={<Moon />} aria-label="Dark mode" title="Dark mode" onClick={…} />

// a dense row's mark alone: an aria-label for its name, a title for its tooltip
<Button variant="icon" size="sm" icon={<RefreshCw />} aria-label="Refresh" title="Refresh" onClick={reload} />`,
    props: [
      { name: "variant", type: "\"plain\" | \"go\" | \"ghost\" | \"chip\" | \"link\" | \"icon\"", default: "\"plain\"", desc: "Which button. `ghost` has no line and no paper, the ink fill under the pointer, the focus ring kept. A `plain`, `ghost` or `icon` button with `aria-pressed` is a toggle, a switcher: no line at all, the pressed one filled (`--s1-chosen`), the others in the second ink on no fill (see Switchers). A `chip` with `aria-pressed` is a filter, filled the same way. `icon` is 40px square (30px at `sm`) for an svg or one character, and needs an `aria-label`." },
      { name: "size", type: "\"md\" | \"sm\"", default: "\"md\"", desc: "`sm` is 30px tall in 11px type (12px for Chinese), for a row of small actions or a head." },
      { name: "icon", type: "ReactNode", desc: "A picture before the words: an svg (lucide's, or your own) drawn at 16px, 14px at `sm`, 6px from them, in the button's ink. It is `aria-hidden`; the words stay the name. With no words the button is a square and needs an `aria-label`, and a `title` for its tooltip." },
      { name: "iconEnd", type: "ReactNode", desc: "A picture after the words: `ArrowUpRight` on a link elsewhere, `ChevronDown` on a menu." },
      { name: "href", type: "string", desc: "Makes it a link, `<a>`, that looks the part; the other props go to the `<a>`." },
      { name: "type", type: "\"button\" | \"submit\" | \"reset\"", default: "\"button\"", desc: "As on `<button>`; it submits a form only when asked to." },
      CLASS,
      { name: "buttonClass", type: "({ variant, size }?, className?) => string", desc: "The same classes, for an element that cannot be a Button: a `<span>` chip, a `<label>`." },
    ],
    notes: [
      { label: "Icons", text: "An action button shows an icon and a word, everywhere: the icon says what kind of thing happens, the word says what. Create, New and Add: `Plus`. Edit: `Pencil`. Delete and Remove: `Trash2`. Save: `Save`. Cancel: `X`. Copy: `Copy` (the Copy part draws its own). Refresh: `RefreshCw`. Export: `FileDown`. Import: `FileUp`. Upload: `Upload`. Download: `Download`. Test: `PlugZap`. Send: `Send`. Search: `Search`. Revoke: `Ban`. Retry: `RotateCcw`. Sign out: `LogOut`. Settings: `Settings`. A link elsewhere: `ArrowUpRight` after the words. The names are lucide-react's; the kit brings no icons, so pass any 16px svg drawn in `currentColor`. An icon alone only in a dense toolbar or a row's actions, with an `aria-label` and a `title`." },
      { label: "Styles", text: "Under the pointer a button turns over: the ink and the paper change places, AA both ways, by day, at night and in a theme that brands the chosen fill (owner, 2026-11-02). `go`, the ink box, turns to the paper with its words and line in the ink, its accent shadow kept. `plain` and `icon` fill with the ink, the words or the mark in the paper. `ghost` has no line or paper to turn, so it takes the same ink fill (inverse, not a tint). `chip` fills as `plain` does. `link` fills its box's height and 6px either side of the words with the ink, the words and their line in the paper. Only what can be pressed turns (a `<span>` drawn with `buttonClass` does not), never a disabled one (`disabled`, `aria-disabled=\"true\"`), and never a toggle: with `aria-pressed` the switchers' rules hold, the others tinting and the pressed one keeping its chosen fill. An app recolours a button through the tokens (`--s1-ink`, `--s1-paper` on it or a parent, or `data-theme`), never by painting `.s1-btn` from its own stylesheet, which would beat the turn." },
      { label: "Accessibility", text: "A real `<button>` or `<a>`, every other prop passed on (`aria-*`, `disabled`, `ref`). The icon is `aria-hidden`, so a screen reader hears the words alone. Focus shows a 2px outline in the ink, outside the box, on `ghost` too and under the pointer. In forced colours a pressed toggle is drawn in `Highlight`, and a button under the pointer turns over in the system's button colours, `ButtonText` behind `ButtonFace` words." },
      { label: "Chinese", text: "Under `lang=\"zh-CN\"` an `sm` button sets its words at 12px, not 11px; the mono stack ends in the Chinese sans, so 新建 never falls to SimSun." },
      { label: "Reduced motion", text: "The press does not move, and the colours turn at once; elsewhere they ease over 120ms." },
    ],
    where: "The comments: Post, Load more, Use this, the model chip, Sign out. On this page: Copy, the dialogs, the menus, the head.",
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
      "A text box: a native `<input>` of any text type (text, number, search, password, email, url) in a hairline box, 40px tall as a Button or 30px as a small one, with words inside it before or after, and an action after it: a Button beside the box, outside it, as tall as it, with no line of its own. Never a box drawn in the box.",
    example: "live",
    usage: `import { Input } from "@/components/s1lin/input";

<Field label="Amount"><Input type="number" inputMode="decimal" min={5} prefix="$" suffix="USD" /></Field>
<Input type="search" size="sm" aria-label="Search keys" placeholder="Search keys" />
<Field label="Coupon">
  <Input action={<Button variant="ghost" icon={<Check />} onClick={apply}>Apply</Button>} />
</Field>`,
    props: [
      { name: "size", type: "\"md\" | \"sm\"", default: "\"md\"", desc: "40px tall in 16px type, or 30px in 14px (16px on a touch screen, which would zoom into smaller type)." },
      { name: "prefix", type: "ReactNode", desc: "Before the text, inside the box: a currency, a scheme. Words here are read as part of its description." },
      { name: "suffix", type: "ReactNode", desc: "After the text, inside the box: a unit. Words here are read as part of its description. A Button given here is set after the box, as `action` is." },
      { name: "action", type: "ReactNode", desc: "After the box, outside it, on its line: a Button that acts on what is typed (Apply, Max, Show), its icon and its word. It is drawn as a ghost (no line, no paper, a tint under the pointer) the box's height, 40px or 30px, whatever size it was given; a `link` Button stays words." },
      { name: "invalid", type: "boolean", desc: "In error without a Field around it; sets `aria-invalid`." },
      { name: "type", type: "string", default: "\"text\"", desc: "Any text type. Numbers are set in mono; give them `inputMode=\"decimal\"` for a phone's number pad." },
      { name: "className", type: "string", desc: "Added to the box (`s1-input`); every other prop goes to the `<input>`, `ref` too." },
    ],
    notes: [
      { label: "Accessibility", text: "A native input: its name comes from the Field's label, or give it `aria-label`. Focus draws a 2px ring in the ink round the whole box; in error the line doubles, so the state is not told by colour. Placeholder text is in the third ink and is never the label." },
      { label: "Dark mode", text: "Native parts of the control (a number's arrows, a search's clear) follow `--s1-scheme`." },
      { label: "Styles", text: "With an action the Input is a row (`s1-input__row`): the box takes the room, the action (`s1-input__action`) what it needs, 4px after the box, both the box's height and centred on one line. `className` still goes to the box." },
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
      "One choice of a few: native radios with one name in a fieldset that is the radiogroup. As a list, as cards to pick an amount or a plan, as a segmented row for a range (24h · 7d · 30d), or as dots, for a head or a toolbar. Cards, segments and dots are switchers: no line round an option or the group, the chosen card or segment filled, the chosen word marked by a dot (see Switchers).",
    example: "live",
    usage: `import { RadioGroup } from "@/components/s1lin/radio-group";

<RadioGroup legend="Amount" variant="cards" value={amount} onValueChange={setAmount}
  options={[{ value: "10", label: "$10", hint: "about 2M tokens" }, { value: "20", label: "$20" }]} />

<RadioGroup legend="Range" variant="segmented" defaultValue="7d"
  options={["24h", "7d", "30d"].map((r) => ({ value: r, label: r }))} />

// in a head or a toolbar: the words, the chosen one in the ink with a dot under it
<RadioGroup legend="View" hideLegend variant="dots" defaultValue="chart" options={…} />`,
    props: [
      { name: "legend", type: "ReactNode", required: true, desc: "What the choice is: the group's name." },
      { name: "options", type: "RadioOption[]", required: true, desc: "`{ value, label, hint?, disabled? }` each; the hint is read as the option's description." },
      { name: "value", type: "string", desc: "The chosen value, when controlled." },
      { name: "defaultValue", type: "string", desc: "The value chosen at first, when not." },
      { name: "onValueChange", type: "(value: string) => void", desc: "Called with the value chosen." },
      { name: "variant", type: "\"list\" | \"cards\" | \"segmented\" | \"dots\"", default: "\"list\"", desc: "Radios down the page; a tile each, in a grid that wraps, the chosen one filled; a row of short words, the chosen one filled (`--s1-chosen`, the ink until a theme sets it), the others tinted under the pointer; a row of words, the chosen one in the ink and a weight heavier with a dot under it in `--s1-here`, the others dimmer, for a head or a toolbar. None but the list has a line." },
      { name: "orientation", type: "\"vertical\" | \"horizontal\"", default: "\"vertical\"", desc: "A list's radios in a row that wraps." },
      { name: "quiet", type: "boolean", default: "false", desc: "Deprecated: the same as `variant=\"dots\"`, which it overrides." },
      { name: "hideLegend", type: "boolean", default: "false", desc: "The legend is read, not shown, where the row says what it is by itself." },
      { name: "name", type: "string", desc: "The radios' name in a form; one is made up if not given." },
      { name: "hint", type: "ReactNode", desc: "Under the legend." },
      { name: "error", type: "ReactNode", desc: "Under the options; the group is marked invalid." },
      { name: "required", type: "boolean", desc: "The group must have a choice." },
    ],
    notes: [
      { label: "Keyboard", text: "Native radios: Tab enters the group at the chosen radio (or the first), ↑ ↓ ← → move and choose, Tab leaves. Nothing is scripted." },
      { label: "Accessibility", text: "The fieldset has `role=\"radiogroup\"`, named by the legend, with `aria-invalid` and `aria-required` when they apply. Each radio is named by its label alone and described by its hint. Cards and segments show focus as a ring round the whole tile, dots round the word; only for the keyboard. In forced colours the chosen card or segment is drawn in `Highlight`, a chosen word's dot in `CanvasText`." },
      { label: "Phone", text: "Cards fall to one a row under 320px; a segmented row wraps." },
      { label: "Chinese", text: "Under `lang=\"zh-CN\"` a segmented row and dots set their words at 12px, never tracked or in capitals." },
    ],
  },
  {
    id: "switch",
    name: "Switch",
    group: "forms",
    item: "switch",
    exports: ["Switch", "SwitchProps"],
    summary: "On or off, taking effect at once: a native checkbox with `role=\"switch\"`, drawn as a filled track and a thumb, with no line round either: off, the track in the third ink and the thumb at the left; on, the track in the ink (or `--s1-ok`) and the thumb at the right. For a choice that waits for a Save, use a Checkbox.",
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
      { label: "Accessibility", text: "A screen reader hears a switch, on or off (`role=\"switch\"` on a checkbox, so the state is the checkbox's own). Space toggles it. Off and on differ in fill and in the thumb's side, not only in colour; each track is 3:1 or more on the paper, so the control is seen without a line. In forced colours the track stays, with no line, in the system's colours: `GrayText` off, `Highlight` on." },
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
        desc: "Rows in groups instead: each `{ key, heading, meta?, label?, mark?, rows, empty?, className?, style? }` is a `<tbody>` under a heading row across the table, `mark` before the heading (a Timetable's pill). `heading` and `meta` may be functions, told whether the group is open.",
      },
      { name: "rowKey", type: "keyof Row | (row, index) => Key", required: true, desc: "Each row's React key." },
      { name: "rowHeader", type: "string", default: "the first column", desc: "The column whose cells name their rows (`<th scope=\"row\">`)." },
      { name: "rowProps", type: "(row, index) => RowProps", desc: "Attributes for a row's `<tr>`: a class, `data-` attributes, a click that follows the row's own link." },
      { name: "rail", type: "(row, index) => ReactNode", desc: "Drawn first in each row's header cell, beside its words: a station on a rail (a Timetable's `TimetableRail`), joined to the rows above and below." },
      { name: "empty", type: "ReactNode", default: "\"Nothing here yet.\"", desc: "One row across the table when there are no rows: words, or an EmptyState. By default the `empty` of the words in force (`S1Words`)." },
      { name: "emptyMark", type: "ReactNode", desc: "A mark for the empty row (your one-colour logo): the words are then set as a small EmptyState under it. An `empty` that is already an element is shown as it is." },
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
    summary: "Nothing here yet, said plainly: an empty frame marked at its corners, or your app's own mark in one colour, a line in the display face, what to do next. For an empty list, a search with no results, a page before its first use.",
    example: "live",
    usage: `import { EmptyState } from "@/components/s1lin/empty-state";

<EmptyState title="No keys yet" action={<Button variant="go" onClick={create}>Create key</Button>}>
  <p>A key lets an app call the models on your balance.</p>
</EmptyState>

// your mark in place of the frame: a one-colour svg in currentColor (your logo)
<EmptyState mark={<Logo />} title="No friends yet" />
<Table … emptyMark={<Logo />} empty="No orders yet" />`,
    props: [
      { name: "title", type: "ReactNode", required: true, desc: "What is missing." },
      { name: "children", type: "ReactNode", desc: "Why, or what to do." },
      { name: "action", type: "ReactNode", desc: "The one thing to do." },
      { name: "size", type: "\"md\" | \"sm\"", default: "\"md\"", desc: "`sm` inside a table or a small panel." },
      { name: "mark", type: "ReactNode", desc: "Your own mark in place of the frame: a one-colour svg drawn in `currentColor` (an app's logo), 56px square, 40px at `sm`, in the second ink, so it is one colour on either paper. Hidden from screen readers. The kit brings none: pass yours." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "The frame, or the mark, is decorative; the title is a paragraph, not a heading, so it can sit in a table cell. Put a heading round it where it stands for a whole page." },
      { label: "Dark mode", text: "A mark drawn in `currentColor` takes the second ink of the paper it is on; an `<img>` keeps its own colours, so give it one that reads on both." },
    ],
  },
  {
    id: "metro-map",
    name: "MetroMap",
    group: "data",
    item: "metro-map",
    exports: ["MetroMap", "MetroMapProps", "MetroLine", "MetroStation", "MetroStatus", "MetroColour", "MetroFigure", "MetroZone", "MetroAxis", "MetroFare", "MetroInterchange", "MetroGlyph", "metroHue"],
    summary:
      "A metro map of prices, or of anything placed on one axis, in SVG. Each line starts at a roundel with its mark and runs in its colour; each station sits at its `x` on the axis (log by default), its label and value placed beside it by a collision pass, never on the track nor across another's leader, tiers further out or along the line with a leader when it is crowded. Zones lie behind as bands named at the top. Stations of different lines at one fare (within 5 %) meet at an interchange: a bar behind the tracks, a ring on each member's track and the fare on a tag, so a line that only passes crosses it unbroken; two stations of one line at one fare share a twin stop. Under 720px the axis runs down as a strip map with the words in one column: nothing scrolls sideways. Small trains ride the tracks; a line lights up under the pointer, stops and interchanges have tooltips, and `lit` / `onLit` tie it to a table beside it. A station's card can end in its status: a word in its tone and a strip of cells (a service's last 24 hours). Without an axis, a line's stations are evenly spaced in their order.",
    example: "live",
    usage: `import { MetroGlyph, MetroMap, type MetroLine, type MetroZone } from "@/components/s1lin/metro-map";

const lines: MetroLine[] = [
  { id: "gpt", name: "GPT", mark: <OpenAiLogo />, colour: "var(--c-vendor-openai)", stations: [
    { id: "gpt-5.5-nano", label: "gpt-5.5-nano", value: "0.05 / 0.40", x: 0.4, href: "?model=gpt-5.5-nano",
      note: "Input / output, USD per 1M tokens",
      status: { label: "Normal", tone: "ok", cells: ["neutral", "ok", "ok", /* … 24 */ "warn", "ok"],
        summary: "last 24 hours: 22 normal, 1 degraded, 1 without data" } },
    { id: "text-embedding-4", label: "text-embedding-4", value: "0.02 / 0.00", x: 0.02, kind: "input" },
  ] },
  { id: "gemini", name: "Gemini", colour: { light: "#c21919", dark: "#f44a37" }, stations: [ … ] },
];
const zones: MetroZone[] = [
  { id: "z1", from: null, to: 0.5, name: "Zone 1 · under $0.50" },
  { id: "z2", from: 0.5, to: 2, name: "Zone 2 · $0.50–2" },
  { id: "z3", from: 2, to: null, name: "Zone 3 · $2 and up" },
];

const [lit, setLit] = useState<string[] | null>(null);   // a table's rows light the map and back
<MetroMap lines={lines} zones={zones} details="price-table" lit={lit} onLit={setLit}
  axis={{ ticks: [0.1, 0.5, 2, 10], format: (v) => \`$\${v}\`, cue: { start: "← Cheaper", end: "Pricier →" } }}
  interchange={{ label: (f) => (f.exact ? \`$\${f.min}\` : \`$\${f.min}–\${f.max}\`), tip: "Same price: change here." }}
  caption="What you pay now, at standard hours."
  legend={<>USD per 1M tokens · <MetroGlyph kind="stop" />stop · <MetroGlyph kind="interchange" />same fare</>} />`,
    props: [
      {
        name: "lines",
        type: "MetroLine[]",
        required: true,
        desc: "Each `{ id, name, mark?, colour?, stations }`, top to bottom in the order given (keep it fixed: a line that moves with the prices cannot be found). A station is `{ id, label, value?, x?, kind?, unit?, href?, note?, figures?, status? }`: `x` its place on the axis (null or missing: not drawn), `kind: \"input\"` a square stop, `unit` what `x` is in where one map mixes units (stations meet only within one), `status` a MetroStatus for its card. A line with no station to draw is left off; with none at all the map shows `empty`.",
      },
      { name: "axis", type: "{ scale?, domain?, ticks?, format?, cue? }", desc: "Stations placed by their `x`: log by default (`scale: \"linear\"`), from the cheapest ÷ 1.7 to the dearest × 1.7 unless `domain` says; `ticks` marked under the map in `format`; `cue` the words at the two ends above it. Without an axis, each line's stations are evenly spaced in their order." },
      { name: "zones", type: "MetroZone[]", desc: "Bands of the axis, each `{ id, from, to, name }` (null is open), shaded in turn with a dashed hairline at each edge and the name at the top (up the left edge, down a phone). A station's tooltip names its zone." },
      { name: "interchange", type: "{ tolerance?, label?, announce?, tip? } | false", desc: "Stations of two lines or more within `tolerance` (1.05) of their run's cheapest meet at one x: a bar behind the tracks, a ring on each member's track, `label(fare)` on a tag (\"$0.40\", \"$2.20–2.25\"). `announce` is what a screen reader hears (\"Same fare: a, b and c, $0.40\" by default), `tip` a line in its tooltip. `false`: never. Runs compare with their cheapest, so near fares never chain, and stay within one `unit`." },
      { name: "layout", type: "\"auto\" | \"across\" | \"down\"", default: "\"auto\"", desc: "Across: the axis left to right. Down: a strip map, the axis top to bottom, tracks side by side at the left, zones as rungs, the words in one column at the right with leaders. Auto: down in a frame under 720px." },
      { name: "lit", type: "string[] | null", desc: "Stations the app lights, by id (a table row under the pointer): their stop fills, their line lights up and the others step back, and the first one's tooltip opens. The map's own pointer and focus come first." },
      { name: "onLit", type: "(ids: string[] | null) => void", desc: "Called with the ids of a stop's stations (or an interchange's) when the pointer or focus comes to it, and null when it leaves: light their rows. Not called for `lit`." },
      { name: "caption", type: "ReactNode", desc: "What the map shows, under it: the figure's `<figcaption>`." },
      { name: "legend", type: "ReactNode", desc: "A key beside the caption, in mono caps: what \"1.60 / 8.00\" is in, and the shapes, with `<MetroGlyph kind=\"stop\" | \"input\" | \"interchange\" />`." },
      { name: "label", type: "string", desc: "A name for the drawing itself (its `role=\"group\"`)." },
      { name: "trains", type: "boolean", default: "true", desc: "Small trains in the ink ride each track to its terminus and back, stopping at every stop. Never under reduced motion." },
      { name: "loading", type: "boolean | number", default: "false", desc: "Ghost lines in the hairline (4, or the number given) while the data comes, and `aria-busy` on the figure." },
      { name: "empty", type: "ReactNode", default: "\"Nothing here yet.\"", desc: "Shown when no station can be drawn: words, set as an EmptyState, or your own node." },
      { name: "emptyMark", type: "ReactNode", desc: "Your one-colour mark for that EmptyState." },
      { name: "details", type: "string", desc: "The id of the same data as a table (a Timetable, a list), named in the figure's `aria-details`: the drawing's text alternative." },
      { name: "MetroStatus", type: "{ label, tone?, cells?, summary? }", desc: "A station's `status`, under its value on its card: `label` the word (\"Normal\", \"No status yet\"), set in mono caps with the Glyph of its `tone` (`ok`, `warn`, `bad`, `info` or `neutral`, the default) in the theme's status hue; `cells` a strip, oldest first, a tone a cell (ok full, warn hatched and shorter, bad short, neutral a dotted outline: no data); `summary` what the strip shows, said after the word in the station's name. In an interchange's tooltip each member shows its tone's glyph. No `status`: no line. The words are the app's: the kit adds none." },
      { name: "MetroGlyph", type: "({ kind }) => JSX.Element", desc: "A legend's shape: `stop` (a ring), `input` (a square), `interchange` (a bar)." },
      { name: "metroHue", type: "(colour?: MetroColour) => string | undefined", desc: "A line's colour as the CSS value the map draws it in (`--s1-metro-hue`): a pair becomes `light-dark()`, and a hex too dark (or too light) for one paper gives way to the ink there. For a row or a band of your own beside the map." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "A `<figure>` with its caption and `aria-details` naming the table of the same data. The drawing is a group with a name; each line a group named by its line; each station a link (with `href`) named \"label, value\" (then its status's word and summary), two at a twin stop, each its own; each interchange is focusable and named by `announce`. Roundels, tracks, zones, bars and trains are hidden from screen readers; the tooltip repeats what the station already says. Colour never stands alone: the mark, the line's place, the label and the stop's shape say it too, and a status by its glyph, its word and each cell's shape. In forced colours, tracks, stops, rings, bars and tags are drawn in `CanvasText` on `Canvas`, the zones' shading dropped, a status's word and strip drawn in `CanvasText` (the cells still told by their shape), and a lit stop fills in `Highlight`." },
      { label: "Keyboard", text: "Tab reaches each stop with a link in line order, then each interchange; focus lights the line and opens the tooltip; Esc closes it." },
      { label: "Reduced motion", text: "The trains are hidden and their clock is stopped (`pauseAnimations`); a line lights up without a fade." },
      { label: "Phone", text: "In `auto`, a frame under 720px draws the strip map: the lines side by side, the cheapest at the top, the words in one relaxed column on the right, joined to their stops by leaders. Nothing scrolls sideways; a label longer than the column ends in \"…\" (the link's name keeps it whole)." },
      { label: "Dark mode", text: "Give each line a pair, `{ light, dark }`, or a token your theme sets for both. A hex that would vanish into one paper is drawn in the ink there. Values are set in the line's colour, so pick colours that read as text on the paper (4.5:1), and check neighbouring lines apart (a validator's adjacent pairs) in both themes." },
      { label: "Server", text: "The server's HTML draws the map 960px wide; the browser measures the frame before the first paint and lays it out again for it. Where the data comes after hydration, there is no shift." },
      { label: "Chinese", text: "The cue, the zone names, the tooltip's heading and the legend are set at 12px, never tracked or cased, in the kit's Chinese faces; label widths count a Chinese character as nearly two. Translate `sameFare` and `and` in `S1Words`." },
    ],
  },
  {
    id: "timetable",
    name: "Timetable",
    group: "data",
    item: "timetable",
    exports: ["Timetable", "TimetableProps", "TimetableRail", "TimetableMark"],
    summary:
      "The kit's Table in a MetroMap's hand: a station's departures board. Not a separate data path: the same columns, rows, groups, sort and links, styled. A group's band is a wash of its line's colour with the line's pill (`mark`, a TimetableMark: a logo in a roundel of paper, the name in mono caps); each row's header cell starts with its station on a rail (`rail`, a TimetableRail), joined to the rows above and below; figures sit at the end of their cells in mono with one width. Rows light from the map through `rowProps` (`data-lit`), and the row a map's price comes from fills its ring (`data-fare=\"here\"`).",
    example: "live",
    usage: `import { Timetable, TimetableMark, TimetableRail } from "@/components/s1lin/timetable";
import { metroHue } from "@/components/s1lin/metro-map";

<Timetable id="price-table" caption="Prices of every model, by group" columns={columns} rowKey="key"
  collapsible expandAll
  rail={(r) => <TimetableRail stop={r.period ? "period" : r.cheapest ? "here" : "ring"} />}
  rowProps={(r) => ({
    style: { "--s1-metro-hue": metroHue(r.colour) },
    "data-lit": lit?.includes(r.model) || undefined,
    onPointerEnter: () => setLit([r.model]), onPointerLeave: () => setLit(null),
  })}
  groups={groups.map((g) => ({
    key: g.id, label: g.name, rows: g.rows,
    mark: <TimetableMark mark={<Logo />}>{g.platform}</TimetableMark>,
    heading: <h3>{g.name}</h3>, meta: \`\${g.rows.length} models\`,
    style: { "--s1-metro-hue": metroHue(g.colour) },
  }))} />`,
    props: [
      { name: "TableProps", type: "TableProps<Row>", desc: "Every prop of Table, as Table takes them: `columns`, `rows` or `groups`, `rowKey`, `sort`, `collapsible`, `expandAll`, `fit`… Table's `rail` and a group's `mark` are where the board's station and pill go." },
      { name: "board", type: "boolean", default: "false", desc: "On its own black board, as a station's departures are, in either theme (the night's tokens on the board)." },
      { name: "id", type: "string", desc: "The element's id: give the same to the MetroMap's `details`." },
      { name: "TimetableRail", type: "({ stop?, colour? }) => JSX.Element", desc: "A row's station: a track in the row's colour (`--s1-metro-hue`, or `colour`) with a ring; `stop=\"here\"` fills it, `\"period\"` draws a thin dashed track and no ring (a time-of-day row under its model)." },
      { name: "TimetableMark", type: "({ mark?, colour?, children }) => JSX.Element", desc: "A band's pill in its line's colour: `mark` (a logo, `currentColor` takes the ink) in a roundel of paper, then the name." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "A real `<table>` (Table's): the caption names it, each row's header cell names its row (the rail is hidden), each band is a `<tbody>` named by its heading. The rails and pills are colour with a name beside them, never colour alone. Beside a map, keep one state of lit stations: the map's `onLit` sets it, and each row's pointer and focus; the map takes it as `lit`, the rows as `data-lit`, so a station lights every row of its model and the row its price comes from lights strongest." },
      { label: "Phone", text: "Table's: cells keep to one line and the table scrolls in its frame, or give `fit`; the rail stays." },
      { label: "Dark mode", text: "The rows' and bands' colours are the map's (`metroHue`), drawn in the paper's scheme; the washes mix them into the paper, so they hold in both themes. On `board` the night's, in either." },
      { label: "Chinese", text: "A pill's Chinese is set at 12px and 500, never tracked or cased." },
    ],
  },

  // ------------------------------------------------------------ overlays
  {
    id: "side-nav",
    name: "SideNav",
    group: "navigation",
    item: "side-nav",
    exports: ["SideNav", "SideNavProps", "SideNavItem", "SideNavSection", "SideNavLinkProps"],
    summary:
      "The index beside these docs, as a part: a title in small capitals over a rule; chapters in mono capitals, numbered; families with a count; items in the sans on a hairline rail, the current one in the ink with a 2px bar and no ground. An app's sidebar adds what it needs: an icon before an item, a time or a count after it, a status mark, an action at the end of a section (a \"+\"), nested items, sections that open and close. It folds to a rail of icons, and on a phone it is one bar that says where you are and opens the tree as a sheet.",
    example: "live",
    usage: `import { SideNav, type SideNavSection } from "@/components/s1lin/side-nav";
import { Button } from "@/components/s1lin/button";
import { Link } from "react-router-dom";
import { MessageSquare, Plus } from "lucide-react";

const sections: SideNavSection[] = [
  {
    id: "chats", title: t("Chats"),
    action: <Button variant="ghost" size="sm" icon={<Plus />} aria-label={t("New chat")} title={t("New chat")} onClick={newChat} />,
    items: chats.map((c) => ({
      id: c.id, label: c.title, href: \`/chat/\${c.id}\`, icon: <MessageSquare />,
      meta: ago(c.updated),                                   // "2m"
      status: c.running ? "info" : undefined, statusLabel: t("running"),
    })),
  },
  { id: "projects", title: t("Projects"), count: projects.length, collapsible: true, items: … },
];

<SideNav
  label={t("Main")} title="Aha" sections={sections}
  current={chatId}                                            // aria-current="page" on it
  renderLink={({ href, ...link }) => <Link to={href} {...link} />}
  expanded={open} onExpandedChange={setOpen}                 // or defaultExpanded, and let it keep them
  rail={folded}                                              // icons only, the labels as tooltips
  sheet={1023}                                               // up to 1023px: one bar, the tree as a sheet
/>

// the docs' index: numbered chapters, families with a count, places on one page
<SideNav label="Library" title="Index" currentType="location" sheet={900} sections={chapters} current={active} here={where} />`,
    props: [
      { name: "label", type: "string", required: true, desc: "The nav landmark's name: \"Main\", \"Library\", \"Account\"." },
      { name: "sections", type: "SideNavSection[]", required: true, desc: "The tree. A section: `{ id, title?, text?, number?, count?, action?, href?, onSelect?, collapsible?, defaultOpen?, sections?, items?, lang? }`. A `number` sets it as a chapter (mono capitals, its contents indented); without one it is a family or a list (smaller capitals, `count` or `action` at the end). A section with no title shows its items alone." },
      { name: "SideNavItem", type: "{ id, label, text?, href?, onSelect?, icon?, meta?, status?, statusLabel?, items?, disabled?, lang? }", desc: "An item: `href` makes it a link (through `renderLink`), else a button that calls `onSelect`. `icon` 16px before the label; `meta` after it in mono (\"2m\", a count, a Badge); `status` a Glyph shape, said by `statusLabel`; `items` nest under it. `text` is the label in plain words where it is not a string." },
      { name: "title", type: "ReactNode", desc: "The line over the tree, in small capitals over a rule: \"Index\"." },
      { name: "titleAction", type: "ReactNode", desc: "At the end of the title's line: Buttons (a new chat, fold the sidebar)." },
      { name: "current", type: "string | null", desc: "The id of the item or section you are at. It is marked `aria-current`, in the ink, with the 2px bar; the sections round it say `aria-current=\"true\"`." },
      { name: "currentType", type: "\"page\" | \"location\" | \"step\" | \"true\"", default: "\"page\"", desc: "What `aria-current` says on the current one: `page` for routes, `location` for places on one page (these docs)." },
      { name: "renderLink", type: "(link: SideNavLinkProps) => ReactNode", desc: "Your router's link: it is handed `href`, `className`, `aria-current`, `onClick`, `title`, `lang` and `children`; spread them on it. A plain `<a>` without it." },
      { name: "onNavigate", type: "(target) => void", desc: "After every choice (the item's own `onSelect` first). The phone's sheet closes by itself." },
      { name: "expanded", type: "string[]", desc: "The collapsible sections that are open, when the app keeps them (in storage, in the route)." },
      { name: "defaultExpanded", type: "string[]", desc: "Open at first, when it does not; else each collapsible section's `defaultOpen` (open unless false)." },
      { name: "onExpandedChange", type: "(expanded: string[]) => void", desc: "Called with the open ids when a head is pressed." },
      { name: "rail", type: "boolean", default: "false", desc: "Icons only (a section's first letter where an item has none): the labels stay for screen readers and come up as tooltips; heads, times and the footer go." },
      { name: "sheet", type: "boolean | 640 | 768 | 900 | 1023", default: "false", desc: "Up to this width the tree waits behind one bar (the title, where you are, a \"+\") and opens as a sheet over the page: focus goes in, Tab stays in it, Esc, a choice or a tap outside closes it. `true`: always. Without script the tree stays in the page." },
      { name: "here", type: "ReactNode", desc: "Where you are, on the bar: the current section and item by default (\"Editorial · Button\")." },
      { name: "barLabel", type: "ReactNode", desc: "The bar's label; the title by default." },
      { name: "followCurrent", type: "boolean", default: "true", desc: "When the tree scrolls in its own box, keep the current item in view by scrolling that box alone, never the page." },
      { name: "footer", type: "ReactNode", desc: "Under the tree: the account, a note." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "A `nav` landmark named by `label`; the tree is lists (`ol` of sections, `ul` of items), so a screen reader says how many. The current item has `aria-current`; a collapsible head is a button with `aria-expanded` and `aria-controls`; icons are hidden and a status mark is said by its `statusLabel`. In the rail the label is still the item's name, and its tooltip. Focus is a 2px ring in the ink." },
      { label: "Keyboard", text: "Tab through the links; Enter follows one. On a phone the bar opens the sheet and focus goes to the current item; Tab and Shift+Tab stay among the bar and the sheet; Esc closes it and gives focus back to the bar." },
      { label: "Phone", text: "Turn the sheet on below your breakpoint with `sheet` (640, 768, 900, 1023 or `true`), all in CSS, so the server's HTML is right on any screen. Rows get taller in the sheet for a thumb." },
      { label: "Styles", text: "The nav sets no type of its own; the indent under a chapter is 2.4ch + 10px of the page's type, or `--s1-sidenav-indent`. Hold it in place (sticky, a scrolling box) from your own CSS: these docs keep the panel (`s1-sidenav__panel`) in a box that scrolls and fades at its foot." },
      { label: "Chinese", text: "Under `lang=\"zh-CN\"` the title, the heads and the bar's label drop their tracking and capitals and are 12px; times and counts are 500." },
    ],
    where: "This page's index, on the left (on a phone, the bar under the running head); the app sidebar in the example.",
  },
  {
    id: "lang-switch",
    name: "LangSwitch",
    group: "navigation",
    item: "lang-switch",
    exports: ["LangSwitch", "LangSwitchProps", "LangOption", "LangSwitchLinkProps"],
    summary:
      "The language switch of an app's head, its foot and its phone sheet: the languages as words, each written in itself (EN, 中文), with no line, box or fill round them or round the group. The one in force is in the ink, a weight heavier, with a dot centred under it in the light blue of `--s1-here`; the others are dimmer, and the pointer raises them. Buttons for a language kept in state, or links to the page in each language.",
    example: "live",
    usage: `import { LangSwitch } from "@/components/s1lin/lang-switch";

const LANGS = [
  { value: "en", label: "EN", name: "English", lang: "en" },
  { value: "zh", label: "中文", lang: "zh-CN" },
];

// a language kept in state: buttons, the one in force aria-pressed
<LangSwitch label={t("Language")} options={LANGS} value={lang} onValueChange={setLang} />

// a page in each language: links, the one in force aria-current="page"; 24px in a foot
<LangSwitch label={t("Language")} value={lang} size="xs" options={LANGS.map((l) => ({ ...l, href: pathIn(l.value) }))} />

// through your router
<LangSwitch label={t("Language")} value={lang} options={routes} renderLink={({ href, ...link }) => <Link to={href} {...link} />} />`,
    props: [
      { name: "label", type: "string", required: true, desc: "The group's name, in the page's language: \"Language\", \"语言\"." },
      { name: "options", type: "LangOption[]", required: true, desc: "The languages, in the order shown: `{ value, label, name?, lang, href? }`. `label` is what shows, written in that language (\"EN\", \"中文\"); `name` its full name where the label is short (\"English\"), for screen readers; `lang` its tag (\"zh-CN\"); `href` makes it a link to this page in that language." },
      { name: "value", type: "string", required: true, desc: "The `value` of the language in force." },
      { name: "onValueChange", type: "(value: string) => void", desc: "Called with the language chosen: a button's press, or a link's click before it is followed. Never for the one in force." },
      { name: "renderLink", type: "(link: LangSwitchLinkProps) => ReactNode", desc: "Your router's link, for the options with an `href`: it is handed `href`, `className`, `lang`, `hrefLang`, `aria-label`, `aria-current`, `onClick` and `children`; spread them on it. A plain `<a>` without it." },
      { name: "size", type: "\"md\" | \"sm\" | \"xs\"", default: "\"sm\"", desc: "One height, as the buttons beside it: `sm` 30px for a head, `md` 40px for a phone's sheet or a form, `xs` 24px (the least a target may be) for a foot or a line of text." },
      CLASS,
    ],
    notes: [
      { label: "Styles", text: "Why words and a dot: a choice of two or three is read at a glance, so the switch takes the least ink that still says which one is in force. A box round the pair, or a filled segment, made it the heaviest thing in the head, heavier than the one thing to do (owner, 2026-11-02: \"no outside border is the key\"). The dot says \"here\" as the index's 2px bar does, without a box; it is the head's only colour beside the brand, a light blue (`--s1-here`, the status blue's hue), so it reads as neither an action (the go button's shadow) nor a status. The others are halfway from the second ink to the third (`--s1-lang-dim` on the group): 4.9:1 on paper, 6.5:1 at night, dim and still AA. Latin is set in mono capitals as the head's labels are; the dot is centred under the letters, not under their tracking." },
      { label: "Accessibility", text: "A group named by `label`. Each language is a `<button>` with `aria-pressed`, or a link with `aria-current=\"page\"` on the one in force, and carries its own `lang` (a link `hrefLang` too), so 中文 is read as Chinese; a short label is named in full by `name`, which contains it (EN, English). The one in force is told by the ink, the weight and the dot together, never by a colour alone; in forced colours the dot is drawn in the text's colour. Every target is 24px square at least (30px at `sm`), with a 2px focus ring in the ink." },
      { label: "Keyboard", text: "Tab to each language; Enter (and Space on a button) chooses it. Pressing the one in force does nothing." },
      { label: "Reduced motion", text: "Where motion is welcome the dot grows in under the new language in 160ms and the ink eases; under `prefers-reduced-motion: reduce` both are simply there. The dot never slides from one language to the other: each has its own." },
      { label: "Chinese", text: "中文 is set in the Chinese sans (`--s1-font-cjk`, never SimSun), at 12px (13px at `md`), never tracked or in capitals, whatever the language of the page around it." },
      { label: "Dark mode", text: "`--s1-here` is #3780e6 on paper and #7fb2ff at night; the dimmer ink follows the inks." },
      { label: "Phone", text: "Two languages fit a phone's head at `sm`. Where the head is full, take the switch out of it and put one at `md` in the sheet the head opens." },
    ],
    where: "The head example (Foundations, Head), the Switchers example and the Button example's head row on this page; the heads and foot of the TokensBeat apps.",
  },
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
    id: "popover",
    name: "Popover",
    group: "overlays",
    item: "popover",
    exports: ["Popover", "PopoverProps"],
    summary:
      "A panel that opens beside its button, over the page but not modal: a short form, a date picker, a list to choose from, help for the controls. It sits in the top layer (the Popover API), so no frame clips it; it opens on its side, or the other when there is no room, and is never taller than the room it has. Esc, a press outside or focus moving elsewhere closes it.",
    example: "live",
    usage: `import { Popover } from "@/components/s1lin/popover";

<Popover trigger={<Button icon={<CircleHelp />}>Keys</Button>} side="bottom" align="end" label="Keyboard help">
  <p>← → move, Space jumps, Z undoes.</p>
</Popover>

// kept by the app, closed after a choice
<Popover open={open} onOpenChange={setOpen} trigger={<Button>{date}</Button>} align="start">
  <Calendar value={date} onChange={(d) => { setDate(d); setOpen(false); }} />
</Popover>`,
    props: [
      { name: "trigger", type: "ReactElement", required: true, desc: "The one element that opens it: a `<button>` or a Button. It is given `aria-haspopup=\"dialog\"`, `aria-expanded`, `aria-controls`, an id when it has none, and a click that opens and closes the panel after its own `onClick` (which may `preventDefault()` to keep it as it is)." },
      { name: "children", type: "ReactNode", desc: "What the panel holds; mounted only while it is open." },
      { name: "open", type: "boolean", desc: "Open or not, when the app keeps it." },
      { name: "defaultOpen", type: "boolean", default: "false", desc: "Open at first, when the popover keeps its own state." },
      { name: "onOpenChange", type: "(open: boolean) => void", desc: "Called with the next state: the trigger pressed, Esc, a press outside, focus gone elsewhere." },
      { name: "side", type: "\"bottom\" | \"top\"", default: "\"bottom\"", desc: "Below the trigger or above it; the other side when the panel does not fit and there is more room there." },
      { name: "align", type: "\"start\" | \"center\" | \"end\"", default: "\"center\"", desc: "Which edge of the trigger the panel lines up with, or its middle; kept 8px inside the screen either way." },
      { name: "offset", type: "number", default: "6", desc: "Pixels between the trigger and the panel." },
      { name: "label", type: "string", desc: "The panel's name (`aria-label`), when no heading inside names it." },
      { name: "initialFocus", type: "RefObject<HTMLElement>", desc: "What to focus on opening; by default the first element with `data-autofocus`, else the panel itself." },
      CLASS,
    ],
    notes: [
      { label: "Keyboard", text: "Enter or Space on the trigger opens it, and focus goes into the panel; Tab moves on through what is in it, and past its end closes it; Esc closes it and gives focus back to the trigger, and is kept from a Dialog around it." },
      { label: "Accessibility", text: "A non-modal `dialog`, controlled by its trigger (`aria-expanded`, `aria-controls`); the page stays live. Closed with focus inside (Esc, or a choice that closes it), focus goes back to the trigger; closed by a press elsewhere, focus goes where the press puts it." },
      { label: "Phone", text: "Kept 8px inside the screen and never wider than the screen less 16px; `--s1-popover-room`, set on the panel as it opens, is the height it has on its side, and caps it, so a long panel scrolls inside." },
      { label: "Styles", text: "It sets no width: it is as wide as what it holds, up to 360px; give it a width, a padding or a taller cap in your own CSS, `max-height: min(560px, var(--s1-popover-room))`." },
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
      "A button, its mark and the word Copy, that copies a value and says \"Copied\" for two seconds, to the eye and to a screen reader. Where the Clipboard API is unavailable (a page on http, an old browser) it uses the copy command; where that fails too, it says so and tells the page.",
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
      { name: "icon", type: "ReactNode | null", default: "two sheets", desc: "The picture before the word, as on Button: the house's two sheets, a tick after a copy and a cross after a refusal. Give lucide's `Copy` or your own; `null` for the word alone." },
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
      "An API key as dots with its ends left showing, in a box of its own; after the box, outside it, Show and Copy, each with its mark (an eye, two sheets), as ghost buttons the box's height: never segments drawn inside the box. Copy takes the whole key without showing it. While it is hidden the page holds only the dots and the ends, so the key is not in the HTML, a screenshot or the accessibility tree.",
    example: "live",
    usage: `import { Secret } from "@/components/s1lin/secret";

<Secret value={key.secret} label="API key" keep={[3, 4]} />
<Secret value={webhook.secret} label="Webhook secret" size="sm" noCopy />`,
    props: [
      { name: "value", type: "string", required: true, desc: "The secret." },
      { name: "label", type: "string", default: "\"Secret\"", desc: "What it is: names the group and the buttons (\"Show API key\", \"Copy API key\")." },
      { name: "keep", type: "[number, number]", default: "[0, 4]", desc: "Characters left showing at the start and the end while hidden: `[3, 4]` shows \"sk-••••…a1b2\". None at all when they would show more than half the value." },
      { name: "revealed", type: "boolean", desc: "Shown, when controlled." },
      { name: "defaultRevealed", type: "boolean", default: "false", desc: "Shown at first, when not: a key shown once, at its creation." },
      { name: "onRevealedChange", type: "(revealed: boolean) => void", desc: "Called on Show and Hide." },
      { name: "noCopy", type: "boolean", default: "false", desc: "No Copy button." },
      { name: "words", type: "{ show, hide, hidden }", desc: "The words, translated." },
      { name: "size", type: "\"md\" | \"sm\"", default: "\"md\"", desc: "The value's box 40px tall, as an Input, or 30px; Show and Copy are `ghost` Buttons of that size, so they are the box's height." },
      CLASS,
    ],
    notes: [
      { label: "Accessibility", text: "A group named by the label. Hidden, a screen reader hears \"API key, hidden\", not a string of dots; Show and Hide are named \"Show API key\" and \"Hide API key\" and keep the visible word first. If the copy fails, the key is shown and selected for copying by hand." },
      { label: "Phone", text: "The key breaks anywhere; the buttons wrap under the box." },
      { label: "Styles", text: "The group (`s1-secret`) is the row: the box (`s1-secret__value`) takes the room, the buttons (`s1-secret__actions`) what they need, 4px after it, centred on its line. As an Input's action is set." },
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
  { name: "Runhead", sources: ["src/components/Runhead.tsx"], exports: ["Runhead"], where: "/ui/", why: "The running head: the mark and S1LIN on one line, the section being read, and the night toggle, 夜 · and a moon (a ghost Button with aria-pressed, filled at night). The bar at the top of this page." },
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
