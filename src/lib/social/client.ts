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
/** Someone who reposted a target: a public name, and a handle when they have a page on Aha. */
export interface Reposter {
  name: string;
  handle: string | null;
}
/** One thing a member reposted, as their Aha page lists it. */
export interface RepostItem {
  kind: string;
  target: string;
  title: string;
  url: string;
  excerpt?: string;
  author?: string;
  at: string;
}
export interface Thread {
  counts: { likes: number; reposts: number; comments: number };
  /** The most recent reposters (up to 8); empty when the server does not say. */
  repostedBy: Reposter[];
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

/** The quick revisions Aha offers in the composer; anything else is said in words (an instruction). */
export const TONES = ["polish", "shorter", "friendlier", "clearer"] as const;
export type Tone = (typeof TONES)[number];
export const MAX_COMMENT = 2000;
/** How long a typed instruction to Aha may be. */
export const MAX_INSTRUCTION = 300;
/** The TokensBeat console, where a member adds a key or tops up. */
export const CONSOLE_URL = "https://tokensbeat.com";
export const CONSOLE_KEYS_URL = `${CONSOLE_URL}/keys`;
export interface ModelKey {
  id: number | string;
  name: string;
  models: string[];
}
/** The commenter's own Aha keys and the chat models each can reach. No keys: nothing to revise with. */
export interface ModelCatalog {
  keys: ModelKey[];
  defaultKeyId?: number | string;
  defaultModel?: string;
}
export interface Revision {
  text: string;
  model: string;
  keyId?: number | string;
}
/** The last model the reader chose (and, from older pages, a tone), kept in this browser. */
export interface RevisePrefs {
  keyId?: number | string;
  model?: string;
  tone?: Tone;
}
export const REVISE_PREFS_KEY = "tokensbeat-social-revise";

export type ErrorKind = "auth" | "refused" | "rate" | "invalid" | "network" | "server" | "aborted";

export class SocialError extends Error {
  kind: ErrorKind;
  status: number;
  reason?: string;
  /** The server's machine-readable code, when it sent one (e.g. "no_key"). */
  code?: string;
  constructor(kind: ErrorKind, status: number, message: string, reason?: string, code?: string) {
    super(message);
    this.name = "SocialError";
    this.kind = kind;
    this.status = status;
    this.reason = reason;
    this.code = code;
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max = 500): string | undefined => (typeof v === "string" && v.length > 0 ? v.slice(0, max) : undefined);

/** A failed response as an error: the kind says what the page should tell the reader. */
export function mapError(status: number, body: unknown): SocialError {
  const nested = isObject(body) && isObject(body.error) ? text(body.error.message) : undefined;
  const reason = isObject(body) ? text(body.reason) ?? text(body.message) ?? text(body.error) ?? nested : undefined;
  const rawCode = isObject(body) ? (isObject(body.error) ? body.error.code : body.code) : undefined;
  const code = typeof rawCode === "string" && /^[a-z0-9_]{1,40}$/.test(rawCode) ? rawCode : undefined;
  if (status === 401) return new SocialError("auth", status, "sign-in expired", reason, code);
  if (status === 403) return new SocialError("refused", status, "not allowed", reason, code);
  if (status === 429) return new SocialError("rate", status, "too many requests", reason, code);
  if (status >= 400 && status < 500) return new SocialError("invalid", status, "refused", reason, code);
  return new SocialError("server", status, "server error", reason, code);
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

const isTone = (v: unknown): v is Tone => typeof v === "string" && (TONES as readonly string[]).includes(v);

export function loadRevisePrefs(storage: StorageLike | null): RevisePrefs {
  try {
    const raw = storage?.getItem(REVISE_PREFS_KEY);
    const d = raw ? (JSON.parse(raw) as unknown) : null;
    if (!isObject(d)) return {};
    return {
      keyId: typeof d.keyId === "number" || typeof d.keyId === "string" ? d.keyId : undefined,
      model: text(d.model, 128),
      tone: isTone(d.tone) ? d.tone : undefined,
    };
  } catch {
    return {};
  }
}

export function saveRevisePrefs(storage: StorageLike | null, p: RevisePrefs): void {
  try {
    storage?.setItem(REVISE_PREFS_KEY, JSON.stringify(p));
  } catch {
    /* private mode: the choice lasts until reload */
  }
}

/** The key and model to start from: the saved choice if it is still on offer, else the server's default, else the first. */
export function pickModel(cat: ModelCatalog, prefs: RevisePrefs): { keyId: number | string; model: string } | null {
  const has = (keyId: number | string | undefined, model: string | undefined) => {
    const k = cat.keys.find((x) => x.id === keyId);
    return k && model && k.models.includes(model) ? { keyId: k.id, model } : null;
  };
  const first = cat.keys.find((k) => k.models.length > 0);
  return has(prefs.keyId, prefs.model) ?? has(cat.defaultKeyId, cat.defaultModel) ?? (first ? { keyId: first.id, model: first.models[0] } : null);
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

const HANDLE = /^[A-Za-z0-9_-]{1,40}$/;
/** A member's page on Aha; only a plain handle makes a link, anything else is no handle. */
export const reposterUrl = (handle: string) => `${AHA_BASE}/#/blog/@${handle}`;
/** How many reposters the names shown leave out. */
export const moreReposters = (shown: number, total: number) => Math.max(0, Math.floor(total) - shown);
const asReposter = (v: unknown): Reposter | null => {
  if (!isObject(v)) return null;
  const name = text(v.name, 100);
  if (!name) return null;
  const h = typeof v.handle === "string" ? v.handle.replace(/^@/, "") : "";
  return { name, handle: HANDLE.test(h) ? h : null };
};
const asRepostItem = (v: unknown): RepostItem | null => {
  if (!isObject(v) || typeof v.target !== "string" || typeof v.url !== "string") return null;
  return { kind: text(v.kind, 20) ?? "", target: v.target, title: text(v.title, 200) ?? "", url: v.url, excerpt: text(v.excerpt, 300), author: text(v.author, 100), at: typeof v.at === "string" ? v.at : "" };
};

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

  async function call(method: string, path: string, opts: { body?: unknown; auth?: "need" | "if"; signal?: AbortSignal } = {}): Promise<unknown> {
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
      res = await env.fetch(`${env.base}${path}`, { method, headers, body, credentials: "omit", cache: "no-store", signal: opts.signal });
    } catch {
      if (opts.signal?.aborted) throw new SocialError("aborted", 0, "aborted");
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
        repostedBy: (Array.isArray(d.repostedBy) ? d.repostedBy : []).slice(0, 8).map(asReposter).filter((x): x is Reposter => x !== null),
        comments: (Array.isArray(d.comments) ? d.comments : []).map(asComment).filter((x): x is SocialComment => x !== null),
        me: m ? { liked: m.liked === true, reposted: m.reposted === true, likedComments: Array.isArray(m.likedComments) ? m.likedComments.filter((x): x is string => typeof x === "string") : [] } : undefined,
        next: typeof d.next === "string" ? d.next : null,
      };
    },
    /** What a member has reposted, newest first (their Aha page lists the same). */
    async reposts(handle: string, cursor?: string): Promise<{ items: RepostItem[]; next: string | null }> {
      const h = handle.replace(/^@/, "");
      if (!HANDLE.test(h)) return { items: [], next: null };
      const j = await call("GET", `/api/public/blog/${h}/reposts${cursor ? `?${q({ cursor })}` : ""}`);
      const d = isObject(j) ? j : {};
      return { items: (Array.isArray(d.items) ? d.items : []).map(asRepostItem).filter((x): x is RepostItem => x !== null), next: typeof d.next === "string" ? d.next : null };
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
    /** The signed-in reader's own keys and models, for "Revise with Aha". */
    async models(): Promise<ModelCatalog> {
      const j = await call("GET", "/api/social/models", { auth: "need" });
      const d = isObject(j) ? j : {};
      const keys = (Array.isArray(d.keys) ? d.keys : []).flatMap((k): ModelKey[] => {
        if (!isObject(k) || (typeof k.id !== "number" && typeof k.id !== "string")) return [];
        const models = (Array.isArray(k.models) ? k.models : []).filter((m): m is string => typeof m === "string" && /^[A-Za-z0-9._:/@-]{1,128}$/.test(m));
        return models.length ? [{ id: k.id, name: text(k.name, 64) ?? `Key ${k.id}`, models }] : [];
      });
      return {
        keys,
        defaultKeyId: typeof d.defaultKeyId === "number" || typeof d.defaultKeyId === "string" ? d.defaultKeyId : undefined,
        defaultModel: text(d.defaultModel, 128),
      };
    },
    /**
     * "Revise with Aha": a rewrite of `text` by the reader's own model on their own key, by a quick tone or by their own
     * instruction (or both). It posts nothing. `signal` stops it.
     */
    async revise(req: { text: string; keyId?: number | string; model?: string; tone?: Tone; instruction?: string }, signal?: AbortSignal): Promise<Revision> {
      const instruction = req.instruction?.trim().slice(0, MAX_INSTRUCTION) || undefined;
      const j = await call("POST", "/api/social/revise", { auth: "need", signal, body: { text: req.text, keyId: req.keyId, model: req.model, tone: req.tone, instruction } });
      const d = isObject(j) ? j : {};
      const out = typeof d.text === "string" ? d.text.trim().slice(0, MAX_COMMENT) : "";
      if (!out) throw new SocialError("server", 502, "empty revision");
      return { text: out, model: text(d.model, 128) ?? req.model ?? "", keyId: typeof d.keyId === "number" || typeof d.keyId === "string" ? d.keyId : req.keyId };
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
