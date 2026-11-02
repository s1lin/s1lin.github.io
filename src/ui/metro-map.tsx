"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "./cn";
import { EmptyState } from "./empty-state";
import { Glyph, type Status } from "./glyph";
import { VisuallyHidden } from "./visually-hidden";
import { useS1Words, type S1WordMap } from "./words";
import "./tokens.css";
import "./metro-map.css";

/** A figure a table beside the map can sort by: a number, words, or nothing. */
export type MetroFigure = number | string | null | undefined;

export interface MetroStation {
  /** Unique on the map: what `lit` and `onLit` name. */
  id: string;
  /** Beside the stop, in mono: a model's id. */
  label: string;
  /** Under the label, in the line's colour: "1.60 / 8.00". */
  value?: string;
  /** Its place on the axis (a price). Null, missing, or not above 0 on a log axis: not drawn (listed in a table only). */
  x?: number | null;
  /** "input": a square stop, for a station placed by another figure than the axis's usual one (priced on input). */
  kind?: "stop" | "input";
  /** What `x` is in, where a map mixes units ("image", "request"): stations meet at an interchange only within one. */
  unit?: string;
  /** The station is a link, and so a stop for the keyboard. */
  href?: string;
  /** The tooltip's last line: what the value is in, where it comes from. */
  note?: string;
  /** Figures by key, for a table of the same data. */
  figures?: Record<string, MetroFigure>;
  /** Its state, on its card under the value: a word in a tone and a strip (a service's last 24 hours, say). */
  status?: MetroStatus;
}

/**
 * A station's state as its card shows it: the word with its glyph, in its tone, and a strip of cells, oldest first,
 * each in its own tone and shape. The app says what the words are; none: the card has no status line.
 */
export interface MetroStatus {
  /** The word: "Normal", "Degraded", "No status yet". Said with the station's name. */
  label: string;
  /** Its tone, as the kit's glyph and status hue (the ink until a theme sets them); neutral by default. */
  tone?: Status;
  /** The strip, oldest first, a tone a cell: ok full, warn hatched and shorter, bad short, neutral (no data) an outline. */
  cells?: Status[];
  /** What the strip shows, said after the word: "last 24 hours: 23 normal, 1 degraded". */
  summary?: string;
}

/** A CSS colour (a token, `var(--brand)`, a hex), or one for light and one for dark. */
export type MetroColour = string | { light: string; dark: string };

export interface MetroLine {
  /** Unique on the map. */
  id: string;
  /** Said for the line, and the tooltip's first line. */
  name: string;
  /** In the roundel at the line's start: an `<svg>` logo (one colour takes the ink). None: the name's first letter. */
  mark?: ReactNode;
  /** The line's colour; the ink when none is given. */
  colour?: MetroColour;
  /** In any order: the axis places them. */
  stations: MetroStation[];
}

/** A band of the axis, `from` (inclusive) up to `to`; null is open. */
export interface MetroZone {
  id: string;
  from: number | null;
  to: number | null;
  /** At the top of the band, and in a station's tooltip: "Zone 2 · $0.50–2". */
  name: ReactNode;
}

export interface MetroAxis {
  /** Log by default: equal ratios, equal distances. */
  scale?: "log" | "linear";
  /** The ends of the axis; by default the cheapest ÷ 1.7 and the dearest × 1.7. */
  domain?: [number, number];
  /** Values marked under the map. */
  ticks?: number[];
  /** A value as the ticks and the interchange tags write it: "$0.50". */
  format?: (v: number) => string;
  /** Words at the two ends, above the map: "← Cheaper", "Pricier →". */
  cue?: { start: ReactNode; end: ReactNode };
}

/** The fares of an interchange: the cheapest, the dearest, and whether they are one. */
export interface MetroFare {
  min: number;
  max: number;
  exact: boolean;
}

export interface MetroInterchange {
  /** Stations within this ratio of the cheapest in their run meet; 1.05 by default, 1 for equal fares only. */
  tolerance?: number;
  /** The tag over the interchange: "$0.40", or "$2.20–2.25" when the fares are near. */
  label?: (fare: MetroFare) => string;
  /** What a screen reader hears for it: "Same fare: a, b and c, $0.40". */
  announce?: (stations: MetroStation[], fare: string) => string;
  /** A line under the tooltip's heading: "same price, change here". */
  tip?: ReactNode;
}

export type MetroMapProps = {
  lines: MetroLine[];
  /** Stations placed by their `x` on this axis. Without one, a line's stations are evenly spaced in their order. */
  axis?: MetroAxis;
  /** Bands of the axis behind the lines, each with its name. */
  zones?: MetroZone[];
  /** Stations of different lines at one fare meet at an interchange (on an axis); false: never. */
  interchange?: MetroInterchange | false;
  /** Across: the axis left to right. Down: a strip map, the axis top to bottom. Auto: down in a frame under 720px. */
  layout?: "auto" | "across" | "down";
  /** Called with the ids of the stations a pointer or focus lights, and null when it leaves: the app lights its rows. */
  onLit?: (stationIds: string[] | null) => void;
  /** Stations the app lights (a table row under the pointer): their line lights up and the first one's tooltip opens. */
  lit?: readonly string[] | null;
  /** What the map shows, under it: the figure's caption. */
  caption?: ReactNode;
  /** A key to the map beside the caption: what "1.60 / 8.00" is in, the stops' shapes (MetroGlyph). */
  legend?: ReactNode;
  /** A name for the drawing itself. */
  label?: string;
  /** Small trains riding the tracks, stopping at each station (never under reduced motion). */
  trains?: boolean;
  /** Ghost lines while the data is coming: 4 for true, or that many. */
  loading?: boolean | number;
  /** Shown when no station can be drawn: words, or an EmptyState (the words' `empty` by default). */
  empty?: ReactNode;
  /** A mark for the empty map (an app's one-colour logo). */
  emptyMark?: ReactNode;
  /** The id of the same data as a table: the drawing's text alternative, named in `aria-details`. */
  details?: string;
  className?: string;
};

// ------------------------------------------------------------------ colour

