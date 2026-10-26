/*
 * The Metro2Line player: a city's metro network drawn line by line, then run
 * with trains that stop at every station, each line in its own colour (in
 * plain ink for a riddle). Networks come from OpenStreetMap through
 * scripts/metro-data.py, in metres from the centre of the city's frame.
 */

export type MetroLineData = {
  ref: string;
  name: string;
  colour: string | null;
  type: string;
  /** Every piece of track, as flat [x, y, x, y, …] lists. */
  track: number[][];
  /** One end-to-end route for the trains. */
  path: number[];
  /** Stations, as distances along `path`. */
  stops: number[];
};

export type MetroCity = {
  slug: string;
  name: string;
  view: [number, number, number, number];
  lines: MetroLineData[];
  source: string;
  fetched: string;
};

type Poly = { pts: Float32Array; cum: Float32Array; total: number };
type Train = { s: number; dir: 1 | -1; wait: number };
type Line = { data: MetroLineData; colour: string; path: Poly; track: Poly[]; trains: Train[] };

export type Look = {
  /** Paper and ink colours of the current theme. */
  paper: string;
  sumi: string;
  dark: boolean;
};

export type PlayerView = {
  /** Draw every line in ink, with no stations or trains: the network as a riddle. */
  ink: boolean;
  /** Line to show alone, the rest faded. */
  only: number | null;
};

const SPEED = 600; // metres of track per second
const DWELL = 0.35; // seconds at a station
const FALLBACK = ["#7a6f9b", "#2f6e9e", "#127a6e", "#b07f22", "#dc6f14", "#8a3b5c"];

function poly(flat: number[]): Poly {
  const n = flat.length / 2;
  const pts = Float32Array.from(flat);
  const cum = new Float32Array(n);
  for (let i = 1; i < n; i++) {
    cum[i] = cum[i - 1] + Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
  }
  return { pts, cum, total: n ? cum[n - 1] : 0 };
}

/** Point and heading at distance `s` along a polyline. */
function at(p: Poly, s: number): [number, number, number] {
  const { pts, cum } = p;
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= s) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const t = Math.min(Math.max((s - cum[lo]) / seg, 0), 1);
  const x0 = pts[2 * lo];
  const y0 = pts[2 * lo + 1];
  const x1 = pts[2 * hi];
  const y1 = pts[2 * hi + 1];
  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, Math.atan2(y1 - y0, x1 - x0)];
}

