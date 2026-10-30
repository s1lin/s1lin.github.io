/*
 * The client of Aha Social (agent-ui/SOCIAL.md): comments, likes, reposts and
 * shapes from other pages. No window, no React: the browser pieces are passed in,
 * so the same code runs under `node --test`.
 */

export const AHA_BASE = "https://aha.tokensbeat.com";
export const TOKEN_KEY = "tokensbeat-social-token";
export const USER_KEY = "tokensbeat-social-user";
export const MAX_SHAPE = 64;

export interface Author {
  name: string;
  avatar?: string;
}
export interface Session {
  token: string;
  user: Author;
}
export interface SocialComment {
  id: string;
  author: Author;
  body: string;
  at: string;
  likes: number;
  pending?: boolean;
  replies?: SocialComment[];
}
export interface Thread {
  counts: { likes: number; reposts: number; comments: number };
  comments: SocialComment[];
  me?: { liked: boolean; reposted: boolean; likedComments: string[] };
  next?: string | null;
}
export interface Verdict {
  id: string;
  status: "approved" | "pending" | "rejected";
  reason?: string;
}
export interface Shape {
  id: string;
  title: string;
  note: string;
  w: number;
  h: number;
  /** Row strings of 0 and 1. */
  cells: string[];
  author: Author;
  likes: number;
  reposts: number;
  at: string;
  liked?: boolean;
  reposted?: boolean;
}
export interface ShapePage {
  shapes: Shape[];
  next?: string | null;
}
export interface SocialConfig {
  signInUrl: string;
  connectUrl?: string;
  origins?: string[];
}

export type ErrorKind = "auth" | "refused" | "rate" | "invalid" | "network" | "server";

export class SocialError extends Error {
  kind: ErrorKind;
  status: number;
  reason?: string;
  constructor(kind: ErrorKind, status: number, message: string, reason?: string) {
    super(message);
    this.name = "SocialError";
    this.kind = kind;
    this.status = status;
    this.reason = reason;
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max = 500): string | undefined => (typeof v === "string" && v.length > 0 ? v.slice(0, max) : undefined);

/** A failed response as an error: the kind says what the page should tell the reader. */
export function mapError(status: number, body: unknown): SocialError {
  const reason = isObject(body) ? text(body.reason) ?? text(body.message) ?? text(body.error) : undefined;
  if (status === 401) return new SocialError("auth", status, "sign-in expired", reason);
  if (status === 403) return new SocialError("refused", status, "not allowed", reason);
  if (status === 429) return new SocialError("rate", status, "too many requests", reason);
  if (status >= 400 && status < 500) return new SocialError("invalid", status, "refused", reason);
  return new SocialError("server", status, "server error", reason);
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** An origin from a string, or null: only http(s), and plain http only on this machine. */
function originOf(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.protocol === "https:" || (u.protocol === "http:" && LOOPBACK.has(u.hostname))) return u.origin;
  } catch {
    /* not a URL */
  }
  return null;
}

/**
 * Where the API is: window.__SOCIAL_BASE__ if the page sets it, else ?social=
 * (only on localhost, for development), else Aha.
 */
export function resolveBase(env: { override?: string; search?: string; hostname?: string }): string {
  const fromWindow = originOf(env.override);
  if (fromWindow) return fromWindow;
  if (env.hostname && LOOPBACK.has(env.hostname)) {
    const q = new URLSearchParams(env.search ?? "").get("social");
    const fromQuery = originOf(q);
    if (fromQuery) return fromQuery;
  }
  return AHA_BASE;
}

// ---------------------------------------------------------------- the session

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

const TOKEN = /^[A-Za-z0-9._~+/=-]{16,4096}$/;

/** A sign-in message from the popup, or null. The origin must be Aha's own. */
export function acceptMessage(ev: { origin: string; data: unknown }, base: string): Session | null {
  if (ev.origin !== originOf(base)) return null;
  const d = ev.data;
  if (!isObject(d) || d.type !== "tokensbeat-social") return null;
  const token = d.token;
  if (typeof token !== "string" || !TOKEN.test(token)) return null;
  const u = isObject(d.user) ? d.user : {};
  const avatar = typeof u.avatar === "string" && u.avatar.startsWith("https://") ? u.avatar.slice(0, 500) : undefined;
  return { token, user: { name: text(u.name, 100) ?? "TokensBeat", avatar } };
}

