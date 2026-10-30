import { useState, type ReactNode } from "react";
import { signInText } from "@/components/social/helpers";
import { useSession, useSocialConfig } from "@/lib/social/useSocial";
import type { SocialCopy } from "@/components/social/copy";

const PATHS = {
  heart: "M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.4-7 10-7 10z",
  repost: "M7 7h9l-2-2M17 17H8l2 2M7 7v4M17 17v-4",
  bubble: "M5 6h14v9H10l-4 3v-3H5z",
  close: "M6 6l12 12M18 6L6 18",
  caret: "M7 10l5 5 5-5",
  enter: "M19 6v6a3 3 0 0 1-3 3H6m0 0l4-4m-4 4l4 4",
} as const;

export function Icon({ name, size = 16 }: { name: keyof typeof PATHS | "sparkle" | "half"; size?: number }) {
  // Aha's mark: a four-point spark, filled; the model chip's mark: a half-filled circle (a Bauhaus disc).
  if (name === "sparkle") {
    return (
      <svg className="soc__icon soc__icon--spark" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path d="M12 2.5c.6 4.7 2.8 6.9 7.5 7.5-4.7.6-6.9 2.8-7.5 7.5-.6-4.7-2.8-6.9-7.5-7.5 4.7-.6 6.9-2.8 7.5-7.5z" fill="currentColor" />
        <path d="M19 15.5c.25 1.9 1.1 2.75 3 3-1.9.25-2.75 1.1-3 3-.25-1.9-1.1-2.75-3-3 1.9-.25 2.75-1.1 3-3z" fill="currentColor" opacity="0.7" />
      </svg>
    );
  }
  if (name === "half") {
    return (
      <svg className="soc__icon soc__icon--half" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className="soc__icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
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
