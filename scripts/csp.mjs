// The Content-Security-Policy every built page carries, as a <meta> (GitHub Pages sends no headers). The prerender
// step (scripts/prerender.mjs) writes it into each page with the hashes of that page's own inline scripts, so an edit
// to the theme script before the first paint is allowed without anyone copying a hash by hand.
//
// Why: after "Sign in with TokensBeat" the reader's bearer token sits in localStorage, and it can spend the reader's own
// credit (/api/social/revise). With no policy any script on the page could read it: Cloudflare's unversioned beacon
// (no SRI possible) or a bad release of a bundled package (frontend scan 2026-11-07, P1). Scripts now run only from
// this site, Cloudflare's beacon and the hashed inline ones, and everything the page loads or sends goes only to named
// hosts (default-src 'self' for every kind not named), so a script cannot post the token or load it as the address of
// an image, a stylesheet, a font or a frame elsewhere (Codex rounds 1 and 2: `img-src https:`, then no default-src).
// A policy cannot stop a script that runs from navigating the page away with the token: the token's own limits (short
// lived, scoped, a fresh confirmation before a paid call) are Aha's part, recorded as social-token-short-lived.
// Its check: test/csp.test.ts (the policy, and every built page in a browser with no violation).
import { createHash } from "node:crypto";

export const DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "https://static.cloudflareinsights.com"],
  // The parts' and the prerendered pages' style attributes; stylesheets from the site only.
  "style-src": ["'self'", "'unsafe-inline'"],
  // KaTeX's and the site's faces; the build inlines the smallest as data: URLs.
  "font-src": ["'self'", "data:"],
  // Aha's social API; the beacon's reports; this machine for ?social= while developing (src/lib/social/client.ts).
  "connect-src": ["'self'", "https://aha.tokensbeat.com", "https://cloudflareinsights.com", "https://static.cloudflareinsights.com", "http://localhost:*", "http://127.0.0.1:*"],
  // Commenters' avatars, from the hosts Aha accepts for them (backend/aha/bff/src/social/service.ts AVATAR); the favicon
  // and the parts' marks are data: URLs.
  "img-src": ["'self'", "data:", "blob:", "https://img.clerk.com", "https://images.clerk.dev", "https://avatars.githubusercontent.com", "https://lh3.googleusercontent.com", "https://www.gravatar.com"],
  "object-src": ["'none'"],
  "base-uri": ["'none'"],
  "form-action": ["'self'"],
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