export function loadSession(storage: StorageLike | null): Session | null {
  try {
    const token = storage?.getItem(TOKEN_KEY);
    if (!token || !TOKEN.test(token)) return null;
    const raw = storage?.getItem(USER_KEY);
    const u = raw ? (JSON.parse(raw) as unknown) : {};
    const user = isObject(u) ? u : {};
    const avatar = typeof user.avatar === "string" && user.avatar.startsWith("https://") ? user.avatar : undefined;
    return { token, user: { name: text(user.name, 100) ?? "TokensBeat", avatar } };
  } catch {
    return null;
  }
}

export function saveSession(storage: StorageLike | null, s: Session): void {
  try {
    storage?.setItem(TOKEN_KEY, s.token);
    storage?.setItem(USER_KEY, JSON.stringify(s.user));
  } catch {
    /* private mode: the session lasts until reload */
  }
}

export function clearSession(storage: StorageLike | null): void {
  try {
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(USER_KEY);
  } catch {
    /* nothing to clear */
  }
}

export const connectUrl = (base: string, siteOrigin: string) => `${base}/#/social-connect?origin=${encodeURIComponent(siteOrigin)}`;

export interface ConnectDeps {
  base: string;
  siteOrigin: string;
  open: (url: string) => { closed: boolean } | null;
  listen: (fn: (ev: { origin: string; data: unknown }) => void) => () => void;
  /** How long to wait for the popup, in milliseconds. */
  timeout?: number;
  pollEvery?: number;
}

/** Opens the Aha popup and waits for its token. Rejects if it is blocked, closed, or silent too long. */
export function connect(deps: ConnectDeps): Promise<Session> {
  return new Promise((resolve, reject) => {
    const popup = deps.open(connectUrl(deps.base, deps.siteOrigin));
    if (!popup) return reject(new SocialError("refused", 0, "popup blocked"));
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      stop();
      clearInterval(poll);
      clearTimeout(limit);
      fn();
    };
    const stop = deps.listen((ev) => {
      const s = acceptMessage(ev, deps.base);
      if (s) finish(() => resolve(s));
    });
    const poll = setInterval(() => {
      if (popup.closed) finish(() => reject(new SocialError("refused", 0, "popup closed")));
    }, deps.pollEvery ?? 500);
    const limit = setTimeout(() => finish(() => reject(new SocialError("network", 0, "timed out"))), deps.timeout ?? 5 * 60_000);
  });
}

// ---------------------------------------------------------------- the calls

export interface Env {
  base: string;
  fetch: typeof fetch;
  storage: StorageLike | null;
}

const asComment = (v: unknown): SocialComment | null => {
  if (!isObject(v) || typeof v.id !== "string" || typeof v.body !== "string") return null;
  const a = isObject(v.author) ? v.author : {};
  const replies = Array.isArray(v.replies) ? v.replies.map(asComment).filter((c): c is SocialComment => c !== null) : undefined;
  return {
    id: v.id,
    author: { name: text(a.name, 100) ?? "TokensBeat", avatar: typeof a.avatar === "string" && a.avatar.startsWith("https://") ? a.avatar : undefined },
    body: v.body.slice(0, 2000),
    at: typeof v.at === "string" ? v.at : "",
    likes: Number.isFinite(v.likes) ? Number(v.likes) : 0,
    pending: v.pending === true,
    replies,
  };
};

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

const asShape = (v: unknown): Shape | null => {
  if (!isObject(v) || typeof v.id !== "string" || !Array.isArray(v.cells)) return null;
  const cells = v.cells.filter((r): r is string => typeof r === "string" && /^[01]+$/.test(r));
  const w = n(v.w);
  const h = n(v.h);
  if (!w || !h || w > MAX_SHAPE || h > MAX_SHAPE || cells.length !== h || cells.some((r) => r.length !== w)) return null;
  const a = isObject(v.author) ? v.author : {};
  return {
    id: v.id,
    title: text(v.title, 80) ?? "",
    note: text(v.note, 500) ?? "",
    w,
    h,
    cells,
    author: { name: text(a.name, 100) ?? "TokensBeat" },
    likes: n(v.likes),
    reposts: n(v.reposts),
    at: typeof v.at === "string" ? v.at : "",
    liked: v.liked === true,
    reposted: v.reposted === true,
  };
};

