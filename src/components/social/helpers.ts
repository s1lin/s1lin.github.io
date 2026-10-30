import { SocialError } from "@/lib/social/client.ts";
import { forgetSession } from "@/lib/social/useSocial";
import type { SocialCopy } from "@/components/social/copy";

/** What to tell the reader about a failed call. */
export function errorText(e: unknown, c: SocialCopy): string {
  if (!(e instanceof SocialError)) return c.serverNote;
  switch (e.kind) {
    case "auth":
      forgetSession();
      return c.authNote;
    case "rate":
      return c.rateNote;
    case "refused":
      return c.refusedNote;
    case "invalid":
      return c.invalidNote;
    case "network":
      return c.networkNote;
    default:
      return c.serverNote;
  }
}

/** Why the sign-in window did not give a session. */
export function signInText(e: unknown, c: SocialCopy): string {
  if (e instanceof SocialError && e.kind === "refused") return e.message === "popup closed" ? c.popupClosed : c.popupBlocked;
  return errorText(e, c);
}

/** A date in the reader's language; empty if the server sent nothing usable. */
export function when(iso: string, lang: "en" | "zh" | "ja"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en", { dateStyle: "medium" }).format(d);
}