function luminance(colour: string): number | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(colour.trim())?.[1];
  if (!hex) return null;
  const full = hex.length === 3 ? hex.replace(/./g, "$&$&") : hex;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * A line's colour as a CSS value for `--s1-metro-hue`: a pair becomes `light-dark()`, and a hex so dark (or so
 * light) that it would vanish into one paper gives way to the ink on that paper.
 */
export function metroHue(colour?: MetroColour): string | undefined {
  if (!colour) return undefined;
  if (typeof colour !== "string") return `light-dark(${colour.light}, ${colour.dark})`;
  const l = luminance(colour);
  if (l !== null && l < 0.06) return `light-dark(${colour}, var(--s1-ink))`;
  if (l !== null && l > 0.8) return `light-dark(var(--s1-ink), ${colour})`;
  return colour;
}

const hueStyle = (hue: string | undefined) => (hue ? ({ "--s1-metro-hue": hue } as CSSProperties) : undefined);

/** A station's status on its card: the word with its glyph in its tone, then the strip, oldest first. */
function StatusLine({ status }: { status: MetroStatus }) {
  const tone = status.tone ?? "neutral";
  return (
    <span className="s1-metro__status" data-tone={tone}>
      <span className="s1-metro__status-word">
        <Glyph status={tone} />
        {status.label}
      </span>
      {status.cells && status.cells.length > 0 && (
        <span className="s1-metro__strip">
          {status.cells.map((tone, i) => (
            <i key={i} data-tone={tone} />
          ))}
        </span>
      )}
    </span>
  );
}

/** What a screen reader hears for a station: "label, value, status, what the strip shows". */
const stationName = (m: MetroStation) => [m.label, m.value, m.status?.label, m.status?.summary].filter(Boolean).join(", ");

/** The shapes a legend names: a stop, a square stop (priced on input), an interchange's bar. */
export function MetroGlyph({ kind }: { kind: "stop" | "input" | "interchange" }) {
  return <i className="s1-metro__glyph" data-kind={kind} aria-hidden="true" />;
}

// ------------------------------------------------------------------ measures

/** An 11px mono character; a Chinese one is nearer two. */
const CH = 6.6;
const units = (s: string) => [...s].reduce((n, c) => n + (c.codePointAt(0)! >= 0x2e80 ? 1.8 : 1), 0);
const textWidth = (s: string, size = 11) => units(s) * CH * (size / 11);
const plain = (n: ReactNode) => (typeof n === "string" || typeof n === "number" ? String(n) : "");

/** The words cut to `room` characters, ending in "…". */
function clip(s: string, room: number) {
  if (units(s) <= room) return s;
  let out = "";
  let n = 0;
  for (const c of s) {
    const u = units(c);
    if (n + u > room - 1) break;
    out += c;
    n += u;
  }
  return `${out}…`;
}

/** A label's line across (label over value), and down. */
const LH = 13;
const DLH = 12;
/** The roundel column. */
const GUT = 58;
const RIGHT = 18;
/** A tier further out for a label that finds no room, and how many it tries. */
const TIER = 30;
const TIERS = 5;
const DOWN_TOP = 64;
const PITCH = 15;
/** Under this frame width, auto draws the strip map. */
const METRO_DOWN_BELOW = 720;
/** The width drawn before the frame is measured (the server's HTML). */
const FIRST_WIDTH = 960;
const PHONE_WIDTH = 358;

// ------------------------------------------------------------------ the plan

interface Member {
  station: MetroStation;
  line: number;
  x: number;
}

/** Stations within the tolerance of the run's cheapest: one stop per line, an interchange when on two lines or more. */
interface Cluster {
  at: number;
  min: number;
  max: number;
  members: Member[];
  lines: number[];
  interchange: boolean;
  exact: boolean;
  label: string;
}

interface Box {
  l: number;
  r: number;
  t: number;
  b: number;
}

interface Stop {
  key: string;
  line: number;
  cluster: number;
  members: MetroStation[];
  x: number;
  y: number;
  shape: "stop" | "input" | "ring" | "none";
  /** Each member's words: where they start and what fits. */
  texts: { x: number; ly: number; vy: number; label: string; value: string }[];
  leader?: [number, number, number, number];
}

interface Drawn {
  line: MetroLine;
  hue?: string;
  d: string;
  hit: string;
  approach: string;
  end: [number, number, number];
  roundel: { cx: number; cy: number; r: number; size: number };
  length: number;
  at: number[];
  stops: Stop[];
}

interface Inter {
  cluster: number;
  members: MetroStation[];
  lines: number[];
  name: string;
  label: string;
  bar: { x: number; y: number; w: number; h: number };
  /** Across: the tag and its stem down to the bar, and a ring on each member's track. */
  tag?: { x: number; y: number; w: number; cx: number };
  stem?: [number, number, number, number];
  rings: { line: number; cx: number; cy: number; key: string }[];
  /** Down: the heading of its block in the label column. */
  head?: { x: number; y: number };
  /** Where its tooltip points. */
  anchor: [number, number];
}

interface Plan {
  kind: "across" | "down";
  width: number;
  height: number;
  /** Each zone's band and name; `two` splits a name too wide for its band at " · " onto two lines. */
  zones: { id: string; x: number; y: number; w: number; h: number; shade: boolean; edge?: [number, number, number, number]; name: ReactNode; at: string; two?: [string, string] }[];
  ticks: { x: number; y: number; text: string }[];
  lines: Drawn[];
  inters: Inter[];
  leaders: string[];
  zoneOf: (v: number) => MetroZone | undefined;
}

interface Options {
  axis?: MetroAxis;
  zones: MetroZone[];
  interchange?: MetroInterchange | false;
  kind: "across" | "down";
  width: number;
  words: S1WordMap;
}

const defaultFormat = (v: number) => String(Number(v.toPrecision(3)));

/** "a, b and c" in the words' own "and". */
function listed(names: string[], words: S1WordMap) {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")}${words.and}${names[names.length - 1]}`;
}

