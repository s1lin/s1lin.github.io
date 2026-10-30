import { useState } from "react";
import { Folio, Kicker } from "@/components/bits";
import { GlitchTitle } from "@/components/effects";

/*
 * Route map of my work, drawn as a network map along time: left to right runs
 * from 2003 to past NOW, not to scale (WHEN maps dates to x, for the ruler).
 * The universities are vertical terminals, set where their lines set out, standing
 * up through the City builder loop's top, which stops at both; the high school
 * lies across its left side, and Pioneer, which shares its name, sets out from
 * it. Lines on
 * the same stack at the same time stop at one station. Pioneer runs on into
 * McGill, where AwakeAI sets out carrying its Java; AwakeAI closes into a
 * junction WorkGo, InclusifAI and HiRain open out of, carrying what it taught.
 * YoueData runs on past McGill into AwakeAI at a Java interchange, Java being
 * what the two built on. Around it all runs the City builder loop, since the
 * first road in 2003. Dashes are unfinished: Tokensbeat before it
 * opened, and everything past NOW.
 *
 * Everything is drawn 90 units in from the left, leaving room for the loop.
 */
const WHEN: [number, number][] = [
  [2003, -40], [2014, 20], [2015, 60], [2017, 230], [2018, 340], [2018.6, 370], [2019, 420], [2019.7, 470], [2020.92, 505],
  [2022, 680], [2023, 740], [2025, 800], [2025.55, 870], [2025.79, 930], [2025.95, 990], [2026, 1000],
  [2026.3, 1110], [2026.62, 1260], [2026.75, 1300], [2026.83, 1340], [2027, 1420], [2027.2, 1500],
];
function x(t: number) {
  const i = Math.max(1, WHEN.findIndex(([w]) => w >= t));
  const [[t0, x0], [t1, x1]] = [WHEN[i - 1], WHEN[i]];
  return x0 + ((t - t0) / (t1 - t0)) * (x1 - x0);
}
/*
 * Before 2025 the map is drawn closer together than the dates above give it
 * (the owner's choice, 2026-10-30): the empty track from the high school to
 * Saint John's most, the stretch between the schools least, so their notes
 * still clear each other. From 2025 on it keeps its shape and only moves left,
 * so its 45° diagonals stay true. Every x in this file is in the dates' space;
 * the drawing passes each through sq, and each path through sqPath.
 */
const SQUEEZE: [number, number][] = [[-4, -4], [230, 125], [470, 353], [680, 479], [800, 593]];
const SHIFT = 800 - 593;
function sq(v: number) {
  if (v <= SQUEEZE[0][0]) return v;
  if (v >= 800) return v - SHIFT;
  const i = SQUEEZE.findIndex(([a]) => a >= v);
  const [[a0, b0], [a1, b1]] = [SQUEEZE[i - 1], SQUEEZE[i]];
  return Math.round((b0 + ((v - a0) / (a1 - a0)) * (b1 - b0)) * 100) / 100;
}
/** A path's absolute x coordinates through sq; relative steps keep their size. */
function sqPath(d: string) {
  let cmd = "";
  let i = 0;
  return d.replace(/[A-Za-z]|-?\d*\.?\d+/g, (tok) => {
    if (/[A-Za-z]/.test(tok)) {
      cmd = tok;
      i = 0;
      return tok;
    }
    const isX = "MLTQC".includes(cmd) ? i % 2 === 0 : cmd === "H" ? true : cmd === "A" ? i % 7 === 5 : false;
    i++;
    return isX ? String(sq(Number(tok))) : tok;
  });
}

const NOW = 1340;
const EDGE = 1500;
const RULER = 330;
/** The City builder loop, around everything: its sides, and the radius of its corners. */
const LOOP = { left: -60, right: 1515, top: 44, bottom: 300, r: 28 };

type Key = "t" | "w" | "i" | "h" | "a" | "p" | "y" | "e";
type LineKey = Key | "c";
type Anchor = "start" | "middle" | "end";
type Label = { x: number; y: number; anchor?: Anchor };

/**
 * A line: its track in service and any track still to build. Its code, name and
 * dates go in the key under the map; on the track it carries only its marker.
 */
