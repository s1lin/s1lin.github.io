import * as skyline from "ascii.rest/pieces/skyline";
import { AsciiArt } from "@/components/AsciiArt";
import { Folio, Kicker } from "@/components/bits";
import { GlitchTitle, RipplePhoto } from "@/components/effects";
import { SKYLINE } from "@/content/ascii-stills";

type Photo = { cls: string; src: string; w: number; h: number; alt: string; caption: string };

const PHOTOS: Photo[] = [
  {
    cls: "e-ig",
    src: "cs-featured",
    w: 797,
    h: 448,
    alt: "Screenshot of the official Cities: Skylines Instagram post featuring the city above: an early morning look at my city just before the lights turn off, liked by 3,253 people.",
    caption: "The official Cities: Skylines account, October 2020. 3,253 likes.",
  },
  {
    cls: "e-b",
    src: "cs-stadium",
    w: 1400,
    h: 788,
    alt: "A domed stadium district surrounded by parks, office towers and an elevated rail line.",
    caption: "The stadium district, with a park on its roof line.",
  },
];

function Plate({ p }: { p: Photo }) {
  return (
    <figure className={p.cls}>
      <img src={`/assets/img/${p.src}.webp`} width={p.w} height={p.h} loading="lazy" alt={p.alt} />
      <figcaption>{p.caption}</figcaption>
    </figure>
  );
}

export function Cities() {
  return (
    <section className="spread night" id="cities" data-run="都市 · 5,000 hours">
      <div className="wrap figs">
        <div className="cities__open">
          <div className="cities__sky">
            <AsciiArt
              piece={skyline}
              label="An ASCII city at night, windows going on and off, a blinking mast"
              still={SKYLINE}
            />
          </div>
          <div className="cities__head">
            <div>
              <Kicker ja="都市">Photo essay · pp. 28–35</Kicker>
              <GlitchTitle className="display">5,000 hours.</GlitchTitle>
            </div>
            <p className="tate" lang="ja">
              五千時間の街
            </p>
          </div>
        </div>

        <div className="essay">
          <figure className="e-full">
            <RipplePhoto className="e-full__photo">
              <img
                src="/assets/img/cs-night.webp"
                width={1800}
                height={1012}
                loading="lazy"
                alt="A city in the early morning: a cluster of skyscrapers on the horizon, highway interchanges still lit in the foreground."
              />
            </RipplePhoto>
            <figcaption>
              Early morning over the interchanges, October 2020. Every ramp in the foreground was placed by hand, and
              the official Cities:&nbsp;Skylines account featured it that week. Run the cursor across it.
            </figcaption>
          </figure>

          {PHOTOS.map((p) => (
            <Plate key={p.src} p={p} />
          ))}

          <div className="e-quote">
            <blockquote>
              “<b>Lemma 6.</b>Where the road goes decides everything built along it. <b>Proof.</b>I laid my first road
              in SimCity&nbsp;4 in 2003, and I have spent more than 5,000 hours in Cities:&nbsp;Skylines testing it
              since.&nbsp;∎”
            </blockquote>
            <cite>Revised from the first version of this site.</cite>
          </div>
        </div>
      </div>
      <Folio page="28" />
    </section>
  );
}
