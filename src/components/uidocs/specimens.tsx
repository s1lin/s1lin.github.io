import { useState } from "react";
import { Board } from "@/components/life/Board";
import { Avatar, Icon } from "@/components/social/common";
import { SOCIAL_COPY } from "@/components/social/copy";
import { stamp } from "@/lib/life/life";
import { ARC } from "@/lib/life/palette";

/*
 * The social parts as specimens: the markup and classes of Comments, Composer,
 * Reactions, SignInBar and ShapeGallery, filled with mock data and wired to
 * local state only. Nothing here imports the Aha client, so nothing on the
 * docs page can sign in, post or fetch from Aha. Keep them in step with the
 * components when those change.
 */

const c = SOCIAL_COPY.en;

type Mock = { likes: number; reposts: number; liked: boolean; reposted: boolean };

/** Reactions' markup, flipping locally. */
function MockReactions({ start, comments }: { start: Mock; comments?: number }) {
  const [st, setSt] = useState(start);
  const flip = (kind: "like" | "repost") =>
    setSt((s) =>
      kind === "like" ? { ...s, liked: !s.liked, likes: s.likes + (s.liked ? -1 : 1) } : { ...s, reposted: !s.reposted, reposts: s.reposts + (s.reposted ? -1 : 1) },
    );
  return (
    <div className="soc__reactions">
      {comments !== undefined && (
        <span className="soc__count">
          <Icon name="bubble" />
          {comments}
        </span>
      )}
      <button type="button" className="soc__react" aria-pressed={st.reposted} onClick={() => flip("repost")} title={st.reposted ? c.repostedTitle : c.repostTitle}>
        <Icon name="repost" />
        <span>{st.reposts}</span>
        <span className="soc__sr">{st.reposted ? c.repostedTitle : c.repostTitle}</span>
      </button>
      <button type="button" className="soc__react soc__react--like" aria-pressed={st.liked} onClick={() => flip("like")} title={st.liked ? c.liked : c.like}>
        <Icon name="heart" />
        <span>{st.likes}</span>
        <span className="soc__sr">{st.liked ? c.liked : c.like}</span>
      </button>
    </div>
  );
}

export function ReactionsSpecimen() {
  return (
    <div className="soc ud-soc">
      <MockReactions start={{ likes: 12, reposts: 3, liked: false, reposted: false }} comments={4} />
      <p className="soc__small">Press either: it flips here and sends nothing.</p>
    </div>
  );
}

type MockComment = { id: string; name: string; at: string; body: string; likes: number; pending?: boolean; replies?: MockComment[] };

const THREAD: MockComment[] = [
  {
    id: "m1",
    name: "Mina",
    at: "28 Oct 2026",
    body: "The registration marks are a lovely touch.\nIs the grid the same on the blog?",
    likes: 5,
    replies: [{ id: "m2", name: "Tomás", at: "29 Oct 2026", body: "The same twelve columns, folded to one at 900px.", likes: 2 }],
  },
  { id: "m3", name: "Kenji", at: "30 Oct 2026", body: "Could the heatmap take its data as a prop?", likes: 0, pending: true },
];