type Line = { key: Key; code: string; name: string; since: string; live: string; planned?: string; end?: string };
/** A stop on one line, or on the loop; its label may lead somewhere. */
type Stop = { line: LineKey; x: number; y: number; label: string; at: Label; planned?: boolean; href?: string };
/** AwakeAI's patent application, filed September 2024. */
const PATENT = "https://patents.google.com/patent/CN119296029A/en";
/** A station several lines run through side by side, from the top track to the bottom one. */
type Station = {
  x: number;
  top: number;
  bottom: number;
  lines: LineKey[];
  label: string;
  sub?: string;
  at: Label;
  planned?: boolean;
};
/**
 * A school: a vertical terminal from the loop's top rail down through the lines
 * that set out from it, its kanji set vertically inside and its name below.
 */
type School = { kanji: string; name: string; note: string; more?: string; x: number; lines: LineKey[] };

const SCHOOLS: School[] = [
  // where YoueData sets out on graduating, and Pioneer, begun there, runs through
  // Pioneer began here, as a bidding system for a databases course
  {
    kanji: "大学", name: "Saint John's", note: "B.A. 2014–2017 · HPC · robotics", more: "bidding system, a databases course",
    x: 230, lines: ["c", "p", "y"],
  },
  // where Pioneer runs in, in 2019, and AwakeAI sets out, in December 2020
  // its note in two lines, so it clears Saint John's now the schools stand closer
  { kanji: "大学院", name: "McGill", note: "M.Sc. 2019–2022", more: "parallel solvers", x: 470, lines: ["c", "p", "a", "e"] },
];
// The loop's top rail crosses the straight of the terminal, not its rounded end.
const TERMINAL = { top: LOOP.top - 18, bottom: 198, w: 22 };
/**
 * The high school: a terminal lying across the loop's left side, as the
 * universities stand across its top, its kanji set across it. Pioneer, which
 * shares its name, sets out from its right end along Pioneer's own track.
 */
const HIGH_SCHOOL = { kanji: "高校", name: "Pioneer High School", y: 160, left: -84, right: -4, h: 22, lines: ["c", "p"] as LineKey[] };
/** The kanji's baseline, centred between the loop's rail and the first line across the terminal. */
const kanjiY = (i: number, n: number) => 101 + (i - (n - 1) / 2) * 18;

// Drawn in this order, so WorkGo crosses over Tokensbeat where it leaves the corridor.
const LINES: Line[] = [
  { key: "p", code: "P", name: "Pioneer", since: "2015–2019", live: `M${HIGH_SCHOOL.right} 160 H470` },
  // on past its close, through McGill, into AwakeAI at the Java interchange
  { key: "y", code: "Y", name: "YoueData", since: "2017–2018", live: "M230 144 H520" },
  { key: "a", code: "A", name: "AwakeAI", since: "2020–2025", live: "M470 160 H870" },
  {
    key: "e", code: "E", name: "EchoSonic", since: "2022–2023",
    // out of McGill under AwakeAI, then into the junction on HiRain's way down, with embedded work on STM32
    // straight out past McGill's name, then down under AwakeAI's labels
    live: "M470 184 H500 L550 214 H870", // the drop is 45° once squeezed
  },
  {
    key: "h", code: "H", name: "HiRain", since: "2026–",
    // out of the junction, along to its own start in 2026
    live: `M870 172 V240 Q870 260 890 260 H${NOW}`, planned: `M${NOW} 260 H${EDGE}`,
  },
  {
    key: "t", code: "T", name: "Tokensbeat", since: "2026–, opened Oct",
    // under construction from 2026 until it opened, then in service until NOW
    planned: `M1000 76 H1021 L1087 142 H1320 M${NOW} 142 H${EDGE}`, live: `M1320 142 H${NOW}`,
  },
  {
    key: "i", code: "I", name: "InclusifAI", since: "2025.10–",
    live: `M870 166 L898 194 H950 L978 166 H1190 L1202 154 H${NOW}`, planned: `M${NOW} 154 H${EDGE}`,
  },
  {
    key: "w", code: "W", name: "WorkGo", since: "2025.10–",
    live: `M870 154 L898 126 H950 L978 154 H1180 L1234 100 H${NOW}`, planned: `M${NOW} 100 H1364 L1394 130 H${EDGE}`,
  },
];

/** The key to the lines, in the order they opened: the loop first, then each line. */
const KEY: { key: LineKey; code: string; name: string; since: string }[] = [
  { key: "c", code: "C", name: "City builder", since: "2003–" },
  ...(["p", "y", "a", "e", "w", "i", "t", "h"] as Key[]).map((k) => LINES.find((l) => l.key === k)!),
];
const CODE = Object.fromEntries(KEY.map((l) => [l.key, l.code])) as Record<LineKey, string>;

