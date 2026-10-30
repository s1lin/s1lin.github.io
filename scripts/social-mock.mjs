// A stand-in for the Aha Social API (agent-ui/SOCIAL.md), for developing and testing the page without Aha.
//   node scripts/social-mock.mjs [port]      then open the site on localhost with ?social=http://127.0.0.1:<port>
// Keywords in a comment steer the verdict: "spam" is rejected, "review" waits, "limit" is rate-limited.
import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 8799);
const now = Date.now();
const iso = (ago) => new Date(now - ago * 60_000).toISOString();
const comments = [
  { id: "c1", author: { name: "Mina" }, body: "The blinker puzzle took me three tries.\nThen the glider one made sense at once.", at: iso(90), likes: 4, replies: [{ id: "c1a", author: { name: "s1lin" }, body: "That is the right order to meet them in.", at: iso(30), likes: 1 }] },
  { id: "c2", author: { name: "陈一" }, body: "R-五联块真的会跑一千多代,我数过。", at: iso(600), likes: 2 },
  { id: "c3", author: { name: "Kenji" }, body: "<b>not html</b> & <script>alert(1)</script> stay text", at: iso(1500), likes: 0 },
];
const shapes = [
  { id: "s1", title: "Tiny walker", note: "A glider with a block in its way: see who wins.", w: 5, h: 5, cells: ["01000", "00100", "11100", "00000", "00011"], author: { name: "Mina" }, likes: 3, reposts: 1, at: iso(300) },
  { id: "s2", title: "Pulse", note: "Three in a row, forever.", w: 3, h: 1, cells: ["111"], author: { name: "Kenji" }, likes: 1, reposts: 0, at: iso(900) },
  { id: "s3", title: "R", note: "The R-pentomino, five cells and a thousand generations.", w: 3, h: 3, cells: ["011", "110", "010"], author: { name: "陈一" }, likes: 7, reposts: 2, at: iso(2000) },
];
let posted = 0;

const json = (res, code, body, origin) => {
  res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": origin ?? "*", "access-control-allow-headers": "authorization,content-type", "access-control-allow-methods": "GET,POST,DELETE,OPTIONS", vary: "origin" });
  res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  const origin = req.headers.origin;
  if (req.method === "OPTIONS") return json(res, 204, {}, origin);
  let body = {};
  if (req.method !== "GET") {
    let raw = "";
    for await (const c of req) raw += c;
    try { body = JSON.parse(raw || "{}"); } catch { /* an empty body */ }
  }
  const authed = /^Bearer \S{16,}$/.test(req.headers.authorization ?? "");
  if (u.pathname === "/api/public/social/config") return json(res, 200, { signInUrl: "https://tokensbeat.com/?aff=EL8RSC36GVWT", connectUrl: "http://127.0.0.1/#/social-connect", origins: [] }, origin);
  if (u.pathname === "/api/public/social/thread") return json(res, 200, { counts: { likes: 12, reposts: 3, comments: comments.length }, comments, me: authed ? { liked: false, reposted: true, likedComments: ["c2"] } : undefined, next: null }, origin);
  if (u.pathname === "/api/public/social/shapes") return json(res, 200, { shapes, next: null }, origin);
  if (u.pathname.startsWith("/api/social/")) {
    if (!authed) return json(res, 401, { error: "sign in" }, origin);
    if (u.pathname === "/api/social/comments" || u.pathname === "/api/social/shapes") {
      const t = `${body.body ?? ""} ${body.note ?? ""} ${body.title ?? ""}`.toLowerCase();
      if (t.includes("limit") || ++posted > 40) return json(res, 429, { error: "rate" }, origin);
      if (t.includes("spam")) return json(res, 200, { id: "x", status: "rejected", reason: "it reads as an advert" }, origin);
      if (t.includes("review")) return json(res, 200, { id: "p1", status: "pending" }, origin);
      return json(res, 200, { id: `n${posted}`, status: "approved" }, origin);
    }
    return json(res, 200, { ok: true }, origin);
  }
  json(res, 404, { error: "no such route" }, origin);
}).listen(port, "127.0.0.1", () => console.log(`social mock on http://127.0.0.1:${port}`));
