import * as skyline from "ascii.rest/pieces/skyline";
import { ErasePhoto, GlitchTitle } from "@/components/effects";
import { SKYLINE } from "@/content/ascii-stills";
import { AsciiArt } from "@/ui/ascii-art";
import { Folio } from "@/ui/folio";
import { Kicker } from "@/ui/kicker";

type Photo = {
  cls: string;
  src: string;
  w: number;
  h: number;
  alt: string;
  caption: string;
  /** The same frame re-rendered as a photograph, under the game, to be rubbed through to. */
  real?: { src: string; alt: string };
};

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
    caption: "The stadium district, with a park on its roof line. Rub it out: the same district under snow.",
    real: { src: "cs-stadium-snow", alt: "The same stadium district re-rendered as a photograph, under snow." },
  },
];

const STREET: Photo = {
  cls: "e-st",
  src: "cs-street",
  w: 1400,
  h: 788,
  alt: "Street-level view of an off-ramp lined with trees, telephone poles and an exit sign, office towers beyond.",
  caption: "Street level, where the game stops looking like a game. Rub it out: the same street in the rain.",
  real: { src: "cs-street-rain", alt: "The same street re-rendered as a photograph in the rain: a wet road, low cloud over the towers." },
};

function Plate({ p }: { p: Photo }) {
  return (
    <figure className={p.cls}>
      {p.real ? (
        <ErasePhoto
          game={{ src: `/assets/img/${p.src}.webp`, alt: p.alt }}
          photo={{ src: `/assets/img/${p.real.src}.webp`, alt: p.real.alt }}
          w={p.w}
          h={p.h}
        />
      ) : (
        <img src={`/assets/img/${p.src}.webp`} width={p.w} height={p.h} loading="lazy" alt={p.alt} />
      )}
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
            <ErasePhoto
              game={{
                src: "/assets/img/cs-night.webp",
                alt: "A city in the early morning: a cluster of skyscrapers on the horizon, highway interchanges still lit in the foreground.",
              }}
              photo={{
                src: "/assets/img/cs-night-haze.webp",
                alt: "The same frame re-rendered as a photograph: the skyline in a golden morning haze over the interchanges.",
              }}
              w={1800}
              h={1012}
            />
            <figcaption>
              Early morning over the interchanges, October 2020. Every ramp in the foreground was placed by hand, and
              the official Cities:&nbsp;Skylines account featured it that week. Rub the game away: under it is the same
              frame re-rendered as a photograph by an image model, in haze.
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

          <Plate p={STREET} />
        </div>
      </div>
      <Folio page="28" />
    </section>
  );
}