function prepare(lines: MetroLine[], o: Options) {
  const log = o.axis ? (o.axis.scale ?? "log") === "log" : false;
  const valid = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && (!log || v > 0);
  const kept = lines.filter((l) => l.stations.some((s, i) => valid(o.axis ? s.x : i)));
  const placed: Member[] = [];
  kept.forEach((line, li) =>
    line.stations.forEach((station, i) => {
      const x = o.axis ? station.x : i;
      if (valid(x)) placed.push({ station, line: li, x });
    }),
  );
  placed.sort((a, b) => a.x - b.x || a.line - b.line);
  const meet = o.axis && o.interchange !== false;
  const tol = meet ? Math.max(1, (o.interchange || {}).tolerance ?? 1.05) : 1;
  const format = o.axis?.format ?? defaultFormat;
  const tag = (o.interchange || {}).label ?? ((f: MetroFare) => (f.exact ? format(f.min) : `${format(f.min)}–${format(f.max)}`));
  // Runs of near fares, a unit at a time: each run compares with its cheapest, so near fares never chain.
  const clusters: Cluster[] = [];
  const open = new Map<string, Cluster>();
  for (const m of placed) {
    const unit = m.station.unit ?? "";
    const c = open.get(unit);
    const joins = c && (log ? m.x <= c.min * tol : m.x - c.min <= Math.abs(c.min) * (tol - 1));
    if (c && joins) {
      c.members.push(m);
      c.max = m.x;
    } else {
      const run: Cluster = { at: 0, min: m.x, max: m.x, members: [m], lines: [], interchange: false, exact: true, label: "" };
      clusters.push(run);
      open.set(unit, run);
    }
  }
  for (const c of clusters) {
    const n = c.members.length;
    c.at = log ? Math.exp(c.members.reduce((a, m) => a + Math.log(m.x), 0) / n) : c.members.reduce((a, m) => a + m.x, 0) / n;
    c.lines = [...new Set(c.members.map((m) => m.line))].sort((a, b) => a - b);
    c.interchange = !!meet && c.lines.length > 1;
    c.exact = c.min === c.max;
    c.label = tag({ min: c.min, max: c.max, exact: c.exact });
  }
  const xs = placed.map((m) => m.x);
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const pad = (hi - lo) * 0.08 || 0.5;
  const [d0, d1] = o.axis?.domain ?? (log ? [lo / 1.7, hi * 1.7] : [lo - pad, hi + pad]);
  const f = log ? Math.log10 : (v: number) => v;
  const span = f(d1) - f(d0);
  const unit = (v: number) => (span ? (f(v) - f(d0)) / span : 0.5);
  const zoneOf = (v: number) => o.zones.find((z) => (z.from == null || v >= z.from) && (z.to == null || v < z.to));
  return { kept, clusters, unit, d0, d1, format, zoneOf };
}

type Prepared = ReturnType<typeof prepare>;

function announceOf(c: Cluster, o: Options) {
  const stations = c.members.map((m) => m.station);
  const said = (o.interchange || {}).announce;
  return said ? said(stations, c.label) : `${o.words.sameFare}: ${listed(stations.map((s) => s.label), o.words)}, ${c.label}`;
}

/** A line's trains: out to the terminus and back, stopping at each station. */
function drawnLine(line: MetroLine, d: string, hit: string, approach: string, end: [number, number, number], roundel: Drawn["roundel"], length: number, at: number[], stops: Stop[]): Drawn {
  return { line, hue: metroHue(line.colour), d, hit, approach, end, roundel, length, at, stops };
}

/** How far along its line a crowded stop's words may go, either way. */
const SWEEP = 180;

/**
 * The leader from a stop at `x` (its track at 0) to its words in `b`, when they are a tier or more out or beside
 * someone else's stop: [x1, y1, x2, y2] in the line's coordinates; none when the words sit by the stop.
 */
function leaderOf(x: number, b: Box): [number, number, number, number] | undefined {
  const away = Math.min(Math.abs(b.t), Math.abs(b.b)) > 30 || x < b.l - 12 || x > b.r + 12;
  if (!away) return undefined;
  const above = b.b <= 0;
  const to = Math.min(Math.max(x, b.l + 2), b.r - 2);
  return [x, above ? -8 : 8, to, above ? b.b + 2 : b.t - 2];
}

/** A leader as a box the words around it keep out of. */
function segmentBox([x1, y1, x2, y2]: [number, number, number, number]): Box {
  return { l: Math.min(x1, x2) - 1.5, r: Math.max(x1, x2) + 1.5, t: Math.min(y1, y2), b: Math.max(y1, y2) };
}