function MockCommentView({ cm }: { cm: MockComment }) {
  return (
    <li className={`soc__comment${cm.pending ? " is-pending" : ""}`}>
      <Avatar name={cm.name} />
      <div className="soc__cbody">
        <p className="soc__meta">
          <b>{cm.name}</b>
          <time>{cm.at}</time>
          {cm.pending && <em className="soc__tag">{c.pendingTag}</em>}
        </p>
        <p className="soc__text">{cm.body}</p>
        <div className="soc__actions">
          <MockReactionsLike likes={cm.likes} />
        </div>
        {cm.replies && (
          <ul className="soc__list soc__list--replies">
            {cm.replies.map((r) => (
              <MockCommentView key={r.id} cm={r} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function MockReactionsLike({ likes }: { likes: number }) {
  const [on, setOn] = useState(false);
  return (
    <button type="button" className="soc__react soc__react--like" aria-pressed={on} onClick={() => setOn((v) => !v)} title={on ? c.liked : c.like}>
      <Icon name="heart" />
      <span>{likes + (on ? 1 : 0)}</span>
      <span className="soc__sr">{on ? c.liked : c.like}</span>
    </button>
  );
}

/** The signed-out composer, as a reader first meets it. */
function SignedOutBox() {
  const [note, setNote] = useState(false);
  return (
    <div className="soc__compose">
      <div className="soc__box is-out">
        <textarea rows={3} disabled placeholder={c.signedOutPlaceholder} aria-label={c.signedOutPlaceholder} />
        <div className="soc__bar">
          <span className="soc__bar-out">
            <button type="button" className="soc__btn soc__btn--go" onClick={() => setNote(true)}>
              {c.createAccount}
            </button>
            <button type="button" className="soc__btn soc__btn--go" onClick={() => setNote(true)}>
              {c.signIn}
            </button>
          </span>
        </div>
      </div>
      <div className="soc__notes" aria-live="polite">
        {note && <p className="soc__small">A specimen: no sign-in window opens from this page.</p>}
      </div>
    </div>
  );
}

export function CommentsSpecimen() {
  return (
    <div className="soc ud-soc">
      <div className="soc__head">
        <p className="ud-soc__title">{c.commentsH}</p>
        <MockReactions start={{ likes: 12, reposts: 3, liked: false, reposted: false }} comments={3} />
      </div>
      <p className="soc__by">
        {c.repostedByPre}Ada{c.repostedByJoin}Jun{c.repostedByMore(1)}
        {c.repostedByPost}
      </p>
      <SignedOutBox />
      <ul className="soc__list">
        {THREAD.map((cm) => (
          <MockCommentView key={cm.id} cm={cm} />
        ))}
      </ul>
    </div>
  );
}

const DRAFT = "love the grid, is it the same everywhere";
const POLISHED = "I love the grid. Is it the same on every page?";

/** The signed-in composer: the draft, the toolbar, and a revision with Aha, all local. */
export function ComposerSpecimen() {
  const [body, setBody] = useState(DRAFT);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const used = body === POLISHED;
  return (
    <div className="soc ud-soc">
      <div className="soc__compose">
        <div className={`soc__box${open ? " is-revising" : ""}`}>
          {open && (
            <div className="soc__rev" aria-label={c.revise}>
              <ol className="soc__turns">
                <li className="soc__turn">
                  <p className="soc__ask soc__tone--polish">{c.tones.polish}</p>
                  <div className="soc__aha">
                    <p className="soc__aha-head">
                      <Icon name="sparkle" size={14} />
                      {c.aha("qwen-3.8")}
                    </p>
                    <p className="soc__bubble soc__text">{POLISHED}</p>
                    <div className="soc__turn-actions">
                      {used ? (
                        <span className="soc__inbox">{c.inBox}</span>
                      ) : (
                        <button type="button" className="soc__btn soc__btn--sm" onClick={() => setBody(POLISHED)}>
                          {c.use}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              </ol>
              <div className="soc__asks">
                <div className="soc__chips" role="group" aria-label={c.quick}>
                  {(["polish", "shorter", "friendlier", "clearer"] as const).map((t) => (
                    <button key={t} type="button" className={`soc__tone soc__tone--${t}`} onClick={() => setNote("A specimen: Aha is not asked from this page.")}>
                      {c.tones[t]}
                    </button>
                  ))}
                </div>
                <button type="button" className="soc__x" onClick={() => setOpen(false)} aria-label={c.closeThread} title={c.closeThread}>
                  <Icon name="close" />
                </button>
              </div>
            </div>
          )}
          <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={c.placeholder} aria-label={c.placeholder} />
          <div className="soc__bar">
            <span className="soc__bar-start">
              <span className="soc__chip soc__chip--model">
                <Icon name="half" size={14} />
                <span className="soc__chip-label">qwen-3.8</span>
              </span>
              <button type="button" className="soc__aha-btn" aria-expanded={open} title={c.reviseTitle} onClick={() => setOpen((o) => !o)}>
                <Icon name="sparkle" />
                {c.revise}
              </button>
            </span>
            <span className="soc__bar-end">
              <span className="soc__len">{body.length} / 2,000</span>
              <button type="button" className="soc__btn soc__btn--go" disabled={!body.trim()} onClick={() => setNote("A specimen: nothing was posted.")}>
                {c.send}
              </button>
            </span>
          </div>
        </div>
        <p className="soc__under">
          <span>{c.signedInAs("Mina")}</span>
          <span className="soc__hint">{c.postHint}</span>
        </p>
        <div className="soc__notes" aria-live="polite">
          {used && <p className="soc__note soc__note--ok">{c.usedNote}</p>}
          {note && <p className="soc__small">{note}</p>}
          <p className="soc__small">{c.reviewNote}</p>
        </div>
      </div>
    </div>
  );
}

export function SignInSpecimen() {
  const [note, setNote] = useState(false);
  return (
    <div className="soc ud-soc">
      <div className="soc__signin">
        <p>{c.signInPrompt}</p>
        <div className="soc__row">
          <button type="button" className="soc__btn soc__btn--go" onClick={() => setNote(true)}>
            {c.createAccount}
          </button>
          <button type="button" className="soc__btn soc__btn--go" onClick={() => setNote(true)}>
            {c.signIn}
          </button>
        </div>
      </div>
      <p className="soc__who">
        <span>{c.signedInAs("Mina")}</span>
        <button type="button" className="soc__link" onClick={() => setNote(true)}>
          {c.signOut}
        </button>
      </p>
      <p className="soc__small" aria-live="polite">
        {note ? "A specimen: these buttons do nothing on this page." : "Signed out, then signed in."}
      </p>
    </div>
  );
}

const GLIDER = stamp(12, 12, [".#.", "..#", "###"], 4, 4);

export function ShapeCardSpecimen() {
  return (
    <div className="soc ud-soc">
      <ul className="soc__shapes">
        <li className="soc__shape">
          <span className="soc__shape-open">
            <Board grid={GLIDER} color={ARC.green} cell={14} label="A glider, published by a reader" className="soc__mini" />
          </span>
          <p className="ud-soc__h3">The commuter</p>
          <p className="soc__text">Five cells that walk diagonally, one square every four generations.</p>
          <p className="soc__meta">
            <Avatar name="Ada" />
            <span>{c.by("Ada")}</span>
            <time>27 Oct 2026</time>
          </p>
          <MockReactions start={{ likes: 7, reposts: 1, liked: false, reposted: false }} />
        </li>
      </ul>
    </div>
  );
}
