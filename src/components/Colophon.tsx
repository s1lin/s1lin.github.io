import { useEffect, useRef, useState } from "react";
import * as alpineDawn from "ascii.rest/pieces/alpine-dawn";
import * as tokyoRain from "ascii.rest/pieces/tokyo-rain";
import { AsciiArt } from "@/components/AsciiArt";
import { GlitchTitle } from "@/components/effects";
import { MarkSetOut } from "@/components/Mark";
import { useMedia } from "@/hooks/useMedia";
import { useNear } from "@/hooks/useNear";

/** The closing plates take turns. Each keeps its own colours on its own sky, like a photograph. */
const PLATES = [
  {
    name: "Alpine dawn",
    piece: alpineDawn,
    label: "Snow peaks catching first light above a still, misty mountain lake, drawn in ASCII",
    caption: "The issue closes at first light.",
  },
  {
    name: "Tokyo rain",
    piece: tokyoRain,
    label: "A Tokyo side street in the rain, neon signs shining on the wet road, drawn in ASCII",
    caption: "Or late, on a wet side street in Tokyo.",
  },
];
const TURN = 20_000;
const FADE = 450;

/**
 * The last picture in the issue. While it is on screen the plates turn every
 * twenty seconds, with a short fade; choosing one by name keeps it. Readers who
 * prefer reduced motion get the first plate, held still.
 */
function ClosingPlate() {
  const ref = useRef<HTMLElement>(null);
  const near = useNear(ref, "0px");
  const still = useMedia("(prefers-reduced-motion: reduce)");
  const [at, setAt] = useState(0);
  const [fading, setFading] = useState(false);
  const [kept, setKept] = useState(false);

  useEffect(() => {
    if (!near || still || kept || fading) return;
    const turn = window.setTimeout(() => setFading(true), TURN);
    return () => clearTimeout(turn);
  }, [near, still, kept, fading, at]);

  useEffect(() => {
    if (!fading) return;
    const swap = window.setTimeout(() => {
      setAt((i) => (i + 1) % PLATES.length);
      setFading(false);
    }, FADE);
    return () => clearTimeout(swap);
  }, [fading]);

  const plate = PLATES[at];
  return (
    <figure className="closing" ref={ref}>
      <div className="closing__plate" style={{ background: plate.piece.meta.ground }}>
        <div className={fading ? "closing__piece is-fading" : "closing__piece"}>
          <AsciiArt key={plate.name} piece={plate.piece} label={plate.label} />
        </div>
      </div>
      <figcaption className="closing__cap">
        <span>
          {plate.name}, from ascii.rest. {plate.caption}
        </span>
        <span className="closing__pick" role="group" aria-label="Choose the closing plate">
          {PLATES.map((p, i) => (
            <button
              key={p.name}
              type="button"
              aria-pressed={i === at}
              onClick={() => {
                setKept(true);
                setFading(false);
                setAt(i);
              }}
            >
              {p.name}
            </button>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}

export function Colophon() {
  return (
    <section className="spread colophon" id="colophon" data-run="奥付 · Colophon">
      <div className="wrap grid">
        <div className="okuzuke">
          <h2>
            <span lang="ja">奥付</span> Colophon
          </h2>
          <dl>
            <dt>Issue</dt>
            <dd>Vol. 30, Autumn 2026: why I am an architect.</dd>
            <dt>Editor, architect</dt>
            <dd>s1lin, Montreal</dd>
            <dt>The mark</dt>
            <dd className="okuzuke__mark">
              <MarkSetOut />
              <span>
                A cross on a block of ink, three marks in one: the cross of Saint John's, the Benedictine school where I
                studied; the registration mark a printer lines plates up by, at the corners of every spread here; and a
                locator, the + on a plan that says build here. Medieval illuminators painted God as the architect of
                the world, compasses in hand (the <i>Bible moralisée</i>, about 1220). An architect's mark should be
                drawn with them too: a circle struck from the centre through the corners, and the cross on its centre
                lines.
              </span>
            </dd>
            <dt>Type</dt>
            <dd>Instrument Serif, Inter Tight, JetBrains Mono, Shippori Mincho B1 and Zen Kaku Gothic New, from Google Fonts</dd>
            <dt>ASCII</dt>
            <dd>
              <a href="https://ascii.rest">ascii.rest</a> by @bas3line (MIT): the cover banner, the typewriter, the
              skyline, the departures board, and the alpine dawn and Tokyo rain that take turns at the end
            </dd>
            <dt>Effects</dt>
            <dd>
              <a href="https://canvasui.dev">Canvas UI</a> by David Haz (MIT + Commons Clause): Magnify as the loupe
              over each screenshot, Frost on the glass in front of every page, Glitch on the section titles,
              ParticleScroll as the sand at the foot of the screen. Patched here to run in any WebGL2 browser. The
              eraser on the city plates is this issue's own.
            </dd>
            <dt>Cover</dt>
            <dd>
              Two machines, playable. Metro2Line: metro networks © <a href="https://www.openstreetmap.org/copyright">
              OpenStreetMap contributors</a> (ODbL), pulled in October 2026. <a href="/brick-locator/">Brick
              Locator</a>: its sample, two pages © the LEGO Group, shown unaltered and served from the tool's own
              page; the full tool draws every other page from the reader's own booklet
            </dd>
            <dt>Contents</dt>
            <dd>
              The heatmap: contribution counts from <a href="https://github.com/s1lin">GitHub</a>, pulled when the issue
              is built and again every day. Your browser never asks GitHub for them
            </dd>
            <dt>Built with</dt>
            <dd>React, Vite and Tailwind CSS, prerendered at build time</dd>
            <dt>Photographs</dt>
            <dd>
              Cities: Skylines screenshots by the author; under three of them, the same frames re-rendered as
              photographs by an image model (Qwen-Image), not real places. Website screenshots of workgo.ai,
              inclusifai.com, awakeai.ca and tokensbeat.com, October 2026.
            </dd>
            <dt>Printed on</dt>
            <dd>GitHub Pages. No ads, no cookies; visits are counted by Cloudflare Web Analytics, which keeps no personal data.</dd>
            <dt>Small print</dt>
            <dd>
              Cities: Skylines is a trademark of Paradox Interactive. LEGO® is a trademark of the LEGO Group of
              companies which does not sponsor, authorize or endorse this site. Company names belong to their
              companies; the opinions here are mine.
            </dd>
          </dl>
        </div>

        <div className="contact">
          <div>
            <GlitchTitle>Find the editor.</GlitchTitle>
            <ul>
              <li>
                <a href="https://github.com/s1lin">
                  GitHub <span>s1lin ↗</span>
                </a>
              </li>
            </ul>
          </div>
          <p className="motto">
            Stay hungry, stay foolish.<span lang="zh-Hans">求知若饥，虚心若愚</span>
          </p>
        </div>

        <ClosingPlate />

        <div className="endmark mono">
          <p>© 2026 s1lin</p>
          <p aria-label="Q.E.D., end of the proof">Q.E.D. ∎</p>
          <p>
            <a href="#cover">Back to the cover ↑</a>
          </p>
        </div>
      </div>
    </section>
  );
}
