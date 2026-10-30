import { useCallback, useEffect, useState } from "react";
import { Avatar, Icon, SignInBar } from "@/components/social/common";
import { errorText, when } from "@/components/social/helpers";
import { Reactions, type ReactionState } from "@/components/social/Reactions";
import { SOCIAL_COPY, type SocialCopy } from "@/components/social/copy";
import type { Lang } from "@/components/life/copy";
import type { SocialComment, Thread } from "@/lib/social/client.ts";
import { social, useSession } from "@/lib/social/useSocial";

type Outcome = { tone: "ok" | "wait" | "bad"; text: string } | null;

/** The comment box: one text area, sent to be screened, with what came of it told plainly. */
function Compose({ target, parentId, c, onDone, onCancel, placeholder }: { target: string; parentId?: string; c: SocialCopy; onDone: () => void; onCancel?: () => void; placeholder: string }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Outcome>(null);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    setOut(null);
    try {
      const v = await social().comment(target, text, parentId);
      if (v.status === "rejected") setOut({ tone: "bad", text: c.rejectedNote(v.reason ?? "") });
      else {
        setBody("");
        setOut(v.status === "approved" ? { tone: "ok", text: c.approvedNote } : { tone: "wait", text: c.pendingNote });
        onDone();
      }
    } catch (err) {
      setOut({ tone: "bad", text: errorText(err, c) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="soc__form" onSubmit={send}>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={parentId ? 4 : 8} placeholder={placeholder} aria-label={placeholder} />
      <div className="soc__row">
        <button type="submit" className="soc__btn soc__btn--go" disabled={busy || !body.trim()}>
          {busy ? c.sending : c.send}
        </button>
        {onCancel && (
          <button type="button" className="soc__btn" onClick={onCancel}>
            {c.cancel}
          </button>
        )}
        <span className="soc__len">{body.length}/2000</span>
      </div>
      {out && (
        <p className={`soc__note soc__note--${out.tone}`} role="status">
          {out.text}
        </p>
      )}
    </form>
  );
}

function CommentView({ cm, c, lang, target, liked, onChanged, reply }: { cm: SocialComment; c: SocialCopy; lang: Lang; target: string; liked: boolean; onChanged: () => void; reply: boolean }) {
  const { session } = useSession();
  const [st, setSt] = useState<ReactionState>({ likes: cm.likes, reposts: 0, liked, reposted: false });
  const [replying, setReplying] = useState(false);
  return (
    <li className={`soc__comment${cm.pending ? " is-pending" : ""}`} id={`c-${cm.id}`}>
      <Avatar name={cm.author.name} src={cm.author.avatar} />
      <div className="soc__cbody">
        <p className="soc__meta">
          <b>{cm.author.name}</b>
          <time dateTime={cm.at}>{when(cm.at, lang)}</time>
          {cm.pending && <em className="soc__tag">{c.pendingTag}</em>}
        </p>
        {/* Plain text only: whatever a reader typed is shown as typed. */}
        <p className="soc__text">{cm.body}</p>
        <div className="soc__actions">
          <CommentLike id={cm.id} st={st} setSt={setSt} c={c} />
          {reply && session && (
            <button type="button" className="soc__link" onClick={() => setReplying((r) => !r)}>
              {c.reply}
            </button>
          )}
        </div>
        {replying && (
          <Compose
            target={target}
            parentId={cm.id}
            c={c}
            placeholder={c.replyPlaceholder}
            onCancel={() => setReplying(false)}
            onDone={() => {
              setReplying(false);
              onChanged();
            }}
          />
        )}
        {cm.replies && cm.replies.length > 0 && (
          <ul className="soc__list soc__list--replies">
            {cm.replies.map((r) => (
              <CommentView key={`${r.id}:${r.likes}`} cm={r} c={c} lang={lang} target={target} liked={false} onChanged={onChanged} reply={false} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function CommentLike({ id, st, setSt, c }: { id: string; st: ReactionState; setSt: (s: ReactionState) => void; c: SocialCopy }) {
  const { session, signIn } = useSession();
  const [err, setErr] = useState("");
  const press = async () => {
    setErr("");
    if (!session) {
      try {
        await signIn();
      } catch (e) {
        setErr(errorText(e, c));
      }
      return;
    }
    const before = st;
    const on = !st.liked;
    setSt({ ...st, liked: on, likes: Math.max(0, st.likes + (on ? 1 : -1)) });
    try {
      await social().like(on, { commentId: id });
    } catch (e) {
      setSt(before);
      setErr(errorText(e, c));
    }
  };
  return (
    <>
      <button type="button" className="soc__react soc__react--like" aria-pressed={st.liked} onClick={press} title={st.liked ? c.liked : c.like}>
        <Icon name="heart" />
        <span>{st.likes}</span>
        <span className="soc__sr">{st.liked ? c.liked : c.like}</span>
      </button>
      {err && <span className="soc__note soc__note--bad">{err}</span>}
    </>
  );
}

/** A thread under a page: reactions to the page itself, the comment box, then the comments. */
export function Comments({ target, lang }: { target: string; lang: Lang }) {
  const c = SOCIAL_COPY[lang];
  const { session } = useSession();
  const [thread, setThread] = useState<Thread | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [page, setPage] = useState<ReactionState>({ likes: 0, reposts: 0, liked: false, reposted: false });
  const [moreBusy, setMoreBusy] = useState(false);

  // Read again when the reader signs in or out ("mine" and "pending" depend on who asks), and after a post.
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const who = session?.token ?? "";
  useEffect(() => {
    let live = true;
    social()
      .thread(target)
      .then((t) => {
        if (!live) return;
        setThread(t);
        setPage({ likes: t.counts.likes, reposts: t.counts.reposts, liked: t.me?.liked ?? false, reposted: t.me?.reposted ?? false });
        setState("ready");
      })
      .catch(() => live && setState("error"));
    return () => {
      live = false;
    };
  }, [target, who, tick]);

  const more = async () => {
    if (!thread?.next || moreBusy) return;
    setMoreBusy(true);
    try {
      const t = await social().thread(target, thread.next);
      setThread({ ...thread, comments: [...thread.comments, ...t.comments], next: t.next });
    } catch {
      /* the button stays, to try again */
    } finally {
      setMoreBusy(false);
    }
  };

  const liked = new Set(thread?.me?.likedComments ?? []);
  return (
    <section className="soc" aria-labelledby={`soc-${target}`} lang={lang === "zh" ? "zh-Hans" : lang}>
      <header className="soc__head">
        <h2 id={`soc-${target}`}>{c.commentsH}</h2>
        <Reactions target={target} state={page} onState={setPage} c={c} comments={thread?.counts.comments ?? 0} />
      </header>

      <SignInBar c={c} />
      {session && <Compose target={target} c={c} placeholder={c.placeholder} onDone={reload} />}
      <p className="soc__small">{c.moderation}</p>

      {state === "loading" && <p className="soc__small">{c.loading}</p>}
      {state === "error" && (
        <p className="soc__note soc__note--bad" role="alert">
          {c.loadError}{" "}
          <button type="button" className="soc__link" onClick={() => { setState("loading"); reload(); }}>
            {c.retry}
          </button>
        </p>
      )}
      {state === "ready" && thread && thread.comments.length === 0 && <p className="soc__empty">{c.empty}</p>}
      {thread && thread.comments.length > 0 && (
        <ul className="soc__list">
          {thread.comments.map((cm) => (
            <CommentView key={`${cm.id}:${cm.likes}:${liked.has(cm.id)}`} cm={cm} c={c} lang={lang} target={target} liked={liked.has(cm.id)} onChanged={reload} reply />
          ))}
        </ul>
      )}
      {thread?.next && (
        <button type="button" className="soc__btn" onClick={more} disabled={moreBusy}>
          {moreBusy ? c.loading : c.more}
        </button>
      )}
    </section>
  );
}
