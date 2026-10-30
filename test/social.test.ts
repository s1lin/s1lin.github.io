import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AHA_BASE, SocialError, TOKEN_KEY, USER_KEY, acceptMessage, clearSession, connect, connectUrl, createSocial, loadSession, mapError, resolveBase, saveSession,
  type StorageLike,
} from "../src/lib/social/client.ts";
import { centre, cropShape } from "../src/lib/social/shape.ts";

const TOKEN = "abcdefghijklmnop.qrstuvwxyz012345";
const memory = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
};

test("the base is Aha unless the page or (on localhost) ?social= says otherwise", () => {
  assert.equal(resolveBase({}), AHA_BASE);
  assert.equal(resolveBase({ search: "?social=http://127.0.0.1:8799", hostname: "s1lin.tokensbeat.com" }), AHA_BASE);
  assert.equal(resolveBase({ search: "?social=http://127.0.0.1:8799", hostname: "127.0.0.1" }), "http://127.0.0.1:8799");
  assert.equal(resolveBase({ override: "https://example.com/path" }), "https://example.com");
  assert.equal(resolveBase({ override: "http://evil.example" }), AHA_BASE);
  assert.equal(resolveBase({ override: "javascript:alert(1)" }), AHA_BASE);
});

test("a sign-in message counts only from Aha's origin with a well-formed token", () => {
  const good = { type: "tokensbeat-social", token: TOKEN, user: { name: "Mina", avatar: "https://x.test/a.png" } };
  assert.deepEqual(acceptMessage({ origin: AHA_BASE, data: good }, AHA_BASE), { token: TOKEN, user: { name: "Mina", avatar: "https://x.test/a.png" } });
  assert.equal(acceptMessage({ origin: "https://evil.example", data: good }, AHA_BASE), null);
  assert.equal(acceptMessage({ origin: AHA_BASE, data: { ...good, type: "other" } }, AHA_BASE), null);
  assert.equal(acceptMessage({ origin: AHA_BASE, data: { ...good, token: "short" } }, AHA_BASE), null);
  assert.equal(acceptMessage({ origin: AHA_BASE, data: { ...good, token: "has space in it 123456789" } }, AHA_BASE), null);
  assert.equal(acceptMessage({ origin: AHA_BASE, data: "text" }, AHA_BASE), null);
  // an avatar that is not https is dropped
  assert.equal(acceptMessage({ origin: AHA_BASE, data: { ...good, user: { name: "M", avatar: "javascript:1" } } }, AHA_BASE)?.user.avatar, undefined);
});

test("the session is saved, loaded and cleared; a bad or missing store is no session", () => {
  const st = memory();
  assert.equal(loadSession(st), null);
  saveSession(st, { token: TOKEN, user: { name: "Mina" } });
  assert.equal(st.data.get(TOKEN_KEY), TOKEN);
  assert.deepEqual(loadSession(st), { token: TOKEN, user: { name: "Mina", avatar: undefined } });
  st.data.set(USER_KEY, "{not json");
  assert.equal(loadSession(st), null);
  clearSession(st);
  assert.equal(st.data.size, 0);
  assert.equal(loadSession(null), null);
  const throwing: StorageLike = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
  assert.equal(loadSession(throwing), null);
  assert.doesNotThrow(() => saveSession(throwing, { token: TOKEN, user: { name: "M" } }));
});

test("the popup opens on Aha with only the site's origin in the link, never a token", () => {
  const url = connectUrl(AHA_BASE, "https://s1lin.tokensbeat.com");
  assert.equal(url, "https://aha.tokensbeat.com/#/social-connect?origin=https%3A%2F%2Fs1lin.tokensbeat.com");
  assert.ok(!url.includes("token="));
});

