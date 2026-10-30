import { useState } from "react";
import { Icon } from "@/components/social/common";
import { errorText, signInText } from "@/components/social/helpers";
import type { SocialCopy } from "@/components/social/copy";
import { social, useSession } from "@/lib/social/useSocial";

export interface ReactionState {
  likes: number;
  reposts: number;
  liked: boolean;
  reposted: boolean;
}

/** Like and repost, with their counts, as on X: a press flips it at once and is undone if the call fails. */
export function Reactions({ target, state, onState, c, comments }: { target: string; state: ReactionState; onState: (s: ReactionState) => void; c: SocialCopy; comments?: number }) {
  const { session, signIn } = useSession();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = async (kind: "like" | "repost") => {
    if (busy) return;
    setErr("");
    if (!session) {
      try {
        await signIn();
      } catch (e) {
        setErr(signInText(e, c));
      }
      return;
    }
    const before = state;
    const on = kind === "like" ? !state.liked : !state.reposted;
    const delta = on ? 1 : -1;
    onState(kind === "like" ? { ...state, liked: on, likes: Math.max(0, state.likes + delta) } : { ...state, reposted: on, reposts: Math.max(0, state.reposts + delta) });
    setBusy(true);
    try {
      if (kind === "like") await social().like(on, { target });
      else await social().repost(on, target);
    } catch (e) {
      onState(before);
      setErr(errorText(e, c));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="soc__reactions">
      {comments !== undefined && (
        <span className="soc__count">
          <Icon name="bubble" />
          {comments}
        </span>
      )}
      <button type="button" className="soc__react" aria-pressed={state.reposted} onClick={() => toggle("repost")} title={state.reposted ? c.reposted : c.repost}>
        <Icon name="repost" />
        <span>{state.reposts}</span>
        <span className="soc__sr">{state.reposted ? c.reposted : c.repost}</span>
      </button>
      <button type="button" className="soc__react soc__react--like" aria-pressed={state.liked} onClick={() => toggle("like")} title={state.liked ? c.liked : c.like}>
        <Icon name="heart" />
        <span>{state.likes}</span>
        <span className="soc__sr">{state.liked ? c.liked : c.like}</span>
      </button>
      {err && (
        <span className="soc__note soc__note--bad" role="alert">
          {err}
        </span>
      )}
    </div>
  );
}
