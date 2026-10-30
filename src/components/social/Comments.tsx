import { useCallback, useEffect, useState } from "react";
import { Avatar, Icon } from "@/components/social/common";
import { Composer } from "@/components/social/Composer";
import { errorText, when } from "@/components/social/helpers";
import { Reactions, type ReactionState } from "@/components/social/Reactions";
import { SOCIAL_COPY, type SocialCopy } from "@/components/social/copy";
import type { Lang } from "@/components/life/copy";
import { moreReposters, reposterUrl, type Reposter, type SocialComment, type Thread } from "@/lib/social/client.ts";
import { social, useSession } from "@/lib/social/useSocial";

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
          <Composer
            target={target}
            parentId={cm.id}
            c={c}
            lang={lang}
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

/** "Reposted by A, B and 3 more": names are plain text; a name is a link only when it has a handle. */
function RepostedBy({ by, total, c }: { by: Reposter[]; total: number; c: SocialCopy }) {
  if (by.length === 0) return null;
  const more = moreReposters(by.length, total);
  return (
    <p className="soc__by">
      {c.repostedByPre}
      {by.map((r, i) => (
        <span key={`${r.name}:${i}`}>
          {i > 0 && c.repostedByJoin}
          {r.handle ? (
            <a href={reposterUrl(r.handle)} target="_blank" rel="noopener">
              {r.name}
            </a>
          ) : (
            r.name
          )}
        </span>
      ))}
      {more > 0 && c.repostedByMore(more)}
      {c.repostedByPost}
    </p>
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

      <RepostedBy by={thread?.repostedBy ?? []} total={page.reposts} c={c} />
      <Composer target={target} c={c} lang={lang} placeholder={c.placeholder} onDone={reload} />

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
