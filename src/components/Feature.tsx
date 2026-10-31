import { Fragment, type ReactNode } from "react";
import { Folio } from "@/ui/folio";
import { Roundel } from "@/ui/roundel";
import { Stack } from "@/ui/stack";

export type FeatureProps = {
  id: string;
  num: string;
  letter: string;
  title: string;
  /** Running-head label, e.g. "特集 W · WorkGo". */
  run: string;
  /** What this line proves toward the foreword's theorem; numbered by the feature. */
  lemma?: string;
  /** The big kanji, its word, and an English gloss. */
  kanji: [string, string, string];
  spec: [string, ReactNode][];
  lede: ReactNode;
  body: ReactNode;
  built?: ReactNode[];
  stack?: string[];
  figs: ReactNode;
  folio: string;
  /** Mirror the spread: head on the right. */
  flip?: boolean;
};

/** One line of the feature: a spread with its head, spec sheet, story and figures. */
export function Feature(p: FeatureProps) {
  const [kanji, word, gloss] = p.kanji;
  return (
    <section
      className={p.flip ? "spread feature feature--flip" : "spread feature"}
      id={p.id}
      data-run={p.run}
    >
      <div className="wrap grid figs">
        <header className="feature__head">
          <span className="feature__num" aria-hidden="true">
            {p.num}
          </span>
          <span className="feature__line" aria-hidden="true" />
          <h2 className="feature__title">
            <Roundel hidden>{p.letter}</Roundel>
            {p.title}
          </h2>
          <p className="feature__kanji">
            <b lang="ja" aria-hidden="true">
              {kanji}
            </b>
            <span>
              <span lang="ja">{word}</span>
              <br />
              {gloss}
            </span>
          </p>
          <dl className="spec">
            {p.spec.map(([dt, dd]) => (
              <Fragment key={dt}>
                <dt>{dt}</dt>
                <dd>{dd}</dd>
              </Fragment>
            ))}
          </dl>
        </header>

        <div className="feature__body">
          {p.lemma && (
            <p className="lemma">
              <b>Lemma {Number(p.num)}.</b>
              {p.lemma}
            </p>
          )}
          <p className="lede">{p.lede}</p>
          <p className="body">{p.body}</p>
          {p.built && (
            <ol className="built">
              {p.built.map((b, i) => (
                <li key={i}>
                  <span>{b}</span>
                </li>
              ))}
            </ol>
          )}
          {p.stack && <Stack items={p.stack} />}
          <div className="feature__figs">{p.figs}</div>
        </div>
      </div>
      <Folio page={p.folio} />
    </section>
  );
}
