import { useCallback, useRef } from "react";
import { banner } from "ascii.rest/banner";
import { AsciiArt } from "@/components/AsciiArt";
import { Roundel } from "@/components/bits";
import { BrickMachine } from "@/components/BrickLocator";
import { MetroBar, MetroCaption, MetroMap } from "@/components/Metro2Line";
import { ARCH_BANNER } from "@/content/ascii-stills";
import { useMetro2Line } from "@/hooks/useMetro2Line";
import type { Insets } from "@/lib/metro";

// No colour: it types in the page's ink.
const ARCH = banner("arch", { font: "block", shadow: "single", effect: "type" });

const LINES: { href: string; letter: string; title: string; sub: string; page: string }[] = [
  { href: "#tokensbeat", letter: "T", title: "One gateway, apps as tenants", sub: "TokensBeat, the platform", page: "08" },
  { href: "#workgo", letter: "W", title: "Putting careers on rails", sub: "WorkGo, the career OS", page: "12" },
  { href: "#inclusifai", letter: "I", title: "Funding rails for every founder", sub: "InclusifAI", page: "16" },
  { href: "#hirain", letter: "H", title: "Five points on the roadside", sub: "Perception at HiRain", page: "20" },
  { href: "#cities", letter: "C", title: "5,000 hours of city", sub: "A Cities: Skylines photo essay", page: "28" },
];

export function Cover() {
  // Frame the network below the city's name and clear of the vertical title.
  const insets = useCallback((canvas: HTMLCanvasElement): Insets => {
    const narrow = canvas.getBoundingClientRect().width < 560;
    return { top: narrow ? 64 : 84, right: narrow ? 48 : 88, bottom: 16, left: 16 };
  }, []);
  const plate = useRef<HTMLElement>(null);
  const map = useRef<HTMLCanvasElement>(null);
  const m = useMetro2Line({ root: plate, canvas: map, insets });

  return (
    <section className="cover" id="cover" data-run="Cover · 表紙">
      <div className="wrap">
        <div className="cover__issue mono">
          <span>
            Vol.<b>30</b> — since 2003
          </span>
          <span>
            2026 Autumn <span lang="ja">秋号</span>
          </span>
          <span lang="ja">設計する人のための雑誌</span>
          <span>Montreal · Free</span>
        </div>
        <h1 className="masthead" aria-label="S1LIN">
          S<span className="masthead__one">1</span>LIN
        </h1>
        <div className="cover__sub">
          <p className="cover__name">
            <span lang="ja">編集長</span>s1lin. Systems architect, founder, and planner of cities, some of them real.
          </p>
        </div>
      </div>

      <div className="wrap cover__play">
        <p className="cover__play-label">
          <span lang="ja">遊</span> Two working models, not renderings. Try them.
        </p>
        <figure className="machine machine--metro" ref={plate}>
          <header className="machine__head">
            <p className="machine__no">
              <span lang="ja">路線</span> No. 01
            </p>
            <h2 className="machine__name">Metro2Line</h2>
            <p className="machine__how">Ride a city's metro as it is drawn, or guess the city from its lines alone.</p>
          </header>
          <MetroBar m={m} />
          <MetroMap m={m} canvas={map} className="machine__screen">
            <p className="cover__tate" lang="ja">
              街を描く。<small lang="en">Draw the city</small>
            </p>
          </MetroMap>
          <MetroCaption m={m} lead="Plate —" />
        </figure>
        <BrickMachine />
      </div>

      <div className="wrap cover__band">
        <div className="cover__feature">
          <p className="kicker">
            <span lang="ja">特集</span> Special feature
          </p>
          <AsciiArt piece={ARCH} label="ARCH, in ASCII" still={ARCH_BANNER} />
          <p className="cover__ruby">
            <span lang="ja">建築</span> &nbsp;/&nbsp; deciding where the weight goes, before anything stands
          </p>
          <div className="barcode" aria-hidden="true">
            <i />
            <span>4 910 2026 10 23</span>
          </div>
        </div>
        <ol className="coverlines">
          {LINES.map((l) => (
            <li key={l.href}>
              <a href={l.href}>
                <Roundel>{l.letter}</Roundel>
                <span className="coverlines__t">
                  {l.title}
                  <small>{l.sub}</small>
                </span>
                <em>p.{l.page}</em>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
