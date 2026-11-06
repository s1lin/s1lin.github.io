/*
 * What the search on /ui/ finds, as data: every place the page's index links to (a group, an item, the site parts)
 * and each site part's row, built from the same inventory the page and its index are set from (registry.ts), so a
 * new part is found by its name, its Chinese name, its first line and its keywords with no list of its own. No JSX,
 * so test/uidocs-search.test.ts reads it under `node --test`.
 */
import { ENTRIES, GROUPS, LISTED, SITE, type GroupId } from "./registry.ts";

/** One of the page's sections, as the results are grouped: a group, or the site parts. */
export interface Section {
  id: GroupId | typeof SITE.id;
  name: string;
  zh: string;
}

/** A place on the page the search can take the reader to. */
export interface Place {
  /** The anchor it goes to. */
  id: string;
  /** The heading there, which takes focus. */
  heading: string;
  name: string;
  zh?: string;
  /** What it is, in a line: the first clause of its summary. */
  line: string;
  kind: "section" | "part" | "site";
  section: Section["id"];
  keywords: string[];
}

export const SECTIONS: Section[] = [...GROUPS.map(({ id, name, zh }) => ({ id, name, zh })), SITE];

/** A summary's first clause, plain: up to its first full stop, colon or semicolon, `code` marks dropped. */
export function lineOf(text: string): string {
  const plain = text.replace(/`([^`]+)`/g, "$1");
  const end = plain.search(/[.:;](\s|$)/);
  return (end > 0 ? plain.slice(0, end) : plain).trim();
}

/** A site part's anchor: its row in the list at the foot of the page. */
export const siteRowId = (name: string) => `site-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

/** In the page's order: each group, then its items; then the site parts and each of their rows. */
export const PLACES: Place[] = [
  ...GROUPS.flatMap((g): Place[] => [
    { id: g.id, heading: `${g.id}-h`, name: g.name, zh: g.zh, line: lineOf(g.blurb), kind: "section", section: g.id, keywords: [] },
    ...ENTRIES.filter((e) => e.group === g.id).map(
      (e): Place => ({ id: e.id, heading: `${e.id}-name`, name: e.name, zh: e.zh, line: lineOf(e.summary), kind: "part", section: g.id, keywords: e.keywords ?? [] }),
    ),
  ]),
  { id: SITE.id, heading: `${SITE.id}-h`, name: SITE.name, zh: SITE.zh, line: "Written for one place in the site, not published", kind: "section", section: SITE.id, keywords: ["not published"] },
  ...LISTED.map((l): Place => ({ id: siteRowId(l.name), heading: `${siteRowId(l.name)}-name`, name: l.name, line: lineOf(l.why), kind: "site", section: SITE.id, keywords: l.exports })),
];

/** Case and width folded (a full-width ａ from a Chinese keyboard is an a). */
const fold = (s: string) => s.normalize("NFKC").toLowerCase();
/** Without spaces and joiners, so "side nav", "side-nav" and SideNav meet. */
const squash = (s: string) => s.replace(/[\s\-_./·]+/g, "");
const CJK = /[㐀-鿿豈-﫿]/;

/** Whether a query is in Chinese: the results then lead with the Chinese names. */
export const isChinese = (query: string) => CJK.test(query);

type Field = { text: string; flat: string; weight: number; words: boolean };
const fields = (p: Place): Field[] => {
  const of = (s: string, weight: number, words = false) => ({ text: fold(s), flat: squash(fold(s)), weight, words });
  return [of(p.name, 0), ...(p.zh ? [of(p.zh, 0)] : []), ...p.keywords.map((k) => of(k, 10)), of(p.line, 20, true)];
};
const FIELDS = new Map(PLACES.map((p) => [p, fields(p)]));

/**
 * How well a term fits a field, lower is better, or -1: the whole of it (0), its start (1), a word's start (2),
 * anywhere in it (3). A one-letter term fits only at a start; a term under three letters never reaches into a sentence.
 */
function fit(term: string, f: Field): number {
  if (f.words && term.length < 3 && !CJK.test(term)) return -1;
  const flat = squash(term);
  if (f.text === term || (flat && f.flat === flat)) return f.weight;
  if (f.text.startsWith(term) || (flat && f.flat.startsWith(flat))) return f.weight + 1;
  const at = f.text.indexOf(term);
  if (at > 0 && /[\s\-_./(·]/.test(f.text[at - 1])) return f.weight + 2;
  if (term.length < 2 && !CJK.test(term)) return -1;
  return at > 0 || (flat.length > 1 && f.flat.includes(flat)) ? f.weight + 3 : -1;
}

/** A place's score for a query, lower is better: each term at its best field, summed; -1 when a term fits nowhere. */
export function score(p: Place, query: string): number {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return -1;
  let sum = 0;
  for (const t of terms) {
    const best = Math.min(...FIELDS.get(p)!.map((f) => fit(t, f)).map((n) => (n < 0 ? Infinity : n)));
    if (best === Infinity) return -1;
    sum += best;
  }
  return sum;
}

/**
 * What a query finds, in the page's sections: a section's places best first, then in the page's order, and the
 * section with the best place first. Nothing for an empty query.
 */
export function find(query: string): { section: Section; places: Place[] }[] {
  const hits = PLACES.map((p, at) => ({ p, at, s: score(p, query) })).filter((h) => h.s >= 0);
  return SECTIONS.map((section) => ({ section, hits: hits.filter((h) => h.p.section === section.id).sort((a, b) => a.s - b.s || a.at - b.at) }))
    .filter((g) => g.hits.length > 0)
    .sort((a, b) => a.hits[0].s - b.hits[0].s || SECTIONS.indexOf(a.section) - SECTIONS.indexOf(b.section))
    .map(({ section, hits }) => ({ section, places: hits.map((h) => h.p) }));
}
