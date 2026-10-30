import * as typewriter from "ascii.rest/pieces/typewriter";
import { AsciiArt } from "@/components/AsciiArt";
import { Barcode, Folio, Roundel } from "@/components/bits";
import { GitHubHeatmap } from "@/components/GitHubHeatmap";
import { TokenSkyline } from "@/components/TokenSkyline";
import { POSTS } from "@/content/posts";

const FEATURES: { href: string; letter: string; name: string; page: string }[] = [
  { href: "#tokensbeat", letter: "T", name: "Tokensbeat", page: "08" },
  { href: "#workgo", letter: "W", name: "WorkGo", page: "12" },
  { href: "#inclusifai", letter: "I", name: "InclusifAI", page: "16" },
  { href: "#hirain", letter: "H", name: "HiRain", page: "20" },
  { href: "#awakeai", letter: "A", name: "AwakeAI", page: "24" },
];

function Entry({ href, title, ja, page }: { href: string; title: string; ja: string; page: string }) {
  return (
    <li>
      <a href={href}>
        <span className="toc__t">
          {title}
          <small lang="ja">{ja}</small>
        </span>
        <span className="toc__p">{page}</span>
      </a>
    </li>
  );
}

const PHRASES = {
  prefix: "i design ",
  phrases: [
    "platforms.",
    "one gateway to every model.",
    "homes for other people's apps.",
    "agents that keep their state.",
    "eyes for the roadside.",
    "cities.",
  ],
};

export function Contents() {
  return (
    <section className="spread" id="contents" data-run="目次 · Contents">
      <div className="wrap grid frontmatter">
        <nav className="toc" aria-labelledby="toc-h">
          <h2 id="toc-h" className="sect-label">
            <span lang="ja">目次</span> Contents
          </h2>
          <ol>
            <Entry href="#foreword" title="Foreword" ja="巻頭言" page="04" />
            <Entry href="#feature" title="Five lines, one proof" ja="特集" page="06" />
            <li className="toc__sub">
              <ol>
                {FEATURES.map((f) => (
                  <li key={f.href}>
                    <a href={f.href}>
                      <span className="toc__t">
                        <Roundel>{f.letter}</Roundel>
                        {"  "}
                        {f.name}
                      </span>
                      <span className="toc__p">{f.page}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </li>
            <Entry href="#cities" title="5,000 hours" ja="都市" page="28" />
            <Entry href="#workshop" title="The workshop" ja="工房" page="36" />
            <Entry href="#departures" title="Departures" ja="年表" page="44" />
            <Entry href="#colophon" title="Colophon" ja="奥付" page="48" />
            <Entry href="/blog/" title="Blog, between issues" ja="随筆" page="→" />
            <li className="toc__sub">
              <ol>
                {POSTS.map((p) => (
                  <li key={p.slug}>
                    {/* a post has no page in the issue: no leader, and its barcode under its title */}
                    <a href={`/blog/${p.slug}/`} className="toc__post">
                      <span className="toc__no">{p.no}</span>
                      <span className="toc__post-t">
                        <span lang={p.lang}>{p.title}</span>
                        <Barcode id={p.id} label={false} />
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </li>
          </ol>
        </nav>

        <article className="foreword" id="foreword">
          <h2 className="sect-label">
            <span lang="ja">巻頭言</span> Foreword
          </h2>
          <p className="theorem">
            <b>Theorem.</b>I am an architect.
          </p>
          <p className="proof">
            <i>Proof.</i> An architect decides where the weight goes before anything stands, and draws it so that other
            people can build on it. This issue proves it one line at a time, a lemma to each: a foundation other apps
            move into (p.&nbsp;08); a product started again from an empty lot (p.&nbsp;12); walls between the people a
            product serves (p.&nbsp;16); a representation chosen so that geometry does the work (p.&nbsp;20); data
            whose route was settled before any was collected (p.&nbsp;24); and, since 2003, roads (p.&nbsp;28). The
            buildings change. The job does not.
            <span className="qed" aria-label="end of proof">
              ∎
            </span>
          </p>

          <div className="typer">
            <AsciiArt
              piece={typewriter}
              options={PHRASES}
              label="i design platforms, one gateway to every model, homes for other people's apps, agents that keep their state, eyes for the roadside, cities"
              still="i design platforms.▌"
            />
          </div>

          <div className="namenote">
            <span className="namenote__chars" lang="ja" aria-hidden="true">
              署名
            </span>
            <div>
              <p>
                I sign my work <b>s1lin</b>, here and on GitHub. The builds in this issue can do the introductions.
              </p>
              <p>
                I live in Montreal. I studied computer science and mathematics at Saint John's in Minnesota, and
                parallel algorithms at McGill.
              </p>
            </div>
          </div>
        </article>

        {/* Under the contents list, beside the namenote; after the foreword on a phone. */}
        <div className="charts">
          <GitHubHeatmap />
          <TokenSkyline />
        </div>
      </div>
      <Folio page="04" />
    </section>
  );
}