function across(p: Prepared, o: Options): Plan {
  const W = o.width;
  const ticks = (o.axis?.ticks ?? []).filter((v) => v > p.d0 && v < p.d1);
  const TOP = o.zones.length ? 30 : 12;
  const BOTTOM = ticks.length ? 26 : 10;
  const X = (v: number) => GUT + (W - GUT - RIGHT) * p.unit(v);

  type Draft = { key: string; line: number; cluster: number; members: MetroStation[]; x: number; box?: Box };
  const per: Draft[][] = p.kept.map(() => []);
  const inters: { ci: number; x: number; top: number; bottom: number; tag?: Box }[] = [];
  p.clusters.forEach((c, ci) => {
    const x = X(c.at);
    for (const li of c.lines) per[li].push({ key: `${li}@${ci}`, line: li, cluster: ci, members: c.members.filter((m) => m.line === li).map((m) => m.station), x });
    if (c.interchange) inters.push({ ci, x, top: c.lines[0], bottom: c.lines[c.lines.length - 1] });
  });

  // Each line's words, placed by a collision pass in the line's own coordinates (0 is its track).
  const bands = p.kept.map((_, li) => {
    const boxes: Box[] = [{ l: 9, r: 39, t: -15, b: 15 }];
    const extent: Box[] = [];
    const hit = (b: Box, among = boxes) => among.some((q) => b.l < q.r && b.r > q.l && b.t < q.b && b.b > q.t);
    const tags: Box[] = [];
    for (const it of inters) {
      // The bar runs from the top member's track to the bottom member's: across every line between, and on the bottom
      // member's line only above its track.
      if (li > it.top && li < it.bottom) boxes.push({ l: it.x - 8, r: it.x + 8, t: -1e5, b: 1e5 });
      if (li === it.bottom) boxes.push({ l: it.x - 8, r: it.x + 8, t: -1e5, b: 8 });
      if (li === it.top) {
        const w = textWidth(p.clusters[it.ci].label, 10) + 12;
        let t = -62;
        for (let step = 0; step < 12 && hit({ l: it.x - w / 2 - 4, r: it.x + w / 2 + 4, t, b: t + 16 }, tags); step++) t -= 20;
        it.tag = { l: it.x - w / 2, r: it.x + w / 2, t, b: t + 16 };
        tags.push(it.tag);
        boxes.push(it.tag, { l: it.x - 8, r: it.x + 8, t: t + 16, b: 1e5 });
        extent.push(it.tag);
      }
    }
    for (const st of per[li].sort((a, b) => a.x - b.x)) {
      const n = st.members.length;
      const h = 2 * n * LH - 3;
      const w = Math.max(...st.members.flatMap((m) => [textWidth(m.label), textWidth(m.value ?? "")])) + 4;
      const beside = p.clusters[st.cluster].interchange;
      const tries: [number, number][] = [];
      for (let k = 0; k < TIERS; k++) {
        const up = -12 - h - k * TIER;
        const down = 14 + k * TIER;
        if (beside) tries.push([st.x + 11, up], [st.x + 11, down], [st.x - 11 - w, up], [st.x - 11 - w, down]);
        else tries.push([st.x - w / 2, up], [st.x - w / 2, down], [st.x + 10, up], [st.x - 10 - w, up], [st.x + 10, down], [st.x - 10 - w, down]);
      }
      const fit = (l0: number, t: number): Box => {
        let l = Math.max(GUT - 50, l0);
        let r = l + w;
        if (r > W) {
          r = W;
          l = Math.max(0, W - w);
        }
        return { l, r, t, b: t + h };
      };
      const clear = (b: Box) => {
        const lead = leaderOf(st.x, b);
        return !hit(b) && !(lead && hit(segmentBox(lead)));
      };
      // First the places beside the stop, a tier further out at a time; then the nearest place along the line that is
      // clear (between two bars, say), joined by a leader; then any clear place whose leader crosses words; at last
      // three tiers above, overlaps accepted.
      let box = tries.map(([l0, t]) => fit(l0, t)).find(clear);
      if (!box) {
        const sweep: [number, Box][] = [];
        for (let k = 0; k < TIERS; k++)
          for (let dx = -SWEEP; dx <= SWEEP; dx += 12)
            for (const t of [-12 - h - k * TIER, 14 + k * TIER]) sweep.push([k * TIER + Math.abs(dx), fit(st.x - w / 2 + dx, t)]);
        box = sweep.sort((a, b) => a[0] - b[0]).map(([, b]) => b).find(clear);
      }
      box ??= tries.map(([l0, t]) => fit(l0, t)).find((b) => !hit(b)) ?? fit(st.x - w / 2, -12 - h - 3 * TIER);
      const lead = leaderOf(st.x, box);
      boxes.push(box, ...(lead ? [segmentBox(lead)] : []));
      extent.push(box);
      st.box = box;
    }
    return { up: Math.max(15, ...extent.map((b) => -b.t)), down: Math.max(15, ...extent.map((b) => b.b)), y: 0 };
  });

  let y = TOP + 14;
  for (const b of bands) {
    y += b.up;
    b.y = y;
    y += b.down + 18;
  }
  const H = y - 18 + BOTTOM;
  const ys = bands.map((b) => b.y);

  const lines = p.kept.map((line, li) => {
    const ty = ys[li];
    const drafts = per[li];
    const stops: Stop[] = drafts.map((st) => {
      const c = p.clusters[st.cluster];
      const box = st.box!;
      const lead = leaderOf(st.x, box);
      return {
        key: st.key,
        line: li,
        cluster: st.cluster,
        members: st.members,
        x: st.x,
        y: ty,
        shape: c.interchange ? "none" : st.members.some((m) => m.kind === "input") ? "input" : "stop",
        texts: st.members.map((m, i) => {
          const ly = ty + box.t + i * 2 * LH + 10;
          return { x: box.l + 2, ly, vy: ly + LH, label: m.label, value: m.value ?? "" };
        }),
        leader: lead ? [lead[0], ty + lead[1], lead[2], ty + lead[3]] : undefined,
      };
    });
    const x0 = stops[0].x;
    const x1 = stops[stops.length - 1].x + 16;
    const d = `M${x0} ${ty} H${x1}`;
    return drawnLine(line, d, `M${GUT - 20} ${ty} H${x1}`, `M${GUT - 24} ${ty} H${x0}`, [x1, ty, 6], { cx: 24, cy: ty, r: 15, size: 16 }, x1 - x0, stops.map((s) => s.x - x0), stops);
  });

  const zones = o.zones.flatMap((z, i) => {
    const a = X(Math.max(z.from ?? p.d0, p.d0));
    const b = X(Math.min(z.to ?? p.d1, p.d1));
    if (b <= a) return [];
    const edge: [number, number, number, number] | undefined = z.from != null && z.from > p.d0 ? [a, 0, a, H] : undefined;
    const said = plain(z.name);
    const cut = said.indexOf(" · ");
    const two: [string, string] | undefined = textWidth(said, 10) + 12 > b - a && cut > 0 ? [said.slice(0, cut), said.slice(cut + 3)] : undefined;
    return [{ id: z.id, x: a, y: 0, w: b - a, h: H, shade: i % 2 === 0, edge, name: z.name, at: `translate(${a + 8} 13)`, two }];
  });

  const inter: Inter[] = inters.map((it) => {
    const c = p.clusters[it.ci];
    const y0 = ys[it.top] - 7;
    const y1 = ys[it.bottom] + 7;
    const tagY = ys[it.top] + it.tag!.t;
    return {
      cluster: it.ci,
      members: c.members.map((m) => m.station),
      lines: c.lines,
      name: announceOf(c, o),
      label: c.label,
      bar: { x: it.x - 6, y: y0, w: 12, h: y1 - y0 },
      tag: { x: it.tag!.l, y: tagY, w: it.tag!.r - it.tag!.l, cx: it.x },
      stem: [it.x, tagY + 16, it.x, y0],
      rings: c.lines.map((li) => ({ line: li, cx: it.x, cy: ys[li], key: `${li}@${it.ci}` })),
      anchor: [it.x, tagY],
    };
  });

  return {
    kind: "across",
    width: W,
    height: H,
    zones,
    ticks: ticks.map((v) => ({ x: X(v), y: H, text: p.format(v) })),
    lines,
    inters: inter,
    leaders: [],
    zoneOf: p.zoneOf,
  };
}