/**
 * Each line's marker, set on a stretch of its own track with no stop on it, as a
 * Japanese map sets the line symbol: filled, so it never reads as a station.
 */
const MARKERS: { line: LineKey; x: number; y: number }[] = [
  { line: "c", x: LOOP.left, y: 236 }, // under the high school, on a stretch of rail with no stop
  { line: "p", x: 175, y: 160 },
  { line: "y", x: 287, y: 144 },
  { line: "a", x: 580, y: 160 },
  { line: "w", x: 924, y: 126 },
  { line: "i", x: 924, y: 194 },
  { line: "t", x: 1054, y: 109 },
  { line: "h", x: 1000, y: 260 },
  { line: "e", x: 600, y: 214 },
];

const STATIONS: Station[] = [
  // what Pioneer and YoueData shared; labelled above YoueData, leaving room under Pioneer for its consultant stop
  {
    x: 340, top: 144, bottom: 160, lines: ["p", "y"], label: "Vue · database", sub: "full stack",
    at: { x: 340, y: 114 },
  },
  // YoueData closes into AwakeAI here, just after McGill: the Java they both built on
  { x: 520, top: 144, bottom: 160, lines: ["y", "a"], label: "Java", at: { x: 520, y: 128 } },
  // AwakeAI closes here; WorkGo, InclusifAI and HiRain open out of it with what it taught
  {
    x: 870, top: 154, bottom: 166, lines: ["a", "w", "i", "h"], label: "architecture · cloud ops",
    sub: "React · TypeScript · Python", at: { x: 856, y: 110, anchor: "end" },
  },
  // EchoSonic closes here, on HiRain's way down; HiRain takes its embedded work to the roadside
  { x: 870, top: 214, bottom: 214, lines: ["e", "h"], label: "embedded · STM32", at: { x: 884, y: 219, anchor: "start" } },
  { x: 1020, top: 154, bottom: 166, lines: ["w", "i"], label: "Supabase · Clerk", at: { x: 1020, y: 190 } },
  { x: 1110, top: 142, bottom: 154, lines: ["t", "w"], label: "Go · Gin", at: { x: 1110, y: 124 } },
  { x: 1160, top: 142, bottom: 166, lines: ["t", "w", "i"], label: "PostgreSQL · Stripe", at: { x: 1160, y: 190 } },
  { x: 1300, top: 142, bottom: 154, lines: ["t", "i"], label: "Azure", at: { x: 1300, y: 124 } },
  {
    x: 1420, top: 130, bottom: 154, lines: ["t", "w", "i"], label: "Pi: Obi, Aria move in",
    at: { x: EDGE, y: 178, anchor: "end" }, planned: true,
  },
];

const STOPS: Stop[] = [
  { line: "a", x: 690, y: 160, label: "Dobson Cup", at: { x: 690, y: 144 } },
  { line: "e", x: x(2022.5), y: 214, label: "sound recognition", at: { x: x(2022.5), y: 238 } },
  { line: "p", x: x(2019), y: 160, label: "consultant", at: { x: x(2019), y: 184 } },
  // labels take turns above and below the line, so neighbours never meet
  { line: "a", x: 735, y: 160, label: "architect", at: { x: 735, y: 184 } },
  { line: "a", x: 765, y: 160, label: "patent ↗", href: PATENT, at: { x: 765, y: 144 } },
  { line: "a", x: 800, y: 160, label: "COO", at: { x: 800, y: 184 } },
  { line: "w", x: 1260, y: 100, label: "2.0", at: { x: 1260, y: 84 } },
  { line: "i", x: 1250, y: 154, label: "Partner Hub", at: { x: 1250, y: 178 } },
  { line: "h", x: 1110, y: 260, label: "5 points", at: { x: 1110, y: 284 } },
  { line: "h", x: 1300, y: 260, label: "bird's-eye", at: { x: 1300, y: 284 } },
  { line: "h", x: 1430, y: 260, label: "ARC-AGI-3: 8.8 of 10", at: { x: 1430, y: 284 }, planned: true },
  { line: "t", x: 1460, y: 142, label: "managed backend", at: { x: EDGE, y: 112, anchor: "end" }, planned: true },
  // the loop, from the Cities section and the workshop
  { line: "c", x: -20, y: LOOP.top, label: "first road · SimCity 4", at: { x: -46, y: 32, anchor: "start" } },
  // set off to the right, clear of McGill's terminal on the rail
  { line: "c", x: x(2020.79), y: LOOP.top, label: "featured by Cities: Skylines", at: { x: x(2020.79), y: 32, anchor: "start" } },
  { line: "c", x: 990, y: LOOP.top, label: "Metro2Line", at: { x: 990, y: 32 } },
  { line: "c", x: 1300, y: LOOP.top, label: "5,000 hours", at: { x: 1300, y: 32 } },
];

