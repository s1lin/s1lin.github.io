import { useState, type ReactNode } from "react";
import { signInText } from "@/components/social/helpers";
import { useSession, useSocialConfig } from "@/lib/social/useSocial";
import type { SocialCopy } from "@/components/social/copy";

export function Icon({ name }: { name: "heart" | "repost" | "bubble" }) {
  const d =
    name === "heart"
      ? "M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"
      : name === "repost"
        ? "M7 7h9l-2-2M17 17H8l2 2M7 7v4M17 17v-4"
        : "M5 6h14v9H10l-4 3v-3H5z";
  return (
    <svg className="soc__icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/** "Sign in with TokensBeat": a link to make an account (the owner's referral link) and a button for the sign-in window. */
export function SignInBar({ c, note }: { c: SocialCopy; note?: ReactNode }) {
  const { session, signIn, signOut } = useSession();
  const cfg = useSocialConfig();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (session) {
    return (
      <p className="soc__who">
        <span>{c.signedInAs(session.user.name)}</span>
        <button type="button" className="soc__link" onClick={signOut}>
          {c.signOut}
        </button>
      </p>
    );
  }
  const go = async () => {
    setBusy(true);
    setErr("");
    try {
      await signIn();
    } catch (e) {
      setErr(signInText(e, c));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="soc__signin">
      <p>{note ?? c.signInPrompt}</p>
      <div className="soc__row">
        <a className="soc__btn soc__btn--go" href={cfg?.signInUrl ?? "https://tokensbeat.com/?aff=EL8RSC36GVWT"} target="_blank" rel="noopener">
          {c.createAccount}
        </a>
        <button type="button" className="soc__btn soc__btn--go" onClick={go} disabled={busy}>
          {busy ? c.waitingPopup : c.signIn}
        </button>
      </div>
      {err && (
        <p className="soc__note soc__note--bad" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}

/** The author's picture (https only, from the server) or their initial. */
export function Avatar({ name, src }: { name: string; src?: string }) {
  return src ? <img className="soc__avatar" src={src} alt="" width={28} height={28} loading="lazy" referrerPolicy="no-referrer" /> : <span className="soc__avatar soc__avatar--initial" aria-hidden="true">{[...name][0]?.toUpperCase() ?? "?"}</span>;
}
