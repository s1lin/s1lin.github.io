import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { promisify } from "node:util";
import { DIRECTIVES, inlineScripts, policy, withCsp } from "../scripts/csp.mjs";

/*
 * The Content-Security-Policy of the built pages (scripts/csp.mjs, written by scripts/prerender.mjs). The policy: scripts
 * only from the site, Cloudflare's beacon and the page's own hashed inline scripts; no plugins; no <base>. Then every
 * built page in a real browser: it carries the policy before any script, the browser reports no violation (a blocked
 * inline or module script is one), and the page is drawn. The browser half needs
 * dist/ from `npm run build` (CI runs this file again after the build) and Chrome: it is skipped without either.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>t</title>
<script>
  try { document.documentElement.dataset.theme = "dark"; } catch (_) {}
</script>
<script type="application/ld+json">{"@type":"Person"}</script>
</head>
<body><div id="root"></div><script type="module" src="/assets/main.js"></script></body>
</html>`;

test("the policy: the page's inline scripts by hash, scripts from the site and the beacon only, no plugins, no <base>", () => {
  const html = withCsp(PAGE);
  const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  assert.ok(meta, "a policy meta");
  // first after <meta charset>, so it governs every script after it
  assert.ok(html.indexOf(meta[0]) < html.indexOf("<script"), "before the first script");
  assert.equal(html.indexOf(meta[0]), html.indexOf('<meta charset="utf-8">') + '<meta charset="utf-8">\n'.length);
  const directives = Object.fromEntries(meta[1].split("; ").map((d) => [d.split(" ")[0], d.split(" ").slice(1)]));
  const hash = (s: string) => `'sha256-${createHash("sha256").update(s).digest("base64")}'`;
  assert.deepEqual(inlineScripts(PAGE).length, 2);
  assert.deepEqual(directives["script-src"], ["'self'", "https://static.cloudflareinsights.com", ...inlineScripts(PAGE).map(hash)]);
  assert.ok(!meta[1].includes("unsafe-inline") && !meta[1].includes("unsafe-eval"), "no unsafe-inline or unsafe-eval");
  assert.deepEqual(directives["object-src"], ["'none'"]);
  assert.deepEqual(directives["base-uri"], ["'none'"]);
  assert.ok(directives["connect-src"].includes("https://aha.tokensbeat.com"), "Aha's social API");
  assert.ok(!directives["connect-src"].includes("https:") && !directives["connect-src"].includes("*"), "data goes to named hosts only");
  assert.equal(policy(PAGE), meta[1]);
  assert.deepEqual(Object.keys(DIRECTIVES), ["script-src", "connect-src", "img-src", "object-src", "base-uri"]);
  // once only, and only where a charset says where the head starts
  assert.throws(() => withCsp(html), /has a policy already/);
  assert.throws(() => withCsp("<html><head></head></html>"), /no <meta charset/);
});

function chrome(): string | undefined {
  const named = process.env.CHROME ?? process.env.CHROME_BIN;
  if (named) return named;
  const cache = path.join(process.env.HOME ?? "/root", ".cache/ms-playwright");
  const cached = existsSync(cache)
    ? readdirSync(cache)
        .filter((d) => d.startsWith("chromium-"))
        .map((d) => path.join(cache, d, "chrome-linux64/chrome"))
        .filter(existsSync)
    : [];
  const system = ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(existsSync);
  return [...cached, ...system][0];
}

/** The built pages: the issue, the blog and its posts, Life and the UI docs. */
function builtPages(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) {
        if (!["assets", "data", "r", "brick-locator"].includes(name)) walk(full);
      } else if (name === "index.html") found.push(path.relative(DIST, full));
    }
  };
  walk(DIST);
  return found.sort();
}

const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".txt": "text/plain" };
const server = createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
  let file = path.join(DIST, url);
  if (!file.startsWith(DIST)) return void res.writeHead(403).end();
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!existsSync(file)) return void res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
});
after(() => server.close());

// The beacon's hosts fail at once instead of waiting on the network (a policy is checked before any request, so a
// violation is still reported), and Aha's too: the pages only read it after a sign-in.
const HERMETIC = "--host-resolver-rules=MAP static.cloudflareinsights.com ~NOTFOUND, MAP cloudflareinsights.com ~NOTFOUND, MAP aha.tokensbeat.com ~NOTFOUND";

test("every built page carries the policy, the browser reports no violation, and the page's own scripts run", async (t) => {
  const bin = chrome();
  if (!bin) return t.skip("no Chrome here: set CHROME to run it");
  if (!existsSync(path.join(DIST, "index.html")) || !readFileSync(path.join(DIST, "index.html"), "utf8").includes('http-equiv="Content-Security-Policy"'))
    return t.skip("no built pages with the policy: run `npm run build` first");
  const pages = builtPages();
  assert.ok(pages.length >= 9, `the issue, the blog, its posts, Life and the docs: ${pages.join(", ")}`);
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const port = (server.address() as { port: number }).port;
  for (const page of pages) {
    const html = readFileSync(path.join(DIST, page), "utf8");
    assert.ok(html.indexOf('http-equiv="Content-Security-Policy"') < html.indexOf("<script"), `${page}: the policy before any script`);
    const url = `http://127.0.0.1:${port}/${page.replace(/index\.html$/, "")}`;
    let out: { stdout: string; stderr: string };
    try {
      out = await promisify(execFile)(bin, ["--headless=new", "--no-sandbox", "--disable-gpu", "--enable-logging=stderr", "--v=0", "--window-size=1280,900", HERMETIC, "--timeout=8000", "--dump-dom", url], { encoding: "utf8", timeout: 90_000, maxBuffer: 256 * 1024 * 1024 });
    } catch (e) {
      return t.skip(`Chrome would not run (${bin}): ${String(e).slice(0, 200)}`);
    }
    const violations = out.stderr.split("\n").filter((l) => /Content Security Policy|Refused to (execute|load|connect|evaluate|create)/i.test(l));
    assert.deepEqual(violations, [], `${page}: no violation`);
    // the page is drawn (Life, which is not prerendered, only by its module, so the module ran there)
    assert.match(out.stdout, /<div id="root"[^>]*>\s*<[a-z]/, `${page}: the page drawn`);
  }
});