/**
 * Each line's timetable (時刻表), stop by stop: the year, the month where it is
 * known, the station, the lines to change to, and a note. Station numbers are
 * the line's code and its place on the line, as Tokyo numbers its stations.
 */
type Row = { year: string; month?: string; name: string; ja?: string; via?: LineKey[]; note?: string; planned?: boolean; href?: string };
const TIMETABLE: Record<LineKey, Row[]> = {
  c: [
    { year: "2003", name: "first road, SimCity 4", note: "sets out" },
    { year: "—", name: "Pioneer High School", ja: "高校", via: ["p"] },
    { year: "2017", name: "Saint John's", ja: "大学", via: ["p", "y"] },
    { year: "2019", name: "McGill", ja: "大学院", via: ["p", "a", "e"] },
    { year: "2020", month: "10", name: "featured by the Cities: Skylines account" },
    { year: "2025", month: "12", name: "Metro2Line" },
    { year: "2026", month: "10", name: "5,000 hours", note: "now, and still going round" },
  ],
  p: [
    { year: "—", name: "Pioneer High School", ja: "高校", via: ["c"], note: "sets out from the school it shares its name with" },
    { year: "2017", name: "Saint John's", ja: "大学", via: ["y", "c"], note: "B.A.; begun there in 2015 as a bidding system for a databases course" },
    { year: "2018", name: "Vue · database · full stack", via: ["y"] },
    { year: "2018", name: "consultant", note: "2018–2019" },
    { year: "2019", name: "McGill", ja: "大学院", via: ["a", "e", "c"], note: "runs in; its Java goes on with AwakeAI" },
  ],
  y: [
    { year: "2017", name: "Saint John's", ja: "大学", via: ["p", "c"], note: "sets out on graduating" },
    { year: "2018", name: "Vue · database · full stack", via: ["p"], note: "HDFS" },
    { year: "2020", month: "12", name: "Java", via: ["a"], note: "the line closes into AwakeAI, which carries its Java on" },
  ],
  a: [
    { year: "2020", month: "12", name: "McGill", ja: "大学院", via: ["p", "e", "c"], note: "sets out, with Pioneer's Java" },
    { year: "2020", month: "12", name: "Java", via: ["y"], note: "YoueData's Java comes aboard" },
    { year: "2022", name: "Dobson Cup", note: "third place" },
    { year: "2023", name: "architect" },
    {
      year: "2024", month: "09", name: "patent application CN119296029A", href: PATENT,
      note: "image processing for care-work recorders: private details removed on the device, actions read in the cloud",
    },
    { year: "2025", month: "01", name: "COO" },
    {
      year: "2025", month: "07", name: "architecture · cloud ops · React · TypeScript · Python", via: ["w", "i", "h"],
      note: "the line closes into the junction",
    },
  ],
  w: [
    { year: "2025", month: "10", name: "the junction", via: ["a", "i", "h"], note: "sets out" },
    { year: "2025", name: "Supabase · Clerk", via: ["i"] },
    { year: "2026", name: "Go · Gin", via: ["t"] },
    { year: "2026", name: "PostgreSQL · Stripe", via: ["t", "i"] },
    { year: "2026", month: "08", name: "2.0", note: "begun again from an empty repository" },
    { year: "2027", name: "Pi: Obi moves in", via: ["t", "i"], planned: true },
  ],
  i: [
    { year: "2025", month: "10", name: "the junction", via: ["a", "w", "h"], note: "sets out" },
    { year: "2025", name: "Supabase · Clerk", via: ["w"] },
    { year: "2026", name: "PostgreSQL · Stripe", via: ["t", "w"] },
    { year: "2026", name: "Partner Hub" },
    { year: "2026", month: "10", name: "Azure", via: ["t"] },
    { year: "2027", name: "Pi: Aria moves in", via: ["t", "w"], planned: true },
  ],
  t: [
    { year: "2026", name: "Go · Gin", via: ["w"], note: "under construction" },
    { year: "2026", name: "PostgreSQL · Stripe", via: ["w", "i"] },
    { year: "2026", month: "10", name: "Azure", via: ["i"], note: "opens" },
    { year: "2027", name: "Pi: Obi and Aria move in", via: ["w", "i"], planned: true },
    { year: "2027", name: "managed backend", note: "built in the lab, not yet open", planned: true },
  ],
  e: [
    { year: "2022", name: "McGill", ja: "大学院", via: ["p", "a", "c"], note: "sets out beside the parallel solvers research" },
    { year: "2022", name: "sound recognition", note: "on-device audio, embedded on STM32" },
    { year: "2023", name: "embedded · STM32", via: ["h"], note: "the line closes; HiRain takes it to the roadside" },
  ],
  h: [
    { year: "2026", name: "edge vision", via: ["a"], note: "sets out from the junction" },
    { year: "2026", name: "embedded · STM32", via: ["e"], note: "2.5D detection on edge chips" },
    { year: "2026", name: "5 points" },
    { year: "2026", name: "bird's-eye" },
    { year: "2027", name: "ARC-AGI-3", note: "8.8 of the 10 points I set as the bar", planned: true },
  ],
};

