import type { Piece } from "ascii.rest";
import * as splitFlap from "ascii.rest/pieces/split-flap";
import { AsciiArt } from "@/components/AsciiArt";
import { Folio, Kicker } from "@/components/bits";
import { GlitchTitle } from "@/components/effects";

/*
 * The split-flap board shows years as clock times (20:14 is 2014). Its drum
 * only has " A-Z0-9.-/'&": destinations fit 9 characters, gates 3, remarks 9.
 */
const BOARD = {
  title: "departures",
  start: "20:13",
  flights: [
    ["20:14", "MINNESOTA", "SJU", "B.A."],
    ["20:17", "CHENGDU", "YOU", "JAVA ENG"],
    ["20:18", "CHENGDU", "PNR", "PM & ENG"],
    ["20:19", "MONTREAL", "MCG", "M.SC."],
    ["20:20", "MONTREAL", "AAI", "FOUNDED"],
    ["20:23", "MONTREAL", "ECO", "EMBEDDED"],
    ["20:25", "REMOTE", "WGO", "BUILDING"],
    ["20:25", "TORONTO", "IFA", "BUILDING"],
    ["20:26", "ROADSIDE", "HRN", "BUILDING"],
    ["20:26", "ORBIT", "TKB", "ARCHITECT"],
  ] as [string, string, string, string][],
};

/*
 * The board in an airport's colours. The piece draws in one ink, so this
 * wrapper inks each cell of its frame (ascii.rest's env.color): amber times,
 * gates and clock, white destinations, and remarks by status, green for the
 * lines still running and blue for the stops behind me.
 */
const INKS = ["#4a4a4a", "#f2efe6", "#ffb000", "#8a8a8a", "#3ddc84", "#6cb4ff", "#2a2a2a"];
const [FRAME, WHITE, AMBER, LABEL, GREEN, BLUE, HINGE] = [0, 1, 2, 3, 4, 5, 6];
const RUNNING = new Set(["BUILDING", "ARCHITECT"]);
const span = (c: number, from: number, to: number) => c >= from && c <= to;

const coloured: Piece = {
  meta: { ...splitFlap.meta, palette: INKS, ground: "#0d0d0d" },
  default(options) {
    const frame = splitFlap.default(options as Partial<splitFlap.SplitFlapOptions>);
    const { cols } = splitFlap.meta;
    return (t, env) => {
      const text = frame(t, env);
      const color = env?.color;
      if (!color) return text;
      color.fill(FRAME);
      text.split("\n").forEach((line, r) => {
        const remark = RUNNING.has(line.slice(42, 59).replace(/ /g, "")) ? GREEN : BLUE;
        for (let c = 0; c < cols; c++) {
          const ch = line[c];
          let ink = FRAME;
          if (ch === "▔") ink = HINGE;
          else if (r === 1) ink = span(c, 48, 58) ? AMBER : span(c, 2, 46) ? WHITE : FRAME;
          else if (r === 4) ink = span(c, 2, 58) ? LABEL : FRAME;
          else if (r > 4) {
            if (span(c, 2, 10) || span(c, 34, 38)) ink = AMBER;
            else if (span(c, 14, 30)) ink = WHITE;
            else if (span(c, 42, 58)) ink = remark;
          }
          color[r * cols + c] = ink;
        }
      });
      return text;
    };
  },
};

const LEDGER: [string, string, string][] = [
  ["2014–2017", "Saint John's (CSB/SJU)", ", Minnesota. B.A. in computer science and mathematics, cum laude. HPC research with Mike Heroux; robotics team lead."],
  ["2017–2018", "YoueData", ", Chengdu. Java engineer on a big-data platform built on HDFS."],
  ["2018–2019", "Pioneer Education", ", Chengdu. Project manager and engineer for its administration system; academic advisor."],
  ["2019–2022", "McGill University", ", Montreal. M.Sc. in computer science at the Scientific Computing Lab, on asynchronous parallel solvers for integer least squares. Third place at the Dobson Cup with AwakeAI."],
  ["2020–2025", "AwakeAI", ", Montreal. Co-founder; system architect from 2023; COO from January 2025 until I resigned in July."],
  ["2023", "Echosonic", ". Embedded AI engineer, running models on STM32 microcontrollers."],
  ["2025 —", "WorkGo", ". The career OS, version 2.0 from August 2026."],
  ["2025 —", "InclusifAI", ". Founder app, Partner Hub and public site."],
  ["2026 —", "HiRain Technologies", ". Roadside perception, and research on recursive self-improvement."],
  ["2026 —", "TokensBeat", ". Architect and operator of the platform; opened in October, with WorkGo and InclusifAI as its first tenants."],
];

export function Departures() {
  return (
    <section className="spread" id="departures" data-run="年表 · Departures">
      <div className="wrap grid">
        <div className="board">
          <Kicker ja="年表">Departures · pp. 44–47</Kicker>
          <GlitchTitle className="display" style={{ marginBottom: 32 }}>
            Every stop <em>so far.</em>
          </GlitchTitle>
          <div className="board__frame">
            <AsciiArt
              piece={coloured}
              options={BOARD}
              label="A departures board listing every stop of the author's career, years shown as clock times"
            />
          </div>
          <p className="cap">Years are shown as clock times: 20:14 is 2014. The board loops.</p>
        </div>

        <div className="ledger">
          <h3 className="sect-label">
            <span lang="ja">記録</span> The long version
          </h3>
          <ol>
            {LEDGER.map(([when, who, rest]) => (
              <li key={who}>
                <time>{when}</time>
                <span>
                  <b>{who}</b>
                  {rest}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <Folio page="44" />
    </section>
  );
}
