import { useRef } from "react";
import * as typewriter from "ascii.rest/pieces/typewriter";
import { Elsewhere, Ref, SourceLink } from "@/components/bits";
import { ErasePhoto, FrostPane, GlitchTitle, LoupeShot, RipplePhoto } from "@/components/effects";
import { GitHubHeatmap } from "@/components/GitHubHeatmap";
import { Board } from "@/components/life/Board";
import { Rich } from "@/components/life/Rich";
import { Thumb } from "@/components/life/Thumb";
import { MetroBar, MetroCaption, MetroMap } from "@/components/Metro2Line";
import { Avatar, Icon } from "@/components/social/common";
import { ButtonsDemo, GridDemo, MotionDemo, RulesDemo, Swatches, TypeScale } from "@/components/uidocs/foundations";
import { OnClick } from "@/components/uidocs/parts";
import { CommentsSpecimen, ComposerSpecimen, ReactionsSpecimen, ShapeCardSpecimen, SignInSpecimen } from "@/components/uidocs/specimens";
import { useMetro2Line } from "@/hooks/useMetro2Line";
import { step, stamp } from "@/lib/life/life";
import { ARC } from "@/lib/life/palette";
import { PATTERNS } from "@/lib/life/patterns";
import { AsciiArt } from "@/ui/ascii-art";
import { Barcode } from "@/ui/barcode";
import { cn } from "@/ui/cn";
import { Folio } from "@/ui/folio";
import { Kicker } from "@/ui/kicker";
import { Mark, MarkSetOut } from "@/ui/mark";
import { Roundel } from "@/ui/roundel";
import { Screen } from "@/ui/screen";
import { Stack } from "@/ui/stack";
import { Tex } from "@/ui/tex";
import { useDark } from "@/ui/use-dark";
import { useHydrated } from "@/ui/use-hydrated";
import { useMedia } from "@/ui/use-media";
import { useNear } from "@/ui/use-near";
import { useScale } from "@/ui/use-scale";

const PHRASES = { prefix: "parts: ", phrases: ["roundels.", "barcodes.", "registration marks.", "one ink."] };

/** The metro player in its three parts, around the one hook. Mounted only when asked for. */
function MetroDemo() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const m = useMetro2Line({ root, canvas });
  return (
    <figure className="ud-metro" ref={root}>
      <MetroBar m={m} />
      <MetroMap m={m} canvas={canvas} className="ud-metro__map" />
      <MetroCaption m={m} lead="" />
    </figure>
  );
}

const GLIDER = stamp(7, 7, [".#.", "..#", "###"], 1, 1);
const LATER = step(step(step(step(GLIDER))));

/** The hooks, answering for this page as it is now. */
function HooksDemo() {
  const near = useRef<HTMLDivElement>(null);
  const drawing = useRef<SVGSVGElement>(null);
  const isNear = useNear(near, "0px");
  const scale = useScale(drawing, 200);
  const dark = useDark();
  const narrow = useMedia("(max-width: 760px)");
  const mouse = useMedia("(hover: hover) and (pointer: fine)");
  const live = useHydrated();
  return (
    <div className="ud-hooks" ref={near}>
      <dl className="ud-readout">
        <dt>useDark()</dt>
        <dd>{String(dark)}</dd>
        <dt>useMedia(&quot;(max-width: 760px)&quot;)</dt>
        <dd>{String(narrow)}</dd>
        <dt>useMedia(&quot;(hover: hover) and (pointer: fine)&quot;)</dt>
        <dd>{String(mouse)}</dd>
        <dt>useHydrated()</dt>
        <dd>{String(live)}</dd>
        <dt>useNear(this box, &quot;0px&quot;)</dt>
        <dd>{String(isNear)}</dd>
        <dt>useScale(the bar below, 200)</dt>
        <dd>{scale.toFixed(2)} px a unit</dd>
      </dl>
      <svg ref={drawing} className={cn("ud-scalebar", dark && "is-dark")} viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden="true">
        <rect width="200" height="8" />
      </svg>
    </div>
  );
}