const TICKS: [number, string][] = [
  [2003, "2003"], [2014, "14"], [2015, "15"], [2016, "16"], [2017, "17"], [2018, "18"], [2019, "19"], [2020, "20"],
  [2021, "21"], [2022, "22"], [2023, "23"], [2024, "24"], [2025, "2025"], [2026, "2026"], [2026.5, ".5"], [2027, "2027"],
];

const { left: L, right: R, top: T, bottom: B, r } = LOOP;
// in service as far as NOW, both ways round; planned beyond it
const LOOP_LIVE = `M${NOW} ${T} H${L + r} A${r} ${r} 0 0 0 ${L} ${T + r} V${B - r} A${r} ${r} 0 0 0 ${L + r} ${B} H${NOW}`;
const LOOP_PLANNED = `M${NOW} ${T} H${R - r} A${r} ${r} 0 0 1 ${R} ${T + r} V${B - r} A${r} ${r} 0 0 1 ${R - r} ${B} H${NOW}`;

/** A line's marker: its code on a disc of its colour. */
function Marker({ line, x, y }: { line: LineKey; x: number; y: number }) {
  return (
    <g className={`rm-marker rm-${line}`}>
      <circle cx={x} cy={y} r="9.5" />
      <text x={x} y={y}>
        {CODE[line]}
      </text>
    </g>
  );
}

/** With a line chosen, everything not on it steps back. */
const dim = (on: LineKey | null, lines: LineKey[]) => (on && !lines.includes(on) ? " is-dim" : "");