test("connect resolves on Aha's message, ignores others, and fails if the popup is blocked or closed", async () => {
  let send: (ev: { origin: string; data: unknown }) => void = () => {};
  const popup = { closed: false };
  const p = connect({ base: AHA_BASE, siteOrigin: "https://s1lin.tokensbeat.com", open: () => popup, listen: (fn) => { send = fn; return () => {}; }, pollEvery: 5 });
  send({ origin: "https://evil.example", data: { type: "tokensbeat-social", token: TOKEN, user: { name: "x" } } });
  send({ origin: AHA_BASE, data: { type: "tokensbeat-social", token: TOKEN, user: { name: "Mina" } } });
  assert.equal((await p).user.name, "Mina");

  await assert.rejects(connect({ base: AHA_BASE, siteOrigin: "x", open: () => null, listen: () => () => {} }), (e: SocialError) => e.kind === "refused" && e.message === "popup blocked");
  const closing = { closed: false };
  const q = connect({ base: AHA_BASE, siteOrigin: "x", open: () => closing, listen: () => () => {}, pollEvery: 5 });
  closing.closed = true;
  await assert.rejects(q, (e: SocialError) => e.kind === "refused" && e.message === "popup closed");
  await assert.rejects(connect({ base: AHA_BASE, siteOrigin: "x", open: () => ({ closed: false }), listen: () => () => {}, timeout: 10, pollEvery: 1000 }), (e: SocialError) => e.kind === "network");
});

test("responses map to the kind of error the page explains", () => {
  assert.equal(mapError(401, {}).kind, "auth");
  assert.equal(mapError(403, {}).kind, "refused");
  assert.equal(mapError(429, {}).kind, "rate");
  assert.equal(mapError(400, { reason: "too long" }).reason, "too long");
  assert.equal(mapError(422, null).kind, "invalid");
  assert.equal(mapError(500, {}).kind, "server");
  assert.equal(mapError(503, "text").kind, "server");
});

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("calls send the bearer token only in a header, no cookies, and a 401 drops the session", async () => {
  const st = memory();
  saveSession(st, { token: TOKEN, user: { name: "Mina" } });
  const seen: { url: string; init: RequestInit }[] = [];
  let status = 200;
  const api = createSocial({ base: "https://a.test", storage: st, fetch: (async (url: string, init: RequestInit) => { seen.push({ url, init }); return reply(status, { id: "n1", status: "approved" }); }) as unknown as typeof fetch });
  const v = await api.comment("site:s1lin:life", "hello", "c1");
  assert.equal(v.status, "approved");
  const [call] = seen;
  assert.equal(call.url, "https://a.test/api/social/comments");
  assert.equal((call.init.headers as Record<string, string>).Authorization, `Bearer ${TOKEN}`);
  assert.equal(call.init.credentials, "omit");
  assert.ok(!call.url.includes(TOKEN));
  assert.deepEqual(JSON.parse(call.init.body as string), { target: "site:s1lin:life", body: "hello", parentId: "c1" });
  status = 401;
  await assert.rejects(api.like(true, { target: "post:1" }), (e: SocialError) => e.kind === "auth");
  assert.equal(st.data.size, 0);
  // signed out: a write fails before any request is made
  const before = seen.length;
  await assert.rejects(api.repost(true, "post:1"), (e: SocialError) => e.kind === "auth");
  assert.equal(seen.length, before);
});

test("a thread is read for anyone, and its odd parts are cleaned", async () => {
  const api = createSocial({
    base: "https://a.test",
    storage: null,
    fetch: (async () => reply(200, { counts: { likes: 2, reposts: "x", comments: 1 }, comments: [{ id: "a", body: "<b>hi</b>", author: { name: "M", avatar: "http://insecure/a.png" }, at: "2026-10-30T00:00:00Z", likes: 3, replies: [{ id: "b", body: "yes", author: {}, at: "", likes: 0 }, { nope: 1 }] }, { nope: 1 }], next: null })) as unknown as typeof fetch,
  });
  const t = await api.thread("site:s1lin:life");
  assert.equal(t.counts.reposts, 0);
  assert.equal(t.comments.length, 1);
  assert.equal(t.comments[0].body, "<b>hi</b>");
  assert.equal(t.comments[0].author.avatar, undefined);
  assert.equal(t.comments[0].replies?.length, 1);
  assert.equal(t.comments[0].replies?.[0].author.name, "TokensBeat");
});

test("a network failure is its own kind", async () => {
  const api = createSocial({ base: "https://a.test", storage: null, fetch: (async () => { throw new TypeError("fail"); }) as unknown as typeof fetch });
  await assert.rejects(api.thread("x"), (e: SocialError) => e.kind === "network");
});

test("gallery shapes that do not fit the contract are dropped", async () => {
  const good = { id: "s1", title: "t", note: "n", w: 2, h: 1, cells: ["01"], author: { name: "M" }, likes: 1, reposts: 0, at: "" };
  const api = createSocial({ base: "https://a.test", storage: null, fetch: (async () => reply(200, { shapes: [good, { ...good, id: "bad1", cells: ["0x"] }, { ...good, id: "bad2", w: 65, cells: ["0".repeat(65)] }, { ...good, id: "bad3", h: 2 }] })) as unknown as typeof fetch });
  assert.deepEqual((await api.shapes()).shapes.map((s) => s.id), ["s1"]);
});

