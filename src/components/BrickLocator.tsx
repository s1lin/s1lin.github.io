import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BRICK, loadBook, samplePage, samplePicture, type Book, type Box } from "@/lib/brick";
import { Plate } from "@/ui/plate";
import { useNear } from "@/ui/use-near";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** A frame round a callout, in booklet points, laid over the page. */
function frame(book: Book, [x0, y0, x1, y1]: Box): CSSProperties {
  return {
    left: `${((x0 - 2) / book.width) * 100}%`,
    top: `${((y0 - 2) / book.height) * 100}%`,
    width: `${((x1 - x0 + 4) / book.width) * 100}%`,
    height: `${((y1 - y0 + 4) / book.height) * 100}%`,
  };
}

/**
 * Brick Locator, as the cover's second machine: its sample part, and the two
 * pages that add it, stepped through with the callout framed. Every other piece
 * is in the full tool, drawn from the reader's own booklet.
 */
export function BrickMachine() {
  const root = useRef<HTMLElement>(null);
  const near = useNear(root, "300px");
  const [book, setBook] = useState<Book | null>(null);
  const [missing, setMissing] = useState(false);
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (!near || book) return;
    let live = true;
    loadBook().then(
      (b) => live && setBook(b),
      () => live && setMissing(true),
    );
    return () => {
      live = false;
    };
  }, [near, book]);

  const part = book?.parts.find((p) => p.id === book.sample_part);
  const use = part?.uses[at];
  const steps = part ? new Set(part.uses.map((u) => u.step)).size : 0;

  return (
    <Plate as="section" className="machine machine--brick" ref={root} aria-labelledby="bl-name">
      <header className="machine__head">
        <p className="machine__no">
          <span lang="ja">部品</span> No. 02
        </p>
        <h3 className="machine__name" id="bl-name">
          Brick Locator
        </h3>
        <p className="machine__how">One piece left over? See every step that adds it, framed on the page.</p>
      </header>

      {!book || !part || !use ? (
        <p className="machine__wait">
          {missing ? <a href={BRICK}>Brick Locator lives at /brick-locator/ ↗</a> : "Loading the booklet's index…"}
        </p>
      ) : (
        <>
          <div className="bl-piece">
            <div className="bl-piece__picture">
              <img src={samplePicture(part.id)} alt={`Part ${part.id}, as pictured in the inventory`} />
            </div>
            <div>
              <p className="bl-piece__count">
                {plural(steps, "step")} <em>{steps === 1 ? "adds" : "add"} it</em>
              </p>
              <p className="bl-piece__meta">
                Part {part.id} · {plural(part.quantity, "piece")} in the {book.title}, set {book.set}
              </p>
            </div>
          </div>

          <div className="bl-screen">
            <div className="bl-sheet" style={{ aspectRatio: `${book.width} / ${book.height}` }}>
              <img
                src={samplePage(use.page)}
                alt={`Page ${use.page} of the booklet, as printed, with part ${part.id} framed among the pieces for step ${use.step}`}
              />
              <span className="bl-frame" style={frame(book, use.bbox)} aria-hidden="true" />
            </div>
            <div className="bl-nav">
              <button type="button" aria-label="Previous step" disabled={at === 0} onClick={() => setAt(at - 1)}>
                ←
              </button>
              <p>
                <b>Step {use.step}</b> · page {use.page} · adds {plural(use.quantity, "piece")}
                <span>
                  {at + 1} of {part.uses.length}
                </span>
              </p>
              <button
                type="button"
                aria-label="Next step"
                disabled={at >= part.uses.length - 1}
                onClick={() => setAt(at + 1)}
              >
                →
              </button>
            </div>
          </div>

          <p className="machine__foot">
            A sample: two of the booklet's pages, as printed. For any other piece, open your own booklet in{" "}
            <a href={BRICK}>the full tool ↗</a>
          </p>
        </>
      )}
    </Plate>
  );
}