function RouteMap({ on }: { on: LineKey | null }) {
  return (
    <svg viewBox={`0 0 ${1620 - SHIFT} 396`} role="img" aria-labelledby="rm-t rm-d">
      <title id="rm-t">Route map of my work, 2003 to now</title>
      <desc id="rm-d">
        A network map along time, from 2003 to past now, inside a loop. The loop is City builder: my first road in
        SimCity 4 in 2003, a city featured by the Cities: Skylines account in October 2020, Metro2Line in December 2025
        and 5,000 hours by now. Across its left side lies a horizontal terminal, Pioneer High School, out of which
        Pioneer, sharing its name, sets out. Inside it, two vertical terminals that reach up to the loop, which stops
        at both: Saint John's, university, B.A. 2014 to 2017, where
        Pioneer, from 2015 to 2019, runs through and YoueData, 2017 to 2018, sets out; the two share Vue, databases and full-stack work, and Pioneer
        goes on with a consultant's role from 2018 to 2019. YoueData's track runs on
        into AwakeAI, just after McGill, at a Java interchange. Pioneer
        runs on into McGill, graduate school, M.Sc. 2019 to 2022, where AwakeAI sets out with its Java in December
        2020, through the Dobson Cup, architect, a patent application in September 2024 (CN119296029A, image processing for
        care-work recorders) and COO. AwakeAI closes in July 2025 into a junction of architecture,
        cloud ops, React, TypeScript and Python, out of which WorkGo and InclusifAI open in October 2025, and HiRain,
        carrying edge vision, in 2026. EchoSonic, 2022 to 2023, sets out from McGill beside AwakeAI, sound recognition
        on STM32, and closes into HiRain on its way down, carrying embedded work. WorkGo and InclusifAI share Supabase and Clerk. Tokensbeat, under construction
        from 2026, joins them: Go and Gin with WorkGo, PostgreSQL and Stripe with both, then Azure with InclusifAI after
        WorkGo leaves for its 2.0 stop in August 2026. Tokensbeat opened in October 2026. Past now, all of it is
        planned: Obi and Aria move onto Pi, the managed backend opens, and HiRain's ARC-AGI-3 harness, at 8.8 points,
        aims for 10. Each line's timetable is in the key below the map.
      </desc>

      <g transform="translate(90 0)">
        <line className="rm-now" x1={sq(NOW)} y1="20" x2={sq(NOW)} y2={RULER} />
        <text className="rm-nowlbl" x={sq(NOW)} y="14" textAnchor="middle">
          NOW · 2026.10
        </text>
        <g className="rm-ruler">
          <line x1={x(2003)} y1={RULER} x2={sq(EDGE)} y2={RULER} />
          <path d={`M${x(2003) + 26} ${RULER - 6} l6 12 M${x(2003) + 32} ${RULER - 6} l6 12`} />
          {TICKS.map(([t, label]) => (
            <g key={t}>
              <line x1={sq(x(t))} y1={RULER - 4} x2={sq(x(t))} y2={RULER} />
              <text x={sq(x(t))} y={RULER + 18}>
                {label}
              </text>
            </g>
          ))}
        </g>

        {/* the loop: a double rail, so it never rests on its colour alone */}
        <g className={`rm-loop${dim(on, ["c"])}`}>
          <path className="rm-casing" d={sqPath(`${LOOP_LIVE} ${LOOP_PLANNED}`)} />
          <path d={sqPath(LOOP_LIVE)} />
          <path className="rm-rail" d={sqPath(LOOP_LIVE)} />
          <path className="rm-planned" d={sqPath(LOOP_PLANNED)} />
        </g>

        {LINES.map((l) => (
          <g key={l.key} className={`rm-line rm-${l.key}${dim(on, [l.key])}`}>
            {/* a casing in the paper's colour, so a crossing reads as one line over the other */}
            <path className="rm-casing" d={sqPath([l.live, l.planned].filter(Boolean).join(" "))} />
            <path d={sqPath(l.live)} />
            {l.planned && <path className="rm-planned" d={sqPath(l.planned)} />}
            {l.end && <path className="rm-end" d={sqPath(l.end)} />}
          </g>
        ))}
        {/* what the connection carries: edge vision into HiRain */}
        <text className={`rm-lbl rm-xlbl${dim(on, ["a", "h"])}`} x={sq(935)} y="278" textAnchor="middle">
          edge vision
        </text>

        {MARKERS.map((m) => (
          <g key={m.line} className={dim(on, [m.line]).trim() || undefined}>
            <Marker {...m} x={sq(m.x)} />
          </g>
        ))}

        <g className={`rm-terminal${dim(on, HIGH_SCHOOL.lines)}`}>
          <rect
            x={HIGH_SCHOOL.left}
            y={HIGH_SCHOOL.y - HIGH_SCHOOL.h / 2}
            width={HIGH_SCHOOL.right - HIGH_SCHOOL.left}
            height={HIGH_SCHOOL.h}
            rx={HIGH_SCHOOL.h / 2}
          />
          <text className="rm-kanji rm-kanji--across" lang="ja" x={(HIGH_SCHOOL.left + HIGH_SCHOOL.right) / 2} y={HIGH_SCHOOL.y + 6}>
            {HIGH_SCHOOL.kanji}
          </text>
          {/* haloed, since it crosses the loop's left rail */}
          <text className="rm-name rm-halo" x={HIGH_SCHOOL.left} y={HIGH_SCHOOL.y + HIGH_SCHOOL.h / 2 + 18}>
            {HIGH_SCHOOL.name}
          </text>
        </g>

        {SCHOOLS.map((sc) => (
          <g key={sc.name} className={`rm-terminal${dim(on, sc.lines)}`}>
            <rect x={sq(sc.x) - TERMINAL.w / 2} y={TERMINAL.top} width={TERMINAL.w} height={TERMINAL.bottom - TERMINAL.top} rx={TERMINAL.w / 2} />
            {[...sc.kanji].map((ch, i) => (
              <text key={i} className="rm-kanji" lang="ja" x={sq(sc.x)} y={kanjiY(i, sc.kanji.length)}>
                {ch}
              </text>
            ))}
            <text className="rm-name" x={sq(sc.x)} y={TERMINAL.bottom + 18} textAnchor="middle">
              {sc.name}
            </text>
            <text className="rm-since" x={sq(sc.x)} y={TERMINAL.bottom + 32} textAnchor="middle">
              {sc.note}
            </text>
            {sc.more && (
              <text className="rm-since" x={sq(sc.x)} y={TERMINAL.bottom + 46} textAnchor="middle">
                {sc.more}
              </text>
            )}
          </g>
        ))}

        {STOPS.map((s) => (
          <g key={`${s.line}${s.x}`} className={`rm-${s.line}${dim(on, [s.line])}`}>
            <circle className={s.planned ? "rm-stop rm-planned-stop" : "rm-stop"} cx={sq(s.x)} cy={s.y} r="5.5">
              <title>{s.label}</title>
            </circle>
            {s.href ? (
              <a href={s.href}>
                <text className="rm-lbl rm-link" x={sq(s.at.x)} y={s.at.y} textAnchor={s.at.anchor ?? "middle"}>
                  {s.label}
                </text>
              </a>
            ) : (
              <text className="rm-lbl" x={sq(s.at.x)} y={s.at.y} textAnchor={s.at.anchor ?? "middle"}>
                {s.label}
              </text>
            )}
          </g>
        ))}

        {STATIONS.map((st) => (
          <g key={st.x} className={dim(on, st.lines).trim() || undefined}>
            <rect
              className={st.planned ? "rm-station rm-planned-stop" : "rm-station"}
              x={sq(st.x) - 6.5}
              y={st.top - 6.5}
              width="13"
              height={st.bottom - st.top + 13}
              rx="6.5"
            >
              <title>{st.sub ? `${st.label} · ${st.sub}` : st.label}</title>
            </rect>
            <text className="rm-lbl rm-xlbl" x={sq(st.at.x)} y={st.at.y} textAnchor={st.at.anchor ?? "middle"}>
              {st.label}
            </text>
            {st.sub && (
              <text className="rm-lbl rm-xlbl" x={sq(st.at.x)} y={st.at.y + 14} textAnchor={st.at.anchor ?? "middle"}>
                {st.sub}
              </text>
            )}
          </g>
        ))}

        <g className="rm-legend" transform="translate(-40 376)">
          <path className="rm-key" d="M0 0 H26" />
          <text x="34" y="4">in service</text>
          <path className="rm-key rm-planned" d="M120 0 H146" />
          <text x="154" y="4">unfinished or planned</text>
          <circle className="rm-stop-key" cx="320" cy="0" r="5" />
          <text x="334" y="4">stop</text>
          <path className="rm-key" d="M392 -6 H418 M392 6 H418" />
          <rect className="rm-station" x="398.5" y="-12.5" width="13" height="25" rx="6.5" />
          <text x="426" y="4">interchange: a stack they share</text>
          <rect className="rm-terminal-key" x="662" y="-11" width="12" height="22" rx="6" />
          <text x="682" y="4">school, a terminal</text>
          <g className="rm-loop rm-loop-key">
            <path d="M822 0 H848" />
            <path className="rm-rail" d="M822 0 H848" />
          </g>
          <text x="856" y="4">the loop</text>
          <g className="rm-marker rm-a">
            <circle cx="962" cy="0" r="9.5" />
            <text x="962" y="0">
              A
            </text>
          </g>
          <text x="980" y="4">line marker</text>
        </g>
      </g>
    </svg>
  );
}