test("a shape is cropped to its box; empty and over-64 boards are refused", () => {
  const g = { w: 10, h: 10, cells: new Uint8Array(100) };
  assert.deepEqual(cropShape(g), { ok: false, why: "empty" });
  g.cells[2 * 10 + 3] = 1;
  g.cells[3 * 10 + 5] = 1;
  const r = cropShape(g);
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.shape, { w: 3, h: 2, cells: ["100", "001"] });
  const big = { w: 100, h: 100, cells: new Uint8Array(10000) };
  big.cells[0] = 1;
  big.cells[70 * 100 + 70] = 1;
  const b = cropShape(big);
  assert.ok(!b.ok && b.why === "big");
});

test("a shape is centred on a board and refused if it does not fit", () => {
  const out = centre({ w: 2, h: 1, cells: ["11"] }, 6, 5);
  assert.ok(out);
  assert.equal(out![2 * 6 + 2], 1);
  assert.equal(out![2 * 6 + 3], 1);
  assert.equal(out!.reduce((a, b) => a + b, 0), 2);
  assert.equal(centre({ w: 9, h: 1, cells: ["1".repeat(9)] }, 6, 5), null);
});

import { REVISE_PREFS_KEY, loadRevisePrefs, pickModel, saveRevisePrefs, type ModelCatalog } from "../src/lib/social/client.ts";

const signedIn = () => {
  const st = memory();
  saveSession(st, { token: TOKEN, user: { name: "Mina" } });
  return st;
};

test("revise: the models are read with the bearer in a header only, and odd entries are dropped", async () => {
  const seen: { url: string; init: RequestInit }[] = [];
  const api = createSocial({
    base: "https://a.test",
    storage: signedIn(),
    fetch: (async (url: string, init: RequestInit) => {
      seen.push({ url, init });
      return reply(200, { keys: [{ id: 3, name: "Default", models: ["qwen3.8", "bad model!", 5] }, { id: "x", name: "Empty", models: [] }, { nope: 1 }, { id: 7, models: ["gpt-6-astra"] }], defaultKeyId: 3, defaultModel: "qwen3.8" });
    }) as unknown as typeof fetch,
  });
  const cat = await api.models();
  assert.equal(seen[0].url, "https://a.test/api/social/models");
  assert.equal(seen[0].init.method, "GET");
  assert.equal((seen[0].init.headers as Record<string, string>).Authorization, `Bearer ${TOKEN}`);
  assert.equal(seen[0].init.credentials, "omit");
  assert.ok(!seen[0].url.includes(TOKEN));
  assert.deepEqual(cat, { keys: [{ id: 3, name: "Default", models: ["qwen3.8"] }, { id: 7, name: "Key 7", models: ["gpt-6-astra"] }], defaultKeyId: 3, defaultModel: "qwen3.8" });
});

test("revise: the draft goes as JSON with the chosen key, model and tone, and the answer comes back as text", async () => {
  const seen: { url: string; init: RequestInit }[] = [];
  const api = createSocial({
    base: "https://a.test",
    storage: signedIn(),
    fetch: (async (url: string, init: RequestInit) => {
      seen.push({ url, init });
      return reply(200, { text: "  A kinder draft.  ", model: "qwen3.8", keyId: 3 });
    }) as unknown as typeof fetch,
  });
  const r = await api.revise({ text: "a draft", keyId: 3, model: "qwen3.8", tone: "friendlier" });
  assert.deepEqual(r, { text: "A kinder draft.", model: "qwen3.8", keyId: 3 });
  assert.equal(seen[0].url, "https://a.test/api/social/revise");
  assert.equal(seen[0].init.method, "POST");
  assert.equal((seen[0].init.headers as Record<string, string>).Authorization, `Bearer ${TOKEN}`);
  assert.equal(seen[0].init.credentials, "omit");
  assert.deepEqual(JSON.parse(seen[0].init.body as string), { text: "a draft", keyId: 3, model: "qwen3.8", tone: "friendlier" });
});