/** The calls of the contract, over an injected fetch and storage. */
export function createSocial(env: Env) {
  const session = () => loadSession(env.storage);

  async function call(method: string, path: string, opts: { body?: unknown; auth?: "need" | "if" } = {}): Promise<unknown> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (opts.auth) {
      const s = session();
      if (s) headers.Authorization = `Bearer ${s.token}`;
      else if (opts.auth === "need") throw new SocialError("auth", 401, "not signed in");
    }
    let body: string | undefined;
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
    let res: Response;
    try {
      res = await env.fetch(`${env.base}${path}`, { method, headers, body, credentials: "omit", cache: "no-store" });
    } catch {
      throw new SocialError("network", 0, "network");
    }
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      /* an empty body */
    }
    if (!res.ok) {
      const err = mapError(res.status, json);
      if (err.kind === "auth") clearSession(env.storage);
      throw err;
    }
    return json;
  }

  const q = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
    return p.toString();
  };

  return {
    base: env.base,
    session,
    async config(): Promise<SocialConfig> {
      const j = await call("GET", "/api/public/social/config");
      const d = isObject(j) ? j : {};
      const signIn = typeof d.signInUrl === "string" && originOf(d.signInUrl) ? d.signInUrl : "https://tokensbeat.com/?aff=EL8RSC36GVWT";
      return { signInUrl: signIn, connectUrl: text(d.connectUrl), origins: Array.isArray(d.origins) ? d.origins.filter((o): o is string => typeof o === "string") : undefined };
    },
    async thread(target: string, cursor?: string): Promise<Thread> {
      const j = await call("GET", `/api/public/social/thread?${q({ target, cursor })}`, { auth: "if" });
      const d = isObject(j) ? j : {};
      const c = isObject(d.counts) ? d.counts : {};
      const m = isObject(d.me) ? d.me : undefined;
      return {
        counts: { likes: n(c.likes), reposts: n(c.reposts), comments: n(c.comments) },
        comments: (Array.isArray(d.comments) ? d.comments : []).map(asComment).filter((x): x is SocialComment => x !== null),
        me: m ? { liked: m.liked === true, reposted: m.reposted === true, likedComments: Array.isArray(m.likedComments) ? m.likedComments.filter((x): x is string => typeof x === "string") : [] } : undefined,
        next: typeof d.next === "string" ? d.next : null,
      };
    },
    async comment(target: string, body: string, parentId?: string): Promise<Verdict> {
      const j = await call("POST", "/api/social/comments", { auth: "need", body: { target, body, parentId } });
      const d = isObject(j) ? j : {};
      const status = d.status === "approved" || d.status === "pending" || d.status === "rejected" ? d.status : "pending";
      return { id: typeof d.id === "string" ? d.id : "", status, reason: text(d.reason) };
    },
    /** Like or unlike a target or a comment. */
    async like(on: boolean, ref: { target?: string; commentId?: string }): Promise<void> {
      await call(on ? "POST" : "DELETE", "/api/social/like", { auth: "need", body: ref });
    },
    async repost(on: boolean, target: string): Promise<void> {
      await call(on ? "POST" : "DELETE", "/api/social/repost", { auth: "need", body: { target } });
    },
    async shapes(cursor?: string): Promise<ShapePage> {
      const j = await call("GET", `/api/public/social/shapes?${q({ cursor })}`, { auth: "if" });
      const d = isObject(j) ? j : {};
      return {
        shapes: (Array.isArray(d.shapes) ? d.shapes : []).map(asShape).filter((x): x is Shape => x !== null),
        next: typeof d.next === "string" ? d.next : null,
      };
    },
    async submitShape(s: { title: string; note: string; w: number; h: number; cells: string[] }): Promise<Verdict> {
      const j = await call("POST", "/api/social/shapes", { auth: "need", body: s });
      const d = isObject(j) ? j : {};
      const status = d.status === "approved" || d.status === "pending" || d.status === "rejected" ? d.status : "pending";
      return { id: typeof d.id === "string" ? d.id : "", status, reason: text(d.reason) };
    },
  };
}

export type Social = ReturnType<typeof createSocial>;