function down(p: Prepared, o: Options): Plan {
  const W = o.width;
  const n = p.kept.length;
  const left = o.zones.length ? 20 : 8;
  const trackX = (i: number) => left + 8 + i * PITCH;
  const labelX = trackX(n - 1) + 26;
  const room = Math.max(4, Math.floor((W - labelX - 4) / CH));
  const blocks = p.clusters.map((c) => ({ c, h: (c.interchange ? DLH + 2 : 0) + c.members.length * (2 * DLH + 2) + 2, y: 0, top: 0 }));
  const H = Math.max(520, blocks.reduce((a, b) => a + b.h + 8, 0) + 20);
  const Y = (v: number) => DOWN_TOP + H * p.unit(v);
  for (const b of blocks) {
    b.y = Y(b.c.at);
    b.top = b.y - b.h / 2;
  }
  // Relax: push down in order, then pull up from the bottom so nothing passes the axis's end.
  blocks.forEach((b, i) => {
    const prev = blocks[i - 1];
    b.top = Math.max(b.top, prev ? prev.top + prev.h + 8 : DOWN_TOP);
  });
  const limit = DOWN_TOP + H + 24;
  for (let i = blocks.length - 1; i >= 0; i--) {
    const next = blocks[i + 1];
    blocks[i].top = Math.max(DOWN_TOP, Math.min(blocks[i].top, next ? next.top - blocks[i].h - 8 : limit - blocks[i].h));
  }
  const last = blocks[blocks.length - 1];
  const total = Math.max(DOWN_TOP + H + 28, last.top + last.h + 20);

  // Each member's words in its cluster's block.
  const texts = new Map<Member, Stop["texts"][number]>();
  const leaders: string[] = [];
  for (const b of blocks) {
    const c = b.c;
    let ty = b.top + (c.interchange ? DLH + 2 : 0);
    for (const m of c.members) {
      texts.set(m, { x: labelX, ly: ty + 10, vy: ty + DLH + 10, label: clip(m.station.label, room), value: clip(m.station.value ?? "", room) });
      ty += 2 * DLH + 2;
    }
    const from = Math.max(...c.lines.map(trackX)) + 7;
    const ly = b.top + (c.interchange ? DLH + 2 : 0) + DLH;
    leaders.push(`M${from} ${b.y} H${labelX - 14} L${labelX - 5} ${ly}`);
  }

  const lines = p.kept.map((line, li) => {
    const x = trackX(li);
    const mine = p.clusters.map((c, ci) => ({ c, ci })).filter(({ c }) => c.lines.includes(li));
    const stops: Stop[] = mine.map(({ c, ci }) => {
      const members = c.members.filter((m) => m.line === li);
      return {
        key: `${li}@${ci}`,
        line: li,
        cluster: ci,
        members: members.map((m) => m.station),
        x,
        y: Y(c.at),
        shape: c.interchange ? "ring" : members.some((m) => m.station.kind === "input") ? "input" : "stop",
        texts: members.map((m) => texts.get(m)!),
      };
    });
    const y0 = stops[0].y;
    const y1 = stops[stops.length - 1].y + 14;
    const ry = li % 2 ? 42 : 18;
    const d = `M${x} ${y0} V${y1}`;
    return drawnLine(line, d, `M${x} ${ry} V${y1}`, `M${x} ${ry + 11} V${y0}`, [x, y1, 5], { cx: x, cy: ry, r: 10, size: 11 }, y1 - y0, stops.map((s) => s.y - y0), stops);
  });

  const zones = o.zones.flatMap((z, i) => {
    const a = Y(Math.max(z.from ?? p.d0, p.d0));
    const b = Y(Math.min(z.to ?? p.d1, p.d1));
    if (b <= a) return [];
    const edge: [number, number, number, number] | undefined = z.from != null && z.from > p.d0 ? [0, a, W, a] : undefined;
    // The name runs up the left edge, bottom to top, as on a strip map; too long for its band, on two lines.
    const said = plain(z.name);
    const cut = said.indexOf(" · ");
    const two: [string, string] | undefined = textWidth(said, 10) + 16 > b - a && cut > 0 ? [said.slice(0, cut), said.slice(cut + 3)] : undefined;
    const long = two ? Math.max(textWidth(two[0], 10), textWidth(two[1], 10)) : textWidth(said, 10);
    const at = `translate(${two ? 9 : 11} ${Math.min(b - 4, a + 16 + long)}) rotate(-90)`;
    return [{ id: z.id, x: 0, y: a, w: W, h: b - a, shade: i % 2 === 0, edge, name: z.name, at, two }];
  });

  const inters: Inter[] = blocks.flatMap((b) => {
    const c = b.c;
    if (!c.interchange) return [];
    const ci = p.clusters.indexOf(c);
    const xs = c.lines.map(trackX);
    const x0 = Math.min(...xs) - 7;
    const x1 = Math.max(...xs) + 7;
    return [
      {
        cluster: ci,
        members: c.members.map((m) => m.station),
        lines: c.lines,
        name: announceOf(c, o),
        label: c.label,
        bar: { x: x0, y: b.y - 6, w: x1 - x0, h: 12 },
        rings: [],
        head: { x: labelX, y: b.top + 9 },
        anchor: [x0, b.y - 6] as [number, number],
      },
    ];
  });

  return { kind: "down", width: W, height: total, zones, ticks: [], lines, inters, leaders, zoneOf: p.zoneOf };
}

function planMap(lines: MetroLine[], o: Options): Plan | null {
  const p = prepare(lines, o);
  if (p.kept.length === 0) return null;
  return o.kind === "down" ? down(p, o) : across(p, o);
}

// ------------------------------------------------------------------ trains

/** px of track a second, and seconds at a station: calm, as a map on a page should be. */
const SPEED = 64;
const DWELL = 0.8;