function luminance(hex: string) {
  const h = hex.length === 4 ? hex.replace(/#(.)(.)(.)/, "#$1$1$2$2$3$3") : hex;
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** A line's own colour, or null when it would vanish into the paper and should be drawn in ink. */
export function lineColour(line: MetroLineData, index: number, dark: boolean) {
  const colour = line.colour ?? FALLBACK[index % FALLBACK.length];
  const l = luminance(colour);
  return (dark && l < 0.06) || (!dark && l > 0.8) ? null : colour;
}

/** Lines, kilometres of line and stations, for the caption. */
export function stats(city: MetroCity) {
  let km = 0;
  let stops = 0;
  for (const line of city.lines) {
    km += poly(line.path).total / 1000;
    stops += line.stops.length;
  }
  return { lines: city.lines.length, km: Math.round(km), stops };
}

/** Space in CSS pixels that the network should keep clear of, such as a card laid over the map. */
export type Insets = { top: number; right: number; bottom: number; left: number };

export type Player = {
  setCity: (city: MetroCity) => void;
  setLook: (look: Look) => void;
  setView: (view: PlayerView) => void;
  /** The line within 12 CSS pixels of a point on the canvas, for hover and taps. */
  pick: (x: number, y: number) => number | null;
  setHover: (index: number | null) => void;
  destroy: () => void;
};

export function createPlayer(canvas: HTMLCanvasElement, insets?: () => Insets): Player {
  const ctx = canvas.getContext("2d")!;
  const layer = document.createElement("canvas");
  const lctx = layer.getContext("2d")!;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");

  let city: MetroCity | null = null;
  let look: Look = { paper: "#f6f6f4", sumi: "#111111", dark: false };
  let view: PlayerView = { ink: false, only: null };
  let lines: Line[] = [];
  let hover: number | null = null;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let k = 1;
  let ox = 0;
  let oy = 0;
  let bounds: [number, number, number, number] = [0, 0, 1, 1];
  let born = 0;
  let stagger = 0.18;
  let raf = 0;
  let last = 0;
  let visible = false;
  let dirty = true;
  let wasBuilding = false;

  const sx = (x: number) => x * k + ox;
  const sy = (y: number) => y * k + oy;

  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    for (const c of [canvas, layer]) {
      c.width = Math.max(1, Math.round(w * dpr));
      c.height = Math.max(1, Math.round(h * dpr));
    }
    if (city) {
      // Frame the network itself, but no wider than the city's box, so a long
      // branch to the suburbs does not shrink the centre.
      const [vx0, vy0, vx1, vy1] = city.view;
      const [bx0, by0, bx1, by1] = bounds;
      const x0 = Math.max(vx0, bx0);
      const y0 = Math.max(vy0, by0);
      const x1 = Math.min(vx1, bx1);
      const y1 = Math.min(vy1, by1);
      const pad = insets?.() ?? { top: 0, right: 0, bottom: 0, left: 0 };
      const fw = Math.max(w - pad.left - pad.right, w * 0.4);
      const fh = Math.max(h - pad.top - pad.bottom, h * 0.4);
      k = Math.min(fw / (x1 - x0), fh / (y1 - y0)) * 0.92;
      ox = pad.left + fw / 2 - k * (x0 + x1) / 2;
      oy = pad.top + fh / 2 - k * (y0 + y1) / 2;
    }
    dirty = true;
  }

  /** How much of line `i` is built, 0 to 1. */
  function built(i: number, now: number) {
    if (still.matches) return 1;
    return Math.min(Math.max(((now - born) / 1000 - i * stagger) / 0.6, 0), 1);
  }

  function trace(c: CanvasRenderingContext2D, p: Poly, upto = Infinity) {
    const { pts, cum } = p;
    c.beginPath();
    c.moveTo(sx(pts[0]), sy(pts[1]));
    for (let i = 1; i < cum.length; i++) {
      if (cum[i] > upto) {
        const [x, y] = at(p, upto);
        c.lineTo(sx(x), sy(y));
        break;
      }
      c.lineTo(sx(pts[2 * i]), sy(pts[2 * i + 1]));
    }
    c.stroke();
  }

  function drawLine(c: CanvasRenderingContext2D, line: Line, progress: number, width: number, colour: string) {
    c.strokeStyle = colour;
    c.lineWidth = width;
    if (progress < 1) {
      trace(c, line.path, progress * line.path.total);
      return;
    }
    for (const t of line.track) trace(c, t);
    if (view.ink) return;
    c.fillStyle = look.paper;
    c.lineWidth = Math.max(1.2, width * 0.5);
    for (const s of line.data.stops) {
      const [x, y] = at(line.path, s);
      c.beginPath();
      c.arc(sx(x), sy(y), width * 0.85, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
  }

  /** Track and stations, redrawn only while building or when something changes. */
  function paintLayer(now: number) {
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lctx.clearRect(0, 0, w, h);
    lctx.lineCap = "round";
    lctx.lineJoin = "round";
    const width = Math.max(1.6, Math.min(2.8, w / 300));
    lines.forEach((line, i) => {
      lctx.globalAlpha = view.ink ? 0.85 : view.only === null || view.only === i ? 1 : 0.14;
      drawLine(lctx, line, built(i, now), width, view.ink ? look.sumi : line.colour);
    });
    lctx.globalAlpha = 1;
  }

  function moveTrains(dt: number) {
    for (const line of lines) {
      const { stops } = line.data;
      const total = line.path.total;
      for (const t of line.trains) {
        if (t.wait > 0) {
          t.wait -= dt;
          continue;
        }
        let next = t.dir > 0 ? total : 0;
        for (const s of stops) {
          if (t.dir > 0 && s > t.s + 1) {
            next = s;
            break;
          }
          if (t.dir < 0 && s < t.s - 1) next = s;
        }
        const step = SPEED * dt;
        if (Math.abs(next - t.s) <= step) {
          t.s = next;
          t.wait = DWELL;
          if (next <= 0 || next >= total) t.dir = t.dir > 0 ? -1 : 1;
        } else {
          t.s += t.dir * step;
        }
      }
    }
  }

  function drawTrains(now: number) {
    ctx.fillStyle = look.sumi;
    const len = Math.max(5, Math.min(9, w / 110));
    lines.forEach((line, i) => {
      if (built(i, now) < 1 || (view.only !== null && view.only !== i)) return;
      for (const t of line.trains) {
        const [x, y, a] = at(line.path, t.s);
        ctx.save();
        ctx.translate(sx(x), sy(y));
        ctx.rotate(a);
        ctx.beginPath();
        ctx.roundRect(-len / 2, -len / 4.5, len, len / 2.25, len / 4.5);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  function frame(now: number) {
    raf = 0;
    if (!city) return;
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    const building = lines.some((_, i) => built(i, now) < 1);
    // Keep painting through the frame where the last line completes.
    if (building || wasBuilding || dirty) {
      paintLayer(now);
      dirty = false;
    }
    wasBuilding = building;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(layer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (hover !== null && lines[hover] && !view.ink) {
      drawLine(ctx, lines[hover], 1, Math.max(3, Math.min(4.5, w / 180)), lines[hover].colour);
    }
    if (!view.ink) {
      if (!still.matches) moveTrains(dt);
      drawTrains(now);
    }
    const running = !view.ink && !still.matches;
    if (visible && (building || running)) raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (!raf && visible) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  function prepare(c: MetroCity) {
    lines = c.lines.map((data, i) => {
      const path = poly(data.path);
      const count = Math.min(10, Math.max(1, Math.round(path.total / 4000)));
      const trains: Train[] = Array.from({ length: count }, (_, j) => ({
        s: ((j + 0.5) / count) * path.total,
        dir: j % 2 ? -1 : 1,
        wait: 0,
      }));
      return { data, colour: lineColour(data, i, look.dark) ?? look.sumi, path, track: data.track.map(poly), trains };
    });
    stagger = Math.min(0.18, 2.4 / Math.max(lines.length, 1));
    bounds = [Infinity, Infinity, -Infinity, -Infinity];
    for (const line of lines) {
      for (const t of line.track) {
        for (let i = 0; i < t.pts.length; i += 2) {
          bounds[0] = Math.min(bounds[0], t.pts[i]);
          bounds[1] = Math.min(bounds[1], t.pts[i + 1]);
          bounds[2] = Math.max(bounds[2], t.pts[i]);
          bounds[3] = Math.max(bounds[3], t.pts[i + 1]);
        }
      }
    }
    if (!lines.length) bounds = [...c.view];
  }

  const resize = new ResizeObserver(() => {
    fit();
    wake();
  });
  resize.observe(canvas);
  const seen = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) wake();
  });
  seen.observe(canvas);

  return {
    setCity(c) {
      city = c;
      prepare(c);
      hover = null;
      born = performance.now();
      fit();
      wake();
    },
    setLook(l) {
      look = l;
      lines.forEach((line, i) => (line.colour = lineColour(line.data, i, l.dark) ?? l.sumi));
      dirty = true;
      wake();
    },
    setView(v) {
      view = v;
      dirty = true;
      wake();
    },
    pick(x, y) {
      let best = 12;
      let found: number | null = null;
      lines.forEach((line, i) => {
        if (view.only !== null && view.only !== i) return;
        for (const t of line.track) {
          const p = t.pts;
          for (let j = 2; j < p.length; j += 2) {
            const ax = sx(p[j - 2]);
            const ay = sy(p[j - 1]);
            const dx = sx(p[j]) - ax;
            const dy = sy(p[j + 1]) - ay;
            const u = Math.min(Math.max(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0), 1);
            const d = Math.hypot(ax + u * dx - x, ay + u * dy - y);
            if (d < best) {
              best = d;
              found = i;
            }
          }
        }
      });
      return found;
    },
    setHover(i) {
      if (i === hover) return;
      hover = i;
      wake();
    },
    destroy() {
      cancelAnimationFrame(raf);
      resize.disconnect();
      seen.disconnect();
    },
  };
}
