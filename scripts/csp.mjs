// The Content-Security-Policy every built page carries, as a <meta> (GitHub Pages sends no headers). The prerender
// step (scripts/prerender.mjs) writes it into each page with the hashes of that page's own inline scripts, so an edit
// to the theme script before the first paint is allowed without anyone copying a hash by hand.
//
// Why: after "Sign in with TokensBeat" the reader's bearer token sits in localStorage, and it can spend the reader's own
// credit (/api/social/revise). With no policy any script on the page could read it: Cloudflare's unversioned beacon
// (no SRI possible) or a bad release of a bundled package (frontend scan 2026-11-07, P1). Scripts now run only from
// this site, Cloudflare's beacon and the hashed inline ones, and data goes only to this site, Aha and the beacon.
// Its check: test/csp.test.ts (the policy, and every built page in a browser with no violation).
import { createHash } from "node:crypto";

export const DIRECTIVES = {
  "script-src": ["'self'", "https://static.cloudflareinsights.com"],
  // Aha's social API; the beacon's reports; this machine for ?social= while developing (src/lib/social/client.ts).
  "connect-src": ["'self'", "https://aha.tokensbeat.com", "https://cloudflareinsights.com", "https://static.cloudflareinsights.com", "http://localhost:*", "http://127.0.0.1:*"],
  // Commenters' avatars come from any https host; the favicon and the parts' marks are data: URLs.
  "img-src": ["'self'", "https:", "data:", "blob:"],
  "object-src": ["'none'"],
  "base-uri": ["'none'"],
};

/** The text of each inline <script> (no src), as the browser hashes it. */
export function inlineScripts(html) {
  return [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
}

/** The policy for this page: its inline scripts allowed by their hashes. */
export function policy(html) {
  const hashes = inlineScripts(html).map((s) => `'sha256-${createHash("sha256").update(s, "utf8").digest("base64")}'`);
  return Object.entries(DIRECTIVES)
    .map(([name, sources]) => [name, ...sources, ...(name === "script-src" ? hashes : [])].join(" "))
    .join("; ");
}

/** The page with its policy as the first thing after <meta charset>, before any script it governs. */
export function withCsp(html, path = "page") {
  if (/http-equiv="Content-Security-Policy"/i.test(html)) throw new Error(`csp: ${path} has a policy already`);
  const charset = html.match(/<meta charset="utf-8">\n?/i);
  if (!charset) throw new Error(`csp: ${path} has no <meta charset="utf-8">`);
  const at = charset.index + charset[0].length;
  return `${html.slice(0, at)}<meta http-equiv="Content-Security-Policy" content="${policy(html)}">\n${html.slice(at)}`;
}