/** A train's run out to the terminus and back, stopping at each station, as SMIL's keyPoints and keyTimes. */
function run(length: number, at: number[]) {
  const steps: [number, number][] = [[0, 0]];
  let t = 0;
  let here = 0;
  const go = (to: number) => {
    t += Math.abs(to - here) / SPEED;
    here = to;
    steps.push([t, to]);
  };
  const wait = () => {
    t += DWELL;
    steps.push([t, here]);
  };
  for (const s of at) {
    go(s);
    wait();
  }
  go(length);
  wait();
  for (const s of [...at].reverse()) {
    go(s);
    wait();
  }
  go(0);
  wait();
  const round = (v: number) => Math.round(v * 10_000) / 10_000;
  return {
    dur: t,
    keyTimes: steps.map(([s]) => round(s / t)).join(";"),
    keyPoints: steps.map(([, p]) => round(Math.min(Math.max(p / length, 0), 1))).join(";"),
  };
}

/** The trains of one line; `nth` sets them off at their own moment, so the lines do not run in step. */
function Trains({ p, nth }: { p: Drawn; nth: number }) {
  if (p.length <= 20) return null;
  const { dur, keyTimes, keyPoints } = run(p.length, p.at);
  const count = Math.min(3, Math.max(1, Math.round(p.length / 520)));
  const lead = (nth * 0.618 * dur) % dur;
  return (
    <g className="s1-metro__trains" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <rect key={i} className="s1-metro__train" x={-5.5} y={-2.5} width={11} height={5} rx={2.5}>
          <animateMotion
            path={p.d}
            dur={`${dur.toFixed(2)}s`}
            begin={`${(-(lead + (i * dur) / count) % dur).toFixed(2)}s`}
            repeatCount="indefinite"
            calcMode="linear"
            keyTimes={keyTimes}
            keyPoints={keyPoints}
            rotate="auto"
          />
        </rect>
      ))}
    </g>
  );
}

// ------------------------------------------------------------------ the map

