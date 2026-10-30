import type { ReactNode } from "react";

/** HiRain figures: a hand-drawn 3 → 4 → 5 point schematic and the pipeline in type. */

const QUAD = "M96 172 L186 172 L212 252 L70 252 Z";
const CORNERS: [number, number][] = [
  [96, 172],
  [186, 172],
  [212, 252],
  [70, 252],
];

function Points({ pts, r = 6 }: { pts: [number, number][]; r?: number }) {
  return pts.map(([cx, cy]) => <circle key={`${cx},${cy}`} className="dg-pt" cx={cx} cy={cy} r={r} />);
}

/** The same car each time, from a roadside camera: the road to its vanishing point, and the box. */
function Car() {
  return (
    <>
      <path className="dg-faint" d="M150 30 L20 300 M150 30 L280 300 M150 30 L110 300 M150 30 L190 300" />
      <path className="dg-face" d={QUAD} />
      <path
        className="dg-ink"
        d={`${QUAD} M100 116 L182 116 L206 190 L76 190 Z M96 172 L100 116 M186 172 L182 116 M212 252 L206 190 M70 252 L76 190`}
      />
    </>
  );
}

const PANELS: { title: ReactNode; sub: string; marks: ReactNode }[] = [
  {
    title: "3 POINTS",
    sub: "a triangle, no real footprint",
    marks: (
      <>
        <path className="dg-hlfill" d="M70 252 L212 252 L141 172 Z" />
        <path className="dg-hl" d="M70 252 L212 252 L141 172 Z" />
        <Points
          pts={[
            [70, 252],
            [212, 252],
            [141, 172],
          ]}
        />
      </>
    ),
  },
  {
    title: "4 POINTS",
    sub: "footprint + heading",
    marks: (
      <>
        <path className="dg-hlfill" d={QUAD} />
        <path className="dg-hl" d={QUAD} />
        <Points pts={CORNERS} />
      </>
    ),
  },
  {
    title: (
      <>
        4 <span>+ 1</span> POINTS
      </>
    ),
    sub: "footprint, heading, height",
    marks: (
      <>
        <path className="dg-hlfill" d={QUAD} />
        <path className="dg-hl" d={QUAD} />
        <path className="dg-up" d="M141 212 L141 150" />
        <Points pts={CORNERS} />
        <circle className="dg-top" cx="141" cy="150" r="7" />
      </>
    ),
  },
];

/** Three panels side by side, each drawing its own car and captioned in HTML underneath. */
function PointsDiagram() {
  return (
    <div
      className="points"
      role="img"
      aria-label="From three points to five: three sketches of the same car seen from a roadside camera. Left, three points form a triangle. Middle, four ground corners form the footprint. Right, the footprint plus one top point gives height."
    >
      {PANELS.map((p, i) => (
        <div key={i}>
          <svg viewBox="0 20 300 285" aria-hidden="true">
            <Car />
            {p.marks}
          </svg>
          <p className="points__lbl">{p.title}</p>
          <p className="points__sub">{p.sub}</p>
        </div>
      ))}
    </div>
  );
}

export function HiRainFigures() {
  return (
    <>
      <figure>
        <div className="diagram">
          <PointsDiagram />
        </div>
        <figcaption>From three points to five. A schematic drawn for this issue, not a model output.</figcaption>
      </figure>

      <figure>
        <pre
          className="asciidiagram"
          role="img"
          aria-label="Pipeline: pole camera and LiDAR feed NV12 frames to the 5-point head, which feeds a ground-frame decoder, a tracker and events; the same model exports to INT8 for TI TIDL edge chips."
        >
          {" pole camera ──┬──▶ NV12 frames ──▶ "}
          <b>5-point head</b>
          {" ──▶ ground-frame ──▶ tracker ──▶ events\n"}
          {"   (+ LiDAR)   │                    YOLO · RT-DETR      decode            4D Kalman    trajectories\n"}
          {"               │\n"}
          {"               └──▶ INT8 · QAT ──▶ "}
          <b>TI TIDL</b>
          {" edge chip, at the roadside\n"}
        </pre>
        <figcaption>The pipeline, drawn in type.</figcaption>
      </figure>
    </>
  );
}
