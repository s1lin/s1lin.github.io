import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { clearSession, connect, createSocial, loadSession, resolveBase, saveSession, type Session, type Social, type SocialConfig } from "./client.ts";

declare global {
  interface Window {
    /** A page may set this before the app loads to point the client elsewhere. */
    __SOCIAL_BASE__?: string;
  }
}

let client: Social | null = null;

/** The client for this page. Only in the browser, after render: never called on the server. */
export function social(): Social {
  if (!client) {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      /* blocked: no saved session */
    }
    const base = resolveBase({ override: window.__SOCIAL_BASE__, search: location.search, hostname: location.hostname });
    client = createSocial({ base, fetch: (...a) => window.fetch(...a), storage });
  }
  return client;
}

// One session for every component on the page.
let current: Session | null | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export interface SessionApi {
  session: Session | null;
  /** Opens the Aha sign-in window; rejects with a SocialError if it is blocked or closed. */
  signIn: () => Promise<Session>;
  signOut: () => void;
}

export function useSession(): SessionApi {
  // The server and the first client render agree on "signed out"; the saved session comes in an effect.
  const snap = useSyncExternalStore(subscribe, () => (current === undefined ? null : current), () => null);
  useEffect(() => {
    if (current === undefined) {
      try {
        current = loadSession(window.localStorage);
      } catch {
        current = null;
      }
      emit();
    }
  }, []);
  const signIn = useCallback(async () => {
    const s = await connect({
      base: social().base,
      siteOrigin: location.origin,
      open: (url) => window.open(url, "tokensbeat-social", "popup,width=480,height=720"),
      listen: (fn) => {
        const h = (e: MessageEvent) => fn({ origin: e.origin, data: e.data });
        window.addEventListener("message", h);
        return () => window.removeEventListener("message", h);
      },
    });
    try {
      saveSession(window.localStorage, s);
    } catch {
      /* private mode */
    }
    current = s;
    emit();
    return s;
  }, []);
  const signOut = useCallback(() => {
    try {
      clearSession(window.localStorage);
    } catch {
      /* nothing saved */
    }
    current = null;
    emit();
  }, []);
  return { session: snap, signIn, signOut };
}

/** A call made when the saved session turned out to be dead: drop it everywhere. */
export function forgetSession() {
  try {
    clearSession(window.localStorage);
  } catch {
    /* nothing saved */
  }
  current = null;
  emit();
}

let configPromise: Promise<SocialConfig> | null = null;

/** The sign-up link and friends, fetched once. */
export function useSocialConfig(): SocialConfig | null {
  const [cfg, setCfg] = useState<SocialConfig | null>(null);
  useEffect(() => {
    let live = true;
    configPromise ??= social().config();
    configPromise
      .then((c) => live && setCfg(c))
      .catch(() => {
        configPromise = null;
      });
    return () => {
      live = false;
    };
  }, []);
  return cfg;
}