/** A line's code as a badge in running text: its letter on its colour. */
function Code({ line }: { line: LineKey }) {
  return (
    <span className={`rm-code rm-${line}`} aria-hidden="true">
      {CODE[line]}
    </span>
  );
}

/** The chosen line's timetable, set as a Japanese station timetable: the year as the hour, the month as the minute. */
function Timetable({ on }: { on: LineKey }) {
  const line = KEY.find((l) => l.key === on)!;
  const rows = TIMETABLE[on];
  return (
    <section className={`rm-tt rm-${on}`} aria-labelledby="rm-tt-h">
      <header className="rm-tt__head">
        <Code line={on} />
        <h3 id="rm-tt-h">
          {line.name} <span>{line.since}</span>
        </h3>
        <p>
          <span lang="ja">時刻表</span> Timetable
        </p>
      </header>
      <table>
        <thead>
          <tr>
            <th scope="col">
              <span lang="ja">年</span> Year
            </th>
            <th scope="col">
              <span lang="ja">月</span>
            </th>
            <th scope="col">No.</th>
            <th scope="col">
              <span lang="ja">駅</span> Station
            </th>
            <th scope="col">
              <span lang="ja">乗換</span> Change for
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const first = i === 0 || rows[i - 1].year !== row.year;
            const span = first ? rows.slice(i).findIndex((r2) => r2.year !== row.year) : 0;
            return (
              <tr key={i} className={row.planned ? "is-planned" : undefined}>
                {first && (
                  <th scope="row" className="rm-tt__year" rowSpan={span === -1 ? rows.length - i : span}>
                    {row.year}
                  </th>
                )}
                <td className="rm-tt__month">{row.month ?? "·"}</td>
                <td>
                  <span className="rm-tt__no">
                    <b>{line.code}</b>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </td>
                <td className="rm-tt__station">
                  {row.href ? <a href={row.href}>{row.name}</a> : row.name}
                  {row.ja && (
                    <span lang="ja" className="rm-tt__ja">
                      {row.ja}
                    </span>
                  )}
                  {(row.note || row.planned) && (
                    <small>{[row.planned ? "planned" : null, row.note].filter(Boolean).join(" · ")}</small>
                  )}
                </td>
                <td className="rm-tt__via">
                  {row.via?.map((v) => (
                    <Code key={v} line={v} />
                  ))}
                  {row.via && <span className="visually-hidden">{row.via.map((v) => KEY.find((l) => l.key === v)!.name).join(", ")}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export function FeatureOpener() {
  const [on, setOn] = useState<LineKey | null>(null);
  return (
    <section className="spread feature-open" id="feature" data-run="特集 · Architecture">
      <div className="wrap">
        <Kicker ja="特集">Feature · pp. 06–27</Kicker>
        <GlitchTitle className="display">
          Nine lines, <em>one proof.</em>
        </GlitchTitle>
        <p className="dek">
          I work on several lines at once, the way a city runs several metro lines, and each line is one lemma of the
          theorem on page 04. The newest, Tokensbeat, is the foundation: WorkGo and InclusifAI are moving onto it as
          tenants, each keeping its own gateway, its own agent and its own users. Here is the network as of October
          2026.
        </p>

        <figure className="routemap">
          <div className="routemap__scroll">
            <RouteMap on={on} />
          </div>
          <p className="scroll-hint mono" aria-hidden="true">
            Drag the map sideways for the rest of it →
          </p>
          <div className="rm-keys" role="group" aria-label="Lines: choose one to read its timetable">
            {KEY.map((l) => (
              <button
                key={l.key}
                type="button"
                className={`rm-keybtn rm-${l.key}`}
                aria-pressed={on === l.key}
                onClick={() => setOn(on === l.key ? null : l.key)}
              >
                <Code line={l.key} />
                <b>{l.name}</b>
                <span>{l.since}</span>
              </button>
            ))}
          </div>
          {/* WorkGo draws the same kind of map from anyone's resume, in Career Identity and on their personal site. */}
          <p className="rm-make">
            <span>WorkGo draws this kind of map from your resume.</span>
            <a href="https://workgo.ai/career-identity">Build your own map on WorkGo ↗</a>
          </p>
          {on ? (
            <Timetable on={on} />
          ) : (
            <p className="rm-tt-hint">Choose a line in the key to light it on the map and read its timetable.</p>
          )}
          <figcaption>
            Route map, left to right in time, not to scale. The schools are its terminals: the high school,{" "}
            <span lang="ja">高校</span>, lies across the loop's left side, and Pioneer, which shares its name, sets out
            from it; the universities, <span lang="ja">大学</span> and <span lang="ja">大学院</span>, stand up through
            its top. Where lines run on the same stack at the
            same time, they share a station. Pioneer runs on into McGill, where AwakeAI sets out with its Java; AwakeAI
            closes into the junction WorkGo, InclusifAI and HiRain open out of, carrying what it taught. On the way, in September 2024, AwakeAI filed patent application{" "}
            <a href={PATENT}>CN119296029A</a>, image processing for care-work recorders that removes private details on the
            device. EchoSonic sets
            out from McGill in 2022, sound recognition on STM32, and closes into HiRain, whose 2.5D detection runs on edge
            chips. Around it all
            runs the loop: city builder, since my first road in SimCity 4 in 2003. YoueData runs on into AwakeAI at a Java
            interchange, Java being what both were built on. Dashes are unfinished: Tokensbeat before it opened, and everything past now. AwakeAI closed in July 2025,
            when I resigned from the company where I first held the title of architect.
          </figcaption>
        </figure>
      </div>
      <Folio page="06" />
    </section>
  );
}