/** A live example for each entry that has one, by its id. */
export function Demo({ id }: { id: string }) {
  switch (id) {
    case "colour":
      return <Swatches />;
    case "type":
      return <TypeScale />;
    case "grid":
      return <GridDemo />;
    case "rules":
      return <RulesDemo />;
    case "buttons":
      return <ButtonsDemo />;
    case "motion":
      return <MotionDemo />;

    case "mark":
      return (
        <div className="ud-row">
          <Mark className="ud-mark ud-mark--64" />
          <Mark className="ud-mark ud-mark--32" />
          <Mark className="ud-mark ud-mark--18" />
          <span className="runhead__brand ud-brand">
            <Mark className="runhead__mark" />
            <b>S1LIN</b>
            <span lang="ja">設計</span>
          </span>
        </div>
      );
    case "mark-set-out":
      return <MarkSetOut />;
    case "roundel":
      return (
        <>
          <p className="ud-row">
            {["T", "W", "I", "H", "A", "M", "L"].map((l) => (
              <Roundel key={l}>{l}</Roundel>
            ))}
          </p>
          <p className="feature__title ud-roundel-title">
            <Roundel hidden>T</Roundel>Tokensbeat
          </p>
        </>
      );
    case "kicker":
      return (
        <>
          <Kicker ja="随筆">Blog · No. 03</Kicker>
          <Kicker ja="部品">UI · the parts of the issue</Kicker>
        </>
      );
    case "folio":
      return (
        <div className="ud-folio">
          <p className="cap">The foot of a spread:</p>
          <Folio page="04" />
        </div>
      );
    case "screen":
      return (
        <Screen bar="tokensbeat.com">
          <img src="/assets/img/web-tokensbeat-home.webp" width={1600} height={1000} loading="lazy" alt="The TokensBeat home page: one gateway to many models." />
        </Screen>
      );
    case "stack":
      return <Stack items={["React 19", "TypeScript", "Vite 8", "Tailwind 4", "prerendered"]} />;
    case "barcode":
      return (
        <div className="ud-row ud-row--top">
          <Barcode id="9a2ebab5-7807-4f7b-9dae-fd92fb716349" />
          <span className="toc">
            <Barcode id="9a2ebab5-7807-4f7b-9dae-fd92fb716349" label={false} />
          </span>
        </div>
      );
    case "refs":
      return (
        <div className="ud-refs">
          <p>
            Every piece on the cover is drawn by ascii.rest
            <Ref n={1} />.
          </p>
          <ol className="post__refs">
            <li id="ref-1">
              ascii.rest, animated ascii art for web pages, by @bas3line (MIT).
              <SourceLink href="https://ascii.rest/docs/" />
            </li>
          </ol>
        </div>
      );
    case "elsewhere":
      return (
        <div className="post__text ud-elsewhere">
          <Elsewhere
            pictures={[
              ["Earthrise, Apollo 8 (NASA)", "https://www.nasa.gov/image-article/apollo-8-earthrise/"],
              ["The Blue Marble, Apollo 17 (NASA)", "https://www.nasa.gov/image-article/blue-marble-image-of-earth-from-apollo-17/"],
            ]}
          >
            The Earth from the Moon, twice: not rehosted here, linked to where it is kept.
          </Elsewhere>
        </div>
      );
    case "tex":
      return (
        <div className="ud-tex">
          <p>
            Inline: <Tex>{String.raw`P(A \mid B) = \frac{P(B \mid A)\,P(A)}{P(B)}`}</Tex>, in the line.
          </p>
          <Tex block>{String.raw`\int_0^1 x^2\,dx = \tfrac{1}{3}`}</Tex>
        </div>
      );
    case "text-blocks":
      return (
        <div className="ud-blocks">
          <p className="sect-label">
            <span lang="ja">草</span> On GitHub
          </p>
          <dl className="spec">
            <dt>Role</dt>
            <dd>Architect and operator</dd>
            <dt>Since</dt>
            <dd>October 2026</dd>
          </dl>
          <p className="lemma">
            <b>Lemma 1.</b>A foundation other apps move into.
          </p>
          <ol className="built">
            <li>
              <span>
                <b>One gateway</b> to every model.
              </span>
            </li>
            <li>
              <span>Homes for other people&rsquo;s apps.</span>
            </li>
          </ol>
          <blockquote className="pull">
            &ldquo;The buildings change. The job does not.&rdquo;
            <cite>The foreword</cite>
          </blockquote>
          <div className="figs ud-figs">
            <figure>
              <div className="ud-figbox" />
              <figcaption>A first figure.</figcaption>
            </figure>
            <figure>
              <div className="ud-figbox" />
              <figcaption>And a second, numbered for you.</figcaption>
            </figure>
          </div>
          <div className="endmark mono">
            <p>© 2026 s1lin</p>
            <p>Q.E.D. ∎</p>
            <p>
              <a href="#text-blocks">Back up ↑</a>
            </p>
          </div>
        </div>
      );

    case "glitch-title":
      return (
        <>
          <GlitchTitle className="ud-glitch">Torn, then settled.</GlitchTitle>
          <p className="cap">Point at it to tear it again.</p>
        </>
      );
    case "loupe-shot":
      return (
        <Screen bar="workgo.ai">
          <LoupeShot>
            <img src="/assets/img/web-workgo-home.webp" width={1600} height={1000} loading="lazy" alt="The WorkGo home page." />
          </LoupeShot>
        </Screen>
      );
    case "ripple-photo":
      return (
        <figure>
          <RipplePhoto className="ud-photo">
            <img src="/assets/img/cs-night.webp" width={1800} height={1012} loading="lazy" alt="A Cities: Skylines city at night, its towers lit over the water." />
          </RipplePhoto>
          <figcaption>Move over it.</figcaption>
        </figure>
      );
    case "erase-photo":
      return (
        <figure>
          <ErasePhoto
            game={{ src: "/assets/img/cs-street.webp", alt: "Street level in Cities: Skylines: an off-ramp lined with trees and telephone poles, office towers beyond." }}
            photo={{ src: "/assets/img/cs-street-rain.webp", alt: "The same street re-rendered as a photograph in the rain." }}
            w={1400}
            h={788}
          />
          <figcaption>Rub it out: the same street in the rain.</figcaption>
        </figure>
      );
    case "frost-pane":
      return (
        <OnClick label="Frost the glass" cost="One WebGL context over the whole page, until you unload it.">
          {() => (
            <>
              <FrostPane />
              <p className="cap">Frost is growing in from the edges of the screen. Move the pointer to melt a path.</p>
            </>
          )}
        </OnClick>
      );

    case "ascii-art":
      return (
        <div className="typer ud-typer">
          <AsciiArt piece={typewriter} options={PHRASES} label="A typewriter typing the names of the parts" still="parts: roundels.▌" />
        </div>
      );
    case "github-heatmap":
      return (
        <div className="ud-heatmap">
          <GitHubHeatmap />
        </div>
      );
    case "metro2line":
      return (
        <OnClick label="Load the player" cost="One city's lines from this site, about 100 KB; 2D canvases.">
          {() => <MetroDemo />}
        </OnClick>
      );

    case "icon":
      return (
        <ul className="ud-icons">
          {(["heart", "repost", "bubble", "close", "caret", "enter", "sparkle", "half"] as const).map((n) => (
            <li key={n}>
              <Icon name={n} size={24} />
              <Icon name={n} />
              <code>{n}</code>
            </li>
          ))}
        </ul>
      );
    case "avatar":
      return (
        <div className="soc ud-soc">
          <p className="ud-row">
            <Avatar name="Mina" />
            <Avatar name="Kenji" />
            <Avatar name="Ada" />
            <Avatar name="Zoë" />
          </p>
        </div>
      );
    case "reactions":
      return <ReactionsSpecimen />;
    case "comments":
      return <CommentsSpecimen />;
    case "composer":
      return <ComposerSpecimen />;
    case "sign-in-bar":
      return <SignInSpecimen />;
    case "shape-gallery":
      return <ShapeCardSpecimen />;

    case "board":
      return (
        <div className="ud-boards">
          <figure>
            <Board grid={GLIDER} color={ARC.blue} cell={16} label="A glider, generation 0" />
            <figcaption>Generation 0</figcaption>
          </figure>
          <span className="ud-arrow" aria-hidden="true">
            →
          </span>
          <figure>
            <Board grid={LATER} color={ARC.green} cell={16} label="The same glider four generations on, one cell down and right" />
            <figcaption>Generation 4: one down, one right</figcaption>
          </figure>
        </div>
      );
    case "thumb":
      return (
        <ul className="ud-thumbs">
          {["block", "beehive", "blinker", "glider"].map((id) => {
            const p = PATTERNS.find((x) => x.id === id);
            return p ? (
              <li key={id}>
                <Thumb art={p.art} />
                <span className="cap">{p.name}</span>
              </li>
            ) : null;
          })}
        </ul>
      );
    case "rich":
      return (
        <p>
          <Rich text="Conway's **Game of Life**, rule *B3/S23*: [play it](/life/)." />
        </p>
      );

    case "hooks":
      return <HooksDemo />;
    default:
      return null;
  }
}
