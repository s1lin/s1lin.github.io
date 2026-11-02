"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "./cn";
import { metroHue, type MetroColour } from "./metro-map";
import { Table, type TableProps } from "./table";
import "./tokens.css";
import "./timetable.css";

export type TimetableProps<Row> = TableProps<Row> & {
  /** On its own black board, as a station's departures are, in either theme. */
  board?: boolean;
  /** The element's id: give it to a MetroMap's `details`. */
  id?: string;
};

const hueStyle = (colour?: MetroColour) => {
  const hue = metroHue(colour);
  return hue ? ({ "--s1-metro-hue": hue } as CSSProperties) : undefined;
};

/**
 * The kit's Table as a departures board, beside a MetroMap: the same table (columns, groups, sort, rows' own data),
 * drawn in the map's hand. A group's band takes the line's colour from `--s1-metro-hue` on its <tbody> (the group's
 * `style`) and its pill as the group's `mark` (TimetableMark); each row has a station on a rail (`rail`, with
 * TimetableRail) in the colour its <tr> sets; figures sit at the end of their cells in mono with one width. A row
 * whose `rowProps` set `data-lit` is lit (the map's station under the pointer), and `data-fare="here"` fills its ring.
 */
export function Timetable<Row>({ board = false, id, className, ...table }: TimetableProps<Row>) {
  return (
    <div id={id} className={cn("s1-timetable", board && "s1-timetable--board")} data-theme={board ? "dark" : undefined}>
      <Table {...(table as TableProps<Row>)} className={className} />
    </div>
  );
}

/**
 * A row's station on the rail: a track in the line's colour (the row's `--s1-metro-hue`, or `colour`) down the whole
 * height of its cell, so the rails of a band's rows join however tall a row is, and a ring of paper on it by the first
 * line; `here` fills the ring (the row the map's price comes from); a `period` row has a thin dashed track and no
 * ring, a time-of-day price under its model.
 */
export function TimetableRail({ colour, stop = "ring" }: { colour?: MetroColour; stop?: "ring" | "here" | "period" }) {
  return (
    <span className="s1-timetable__rail" data-stop={stop} aria-hidden="true" style={hueStyle(colour)}>
      <span className="s1-timetable__track" />
      {stop !== "period" && (
        <svg className="s1-timetable__ring" viewBox="0 0 14 14" focusable="false">
          <circle className="s1-timetable__stop" cx={7} cy={7} r={4.5} />
        </svg>
      )}
    </span>
  );
}

/** A band's pill in the line's colour: a mark in a roundel of paper (a maker's logo), then the name in mono caps. */
export function TimetableMark({ mark, colour, children }: { mark?: ReactNode; colour?: MetroColour; children: ReactNode }) {
  return (
    <span className="s1-timetable__pill" data-marked={mark != null || undefined} style={hueStyle(colour)}>
      {mark != null && (
        <span className="s1-timetable__pill-mark" aria-hidden="true">
          {mark}
        </span>
      )}
      <span className="s1-timetable__pill-name">{children}</span>
    </span>
  );
}