test("revise: signed out fails before any request; an empty or missing answer is a server error; a long one is cut", async () => {
  let calls = 0;
  const out = (body: unknown) => createSocial({ base: "https://a.test", storage: signedIn(), fetch: (async () => { calls++; return reply(200, body); }) as unknown as typeof fetch });
  const anon = createSocial({ base: "https://a.test", storage: null, fetch: (async () => { calls++; return reply(200, {}); }) as unknown as typeof fetch });
  await assert.rejects(anon.revise({ text: "x" }), (e: SocialError) => e.kind === "auth");
  await assert.rejects(anon.models(), (e: SocialError) => e.kind === "auth");
  assert.equal(calls, 0);
  await assert.rejects(out({ text: "   " }).revise({ text: "x" }), (e: SocialError) => e.kind === "server");
  await assert.rejects(out({}).revise({ text: "x" }), (e: SocialError) => e.kind === "server");
  assert.equal((await out({ text: "y".repeat(3000), model: "m" }).revise({ text: "x" })).text.length, 2000);
});

test("revise: failures map to what the reader is told: 401 signs out, 429 rate, 402/403 plan with the server's words, 502 server", async () => {
  const st = signedIn();
  let status = 200;
  let body: unknown = {};
  const api = createSocial({ base: "https://a.test", storage: st, fetch: (async () => reply(status, body)) as unknown as typeof fetch });
  status = 429;
  await assert.rejects(api.revise({ text: "x" }), (e: SocialError) => e.kind === "rate");
  status = 402;
  body = { error: { message: "qwen3.8 is not on this key's plan" } };
  await assert.rejects(api.revise({ text: "x" }), (e: SocialError) => e.kind === "invalid" && e.reason === "qwen3.8 is not on this key's plan");
  status = 403;
  body = { message: "balance too low" };
  await assert.rejects(api.models(), (e: SocialError) => e.kind === "refused" && e.reason === "balance too low");
  status = 502;
  body = { error: { message: "model failed" } };
  await assert.rejects(api.revise({ text: "x" }), (e: SocialError) => e.kind === "server" && e.status === 502);
  assert.equal(loadSession(st)?.token, TOKEN);
  status = 401;
  await assert.rejects(api.revise({ text: "x" }), (e: SocialError) => e.kind === "auth");
  assert.equal(st.data.size, 0);
  assert.equal(mapError(400, { error: { message: "nested" } }).reason, "nested");
});

test("revise: the last choice is kept, a bad one is ignored, and the start falls back to the default, then the first model", () => {
  const st = memory();
  assert.deepEqual(loadRevisePrefs(st), {});
  saveRevisePrefs(st, { keyId: 7, model: "gpt-6-astra", tone: "shorter" });
  assert.ok(st.data.has(REVISE_PREFS_KEY));
  assert.deepEqual(loadRevisePrefs(st), { keyId: 7, model: "gpt-6-astra", tone: "shorter" });
  st.data.set(REVISE_PREFS_KEY, JSON.stringify({ keyId: {}, model: 5, tone: "rude" }));
  assert.deepEqual(loadRevisePrefs(st), { keyId: undefined, model: undefined, tone: undefined });
  st.data.set(REVISE_PREFS_KEY, "{not json");
  assert.deepEqual(loadRevisePrefs(st), {});
  assert.deepEqual(loadRevisePrefs(null), {});
  const throwing: StorageLike = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => {} };
  assert.deepEqual(loadRevisePrefs(throwing), {});
  assert.doesNotThrow(() => saveRevisePrefs(throwing, {}));

  const cat: ModelCatalog = { keys: [{ id: 3, name: "A", models: ["qwen3.8", "claude-sonnet-5-5"] }, { id: 7, name: "B", models: ["gpt-6-astra"] }], defaultKeyId: 3, defaultModel: "qwen3.8" };
  assert.deepEqual(pickModel(cat, { keyId: 7, model: "gpt-6-astra" }), { keyId: 7, model: "gpt-6-astra" });
  assert.deepEqual(pickModel(cat, { keyId: 7, model: "gone" }), { keyId: 3, model: "qwen3.8" });
  assert.deepEqual(pickModel({ ...cat, defaultKeyId: undefined }, {}), { keyId: 3, model: "qwen3.8" });
  assert.deepEqual(pickModel({ keys: [{ id: 9, name: "C", models: ["m"] }] }, {}), { keyId: 9, model: "m" });
  assert.equal(pickModel({ keys: [] }, {}), null);
});
