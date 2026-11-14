import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { build } from "vite";

/*
 * TabBar on a server: a nav landmark named by its label, a list of tabs; each its picture (hidden from screen readers)
 * over its word, a link where it has a page (its title the word) and a button where it has none; the tab you are on
 * says so (aria-current), a count on the picture's corner with what it counts for screen readers (none for 0), a dot
 * with what it means. Its stylesheet draws no border round a tab (switchers are borderless), uses tokens only and pads
 * the bar by the safe area's insets. The keys (←, →, Home, End) and a plain click that goes to the app's step are tested
 * where the part is used, with React running (Aha: ui/s1/kit-tab-bar.test.tsx).
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const out = mkdtempSync(path.join(tmpdir(), "s1lin-tab-bar-"));
after(() => rmSync(out, { recursive: true, force: true }));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");

async function serverParts() {
  writeFileSync(path.join(out, "server.ts"), `export * from ${JSON.stringify(path.join(ROOT, "src/ui/tab-bar.tsx"))};`);
  await build({
    configFile: false,
    root: out,
    logLevel: "silent",
    plugins: [{ name: "no-css", enforce: "pre", load: (id) => (id.endsWith(".css") ? "" : null) }, react()],
    build: { ssr: path.join(out, "server.ts"), outDir: path.join(out, "ssr"), emptyOutDir: true, rollupOptions: { output: { format: "es", entryFileNames: "parts.mjs" } } },
  });
  const parts = await import(pathToFileURL(path.join(out, "ssr/parts.mjs")).href);
  const { createElement } = await import("react");
  const { renderToString } = await import("react-dom/server");
  return { ...parts, h: createElement, renderToString };
}

test("TabBar on a server: a named nav, tabs as links and a button, the one you are on, a count, a dot", async () => {
  const { TabBar, h, renderToString } = await serverParts();
  const html = renderToString(
    h(TabBar, {
      label: "Tabs",
      current: "tasks",
      items: [
        { id: "home", label: "Home", icon: h("svg", { id: "ico-h" }), href: "#/chat", onSelect() {} },
        { id: "tasks", label: "Tasks", icon: h("svg"), href: "#/tasks", count: 2, countLabel: "Needs you · 2", onSelect() {} },
        { id: "apps", label: "Apps", icon: h("svg"), href: "#/my-apps", count: 0, onSelect() {} },
        { id: "me", label: "Me", icon: h("span", { className: "pic" }, "U"), href: "#/me", dot: true, dotLabel: "Running low" },
        { id: "more", label: h("span", null, "More"), text: "More", icon: h("svg"), onSelect() {} },
      ],
    }),
  );
  assert.match(html, /^<nav aria-label="Tabs" class="s1-tab-bar"><ul class="s1-tab-bar__items">/);
  // a page: a link, its picture hidden from screen readers over its word
  assert.match(html, /<li><a href="#\/chat" class="s1-tab-bar__item" title="Home" data-tab-id="home"><span class="s1-tab-bar__icon" aria-hidden="true"><svg id="ico-h"><\/svg><\/span><span class="s1-tab-bar__word">Home<\/span><\/a><\/li>/);
  // the tab you are on, its count read once after its name, in the words that say what it counts
  assert.match(html, /<a href="#\/tasks" class="s1-tab-bar__item" aria-current="page" title="Tasks" data-tab-id="tasks">/);
  const tasks = html.slice(html.indexOf('data-tab-id="tasks"'), html.indexOf('data-tab-id="apps"'));
  assert.ok(tasks.includes('<span class="s1-tab-bar__count"><span aria-hidden="true">2</span><span class="s1-visually-hidden">, <!-- -->Needs you · 2</span></span></a>'), tasks);
  // no count for 0
  assert.doesNotMatch(html.match(/data-tab-id="apps">.*?<\/a>/)?.[0] ?? "", /s1-tab-bar__count/);
  // a dot says what it means
  assert.match(html, /data-tab-id="me">.*?<span class="s1-tab-bar__dot"><span class="s1-visually-hidden">, <!-- -->Running low<\/span><\/span><\/a>/);
  // no address: a button, its name from `text`
  assert.match(html, /<button type="button" class="s1-tab-bar__item" title="More" data-tab-id="more">/);
  assert.match(html, /<\/ul><\/nav>$/);
});

test("TabBar's stylesheet: no border round a tab, tokens for every colour, the safe area's insets as its padding", () => {
  const css = readFileSync(path.join(ROOT, "src/ui/tab-bar.css"), "utf8");
  const item = css.match(/\n {2}\.s1-tab-bar__item \{[^}]*\}/)?.[0] ?? "";
  assert.match(item, /border:\s*0;/, "a tab has no border");
  // outside forced colours, no rule for a tab draws a line or a ring round it; the keyboard's ring is an outline
  const plain = css.slice(0, css.indexOf("@media (forced-colors"));
  for (const [, selector, body] of plain.matchAll(/([^{}]*\.s1-tab-bar__item[^{}]*)\{([^}]*)\}/g)) {
    assert.doesNotMatch(body, /\bborder(?!-radius)(-[a-z-]+)?\s*:(?!\s*(0|none)\b)/, `${selector.trim()} draws a border`);
    assert.doesNotMatch(body, /box-shadow\s*:[^;]*\binset\b/, `${selector.trim()} draws a ring`);
    if (/outline\s*:(?!\s*(0|none)\b)/.test(body)) assert.match(selector, /:focus-visible/, `${selector.trim()}: an outline only for the keyboard`);
  }
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "no colour but a token");
  assert.match(css, /\.s1-tab-bar\s*\{[^}]*env\(safe-area-inset-bottom/, "the home indicator's inset pads the bar's foot");
  assert.match(css, /\.s1-tab-bar\s*\{[^}]*env\(safe-area-inset-left/, "a phone on its side keeps the tabs clear of the notch");
  assert.match(css, /\.s1-tab-bar__item\[aria-current\]\s*\{[^}]*color:\s*var\(--s1-ink\)/, "the tab you are on is in the ink");
});