function Ghost({ lines }: { lines: number }) {
  const rowH = 64;
  return (
    <svg className="s1-metro__ghost" width="100%" height={24 + lines * rowH} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => {
        const y = 36 + i * rowH;
        const stops = 3 + ((i * 2) % 4);
        const from = 96 + ((i * 53) % 120);
        return (
          <g key={i}>
            <circle className="s1-metro__ghost-roundel" cx={24} cy={y} r={15} />
            <line x1={from} y1={y} x2={from + (stops - 1) * 92 + 16} y2={y} />
            {Array.from({ length: stops }, (_, j) => (
              <circle key={j} cx={from + j * 92} cy={y} r={5.5} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

type Active = { kind: "stop"; key: string } | { kind: "inter"; index: number };

const NO_ZONES: MetroZone[] = [];

/**
 * A metro map of prices (or of anything placed on one axis) in SVG. Each line in its colour starts at a roundel
 * with its mark; each station sits at its `x` on the axis (log by default), its label and value placed beside it
 * by a collision pass, never on the track. Bands of the axis (zones) lie behind, named at the top. Stations of
 * different lines at one fare meet at an interchange: a bar behind the tracks with a ring on each member's track
 * and the fare on a tag; a line that only passes crosses it unbroken. Two stations of one line at one fare share a
 * stop. Under 720px the axis runs down (a strip map) with the words in one column, and nothing scrolls sideways.
 * Small trains ride the tracks; a line lights up under the pointer, a station or an interchange shows a tooltip,
 * and `lit` / `onLit` let a table beside it light stations and be lit by them.
 */
export function MetroMap({
  lines,
  axis,
  zones = NO_ZONES,
  interchange,
  layout = "auto",
  onLit,
  lit,
  caption,
  legend,
  label,
  trains = true,
  loading = false,
  empty,
  emptyMark,
  details,
  className,
}: MetroMapProps) {
  const w = useS1Words();
  const id = useId();
  // an id fit for url(#…): the zones' clip paths
  const uid = `s1m${id.replace(/[^\w-]/g, "")}`;
  const frame = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState<number | null>(null);
  const [own, setOwn] = useState<Active | null>(null);
  const [closed, setClosed] = useState(false);
  const busy = loading !== false && loading !== 0;

  // The frame's width decides the layout and every position; the server's HTML has a first guess. A frame with no
  // width (in a hidden tab) keeps the last one.
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const read = () => {
      const width = Math.round(el.clientWidth);
      if (width > 0) setBox(width);
    };
    read();
    if (!("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reduced motion: the trains are hidden by the stylesheet, and their clock stops too.
  useEffect(() => {
    const el = svg.current;
    if (!el || typeof el.pauseAnimations !== "function") return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => (still.matches ? el.pauseAnimations() : el.unpauseAnimations());
    apply();
    still.addEventListener("change", apply);
    return () => still.removeEventListener("change", apply);
  });

  const kind: Plan["kind"] = layout === "down" || (layout === "auto" && box !== null && box < METRO_DOWN_BELOW) ? "down" : "across";
  const width = box ?? (kind === "down" ? PHONE_WIDTH : FIRST_WIDTH);
  const plan = useMemo(() => (busy ? null : planMap(lines, { axis, zones, interchange, kind, width, words: w })), [busy, lines, axis, zones, interchange, kind, width, w]);

  const stops = useMemo(() => (plan ? plan.lines.flatMap((l) => l.stops) : []), [plan]);
  const byKey = useMemo(() => new Map(stops.map((s) => [s.key, s])), [stops]);

  // What is lit: the map's own pointer or focus first, else the stations the app names.
  const external = !own && lit?.length ? stops.filter((s) => s.members.some((m) => lit.includes(m.id))) : [];
  // An interchange under the pointer or focus lights its members' stops and lines.
  const ownInter = own?.kind === "inter" ? plan?.inters[own.index] : undefined;
  const litStops =
    own?.kind === "stop" ? [byKey.get(own.key)].filter((s): s is Stop => !!s) : ownInter ? stops.filter((s) => s.cluster === ownInter.cluster) : external;
  const litKeys = new Set(litStops.map((s) => s.key));
  const litLines = new Set(litStops.map((s) => s.line));
  const litClusters = new Set(litStops.map((s) => s.cluster));
  const litInter = own?.kind === "inter" ? own.index : -1;
  const anyLit = litStops.length > 0;

  const enterStop = (s: Stop) => {
    setOwn({ kind: "stop", key: s.key });
    setClosed(false);
    onLit?.(s.members.map((m) => m.id));
  };
  const enterInter = (index: number) => {
    setOwn({ kind: "inter", index });
    setClosed(false);
    onLit?.(plan!.inters[index].members.map((m) => m.id));
  };
  const leave = () => {
    setOwn(null);
    onLit?.(null);
  };

  // A tap opens a tooltip with no pointer to leave it: the next tap anywhere else closes it.
  useEffect(() => {
    if (!own) return;
    const away = (e: PointerEvent) => {
      if (!(e.target instanceof Element && e.target.closest(".s1-metro__station, .s1-metro__interchange"))) {
        setOwn(null);
        onLit?.(null);
      }
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [own, onLit]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setClosed(true);
  };

  // ---- the tooltip, on the frame (nothing in it scrolls, so nothing clips it)
  let tip: ReactNode = null;
  if (plan && !closed) {
    const scale = box ? box / plan.width : 1;
    let anchor: [number, number] | null = null;
    let hue: string | undefined;
    let body: ReactNode = null;
    const stop = own?.kind === "stop" ? byKey.get(own.key) : own ? undefined : external[0];
    if (stop) {
      const line = plan.lines[stop.line];
      const zone = zones.length ? plan.zoneOf(stop.members[0].x ?? NaN) : undefined;
      hue = line.hue;
      anchor = [stop.x, stop.y];
      body = (
        <>
          <span className="s1-metro__tip-line">
            {line.line.name}
            {zone && <> · {zone.name}</>}
          </span>
          {stop.members.map((m) => (
            <span key={m.id} className="s1-metro__tip-station">
              <span className="s1-metro__tip-label">{m.label}</span>
              {m.value && <span className="s1-metro__tip-value">{m.value}</span>}
              {m.status && <StatusLine status={m.status} />}
            </span>
          ))}
          {stop.members[0].note && <span className="s1-metro__tip-note">{stop.members[0].note}</span>}
        </>
      );
    } else if (own?.kind === "inter") {
      const it = plan.inters[own.index];
      if (it) {
        anchor = it.anchor;
        body = (
          <>
            <span className="s1-metro__tip-line">
              ⇄ {w.sameFare} · {it.label}
            </span>
            {interchange && interchange.tip != null && <span className="s1-metro__tip-note">{interchange.tip}</span>}
            <ul className="s1-metro__tip-list">
              {plan.inters[own.index].members.map((m) => {
                const line = plan.lines.find((l) => l.stops.some((s) => s.members.includes(m)));
                return (
                  <li key={m.id} style={hueStyle(line?.hue)}>
                    <i aria-hidden="true" />
                    <span className="s1-metro__tip-label">{m.label}</span>
                    {m.value && <span className="s1-metro__tip-value">{m.value}</span>}
                    {m.status && (
                      <span className="s1-metro__tip-tone" data-tone={m.status.tone ?? "neutral"}>
                        <Glyph status={m.status.tone ?? "neutral"} />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        );
      }
    }
    if (anchor) {
      const [ax, ay] = [anchor[0] * scale, anchor[1] * scale];
      const room = plan.width * scale;
      const align = ax < 120 ? "start" : ax > room - 120 ? "end" : "center";
      const below = ay < 110;
      tip = (
        <div
          className="s1-metro__tip"
          style={{ left: ax, top: below ? ay + 16 : ay - 10, ...hueStyle(hue) }}
          data-align={align}
          data-below={below || undefined}
          aria-hidden="true"
        >
          {body}
        </div>
      );
    }
  }

  const station = (s: Stop) =>
    s.members.map((m, i) => {
      const t = s.texts[i];
      const name = stationName(m);
      const on = litKeys.has(s.key);
      const body = (
        <>
          {i === 0 && <circle className="s1-metro__spot" cx={s.x} cy={s.y} r={12} />}
          {i === 0 && s.leader && <line className="s1-metro__leader" x1={s.leader[0]} y1={s.leader[1]} x2={s.leader[2]} y2={s.leader[3]} />}
          {i === 0 && s.shape === "stop" && <circle className="s1-metro__stop" cx={s.x} cy={s.y} r={plan!.kind === "down" ? 4.5 : 5.5} />}
          {i === 0 && s.shape === "input" && <rect className="s1-metro__stop s1-metro__stop--input" x={s.x - 5} y={s.y - 5} width={10} height={10} rx={1.5} />}
          {i === 0 && s.shape === "ring" && <circle className="s1-metro__xring" cx={s.x} cy={s.y} r={4.5} />}
          <text className="s1-metro__label" x={t.x} y={t.ly}>
            {t.label}
          </text>
          {t.value && (
            <text className="s1-metro__value" x={t.x} y={t.vy}>
              {t.value}
            </text>
          )}
        </>
      );
      const common = {
        className: "s1-metro__station",
        "data-station": m.id,
        "data-stop": s.key,
        "data-lit": on || undefined,
        "aria-label": name,
        onPointerEnter: () => enterStop(s),
        onPointerLeave: (e: { pointerType: string }) => e.pointerType === "mouse" && leave(),
        onFocus: () => enterStop(s),
        onBlur: leave,
      };
      return m.href ? (
        <a key={m.id} href={m.href} {...common}>
          {body}
        </a>
      ) : (
        <g key={m.id} role="img" {...common} onClick={() => enterStop(s)}>
          {body}
        </g>
      );
    });

  const ghostLines = typeof loading === "number" ? loading : 4;
  const nothing = empty != null && typeof empty !== "string" && typeof empty !== "number" ? empty : <EmptyState mark={emptyMark} title={empty ?? w.empty} />;
  const cue = axis?.cue && plan?.kind === "across" ? axis.cue : null;

  return (
    <figure className={cn("s1-metro", className)} data-layout={plan ? plan.kind : undefined} aria-busy={busy || undefined} aria-details={details} onKeyDown={onKeyDown}>
      {cue && (
        <div className="s1-metro__cue" aria-hidden="true">
          <span>{cue.start}</span>
          <span className="s1-metro__rule" />
          <span>{cue.end}</span>
        </div>
      )}
      <div ref={frame} className="s1-metro__frame">
        {busy ? (
          <>
            <Ghost lines={ghostLines} />
            <VisuallyHidden>{w.loading}</VisuallyHidden>
          </>
        ) : !plan ? (
          <div className="s1-metro__empty">{nothing}</div>
        ) : (
          <svg
            ref={svg}
            className="s1-metro__map"
            width={plan.width}
            height={plan.height}
            viewBox={`0 0 ${plan.width} ${plan.height}`}
            role="group"
            aria-label={label}
            data-lit={anyLit || litInter >= 0 || undefined}
          >
            <g className="s1-metro__zones" aria-hidden="true">
              {plan.zones.map((z) => (
                <g key={z.id} className="s1-metro__zone" data-shade={z.shade || undefined}>
                  <rect x={z.x} y={z.y} width={z.w} height={z.h} />
                  {z.edge && <line className="s1-metro__zone-edge" x1={z.edge[0]} y1={z.edge[1]} x2={z.edge[2]} y2={z.edge[3]} />}
                  <clipPath id={`${uid}-${z.id}`}>
                    <rect x={z.x} y={z.y} width={z.w} height={z.h} />
                  </clipPath>
                  <g clipPath={`url(#${uid}-${z.id})`}>
                    <text className="s1-metro__zone-name" transform={z.at}>
                      {z.two ? (
                        <>
                          <tspan x={0}>{z.two[0]}</tspan>
                          <tspan x={0} dy={plan.kind === "down" ? 11 : 12}>
                            {z.two[1]}
                          </tspan>
                        </>
                      ) : (
                        z.name
                      )}
                    </text>
                  </g>
                </g>
              ))}
              {plan.ticks.map((t) => (
                <g key={t.text} className="s1-metro__tick">
                  <line x1={t.x} y1={t.y - 18} x2={t.x} y2={t.y - 13} />
                  <text x={t.x} y={t.y - 3} textAnchor="middle">
                    {t.text}
                  </text>
                </g>
              ))}
            </g>
            {plan.inters.map((it, i) => (
              <rect
                key={it.cluster}
                className="s1-metro__xbar"
                x={it.bar.x}
                y={it.bar.y}
                width={it.bar.w}
                height={it.bar.h}
                rx={6}
                aria-hidden="true"
                data-lit={litInter === i || litClusters.has(it.cluster) || undefined}
              />
            ))}
            {plan.lines.map((p, li) => (
              <g key={p.line.id} className="s1-metro__line" role="group" aria-label={p.line.name} style={hueStyle(p.hue)} data-lit={litLines.has(li) || undefined}>
                <path className="s1-metro__hit" d={p.hit} aria-hidden="true" />
                <path className="s1-metro__approach" d={p.approach} aria-hidden="true" />
                <path className="s1-metro__track" d={p.d} aria-hidden="true" />
                <circle className="s1-metro__end" cx={p.end[0]} cy={p.end[1]} r={p.end[2]} aria-hidden="true" />
                <g className="s1-metro__badge" aria-hidden="true">
                  <circle className="s1-metro__roundel" cx={p.roundel.cx} cy={p.roundel.cy} r={p.roundel.r} />
                  {p.line.mark ? (
                    <svg className="s1-metro__mark" x={p.roundel.cx - p.roundel.size / 2} y={p.roundel.cy - p.roundel.size / 2} width={p.roundel.size} height={p.roundel.size} overflow="visible">
                      {p.line.mark}
                    </svg>
                  ) : (
                    <text className="s1-metro__letter" x={p.roundel.cx} y={p.roundel.cy} dy="0.36em" textAnchor="middle" fontSize={p.roundel.size * 0.75}>
                      {[...p.line.name.trim()][0]?.toUpperCase() ?? "·"}
                    </text>
                  )}
                </g>
                {trains && <Trains p={p} nth={li} />}
                {p.stops.map(station)}
              </g>
            ))}
            {plan.leaders.map((d, i) => (
              <path key={i} className="s1-metro__leader" d={d} aria-hidden="true" />
            ))}
            {plan.inters.map((it, i) => {
              const on = litInter === i || litClusters.has(it.cluster);
              return (
                <g
                  key={it.cluster}
                  className="s1-metro__interchange"
                  role="img"
                  tabIndex={0}
                  aria-label={it.name}
                  data-members={it.members.map((m) => m.id).join(" ")}
                  data-lit={on || undefined}
                  onPointerEnter={() => enterInter(i)}
                  onPointerLeave={(e) => e.pointerType === "mouse" && leave()}
                  onFocus={() => enterInter(i)}
                  onBlur={leave}
                  onClick={() => enterInter(i)}
                >
                  <rect className="s1-metro__xbar s1-metro__xhit" x={it.bar.x} y={it.bar.y} width={it.bar.w} height={it.bar.h} rx={6} />
                  {it.stem && <line className="s1-metro__xstem" x1={it.stem[0]} y1={it.stem[1]} x2={it.stem[2]} y2={it.stem[3]} />}
                  {it.tag && (
                    <g className="s1-metro__xtag">
                      <rect x={it.tag.x} y={it.tag.y} width={it.tag.w} height={16} rx={3} />
                      <text x={it.tag.cx} y={it.tag.y + 8} dy="0.36em" textAnchor="middle">
                        {it.label}
                      </text>
                    </g>
                  )}
                  {it.head && (
                    <text className="s1-metro__xhead" x={it.head.x} y={it.head.y}>
                      ⇄ {w.sameFare} {it.label}
                    </text>
                  )}
                  {it.rings.map((r) => (
                    <circle key={r.key} className="s1-metro__xring" cx={r.cx} cy={r.cy} r={5.5} style={hueStyle(plan.lines[r.line].hue)} data-lit={litKeys.has(r.key) || undefined} />
                  ))}
                </g>
              );
            })}
          </svg>
        )}
        {tip}
      </div>
      {legend != null && legend !== false && <div className="s1-metro__legend">{legend}</div>}
      {caption != null && caption !== false && (
        <figcaption id={`${id}-caption`} className="s1-metro__caption">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
