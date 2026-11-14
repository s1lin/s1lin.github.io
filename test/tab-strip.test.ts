import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { build } from "vite";

/*
 * TabStrip on a server: one tablist named by its label; each tab a `tab` with aria-selected on the one in front and the
 * one Tab stop on it (tabindex 0, the others -1); its icon hidden from screen readers, its words, its mark, its close
 * button named by closeLabel and out of the Tab order; a pair drawn as one joined group in place; keep and faded as
 * marks for the styles; the end slot after the list. Its stylesheet draws no border round a tab (switchers are
 * borderless) and uses tokens only. The keys (arrows, Home, End, Enter, Space, Delete, a middle click) are tested where
 * the part is used, with React running (Aha: ui/s1/kit-tab-strip.test.tsx).
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const out = mkdtempSync(path.join(tmpdir(), "s1lin-tab-strip-"));
after(() => rmSync(out, { recursive: true, force: true }));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");

async function serverParts() {
  writeFileSync(path.join(out, "server.ts"), `export * from ${JSON.stringify(path.join(ROOT, "src/ui/tab-strip.tsx"))};`);
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

test("TabStrip on a server: a named tablist, the tab in front selected and the one Tab stop, close buttons named and out of the Tab order, a pair joined in place, the end slot", async () => {
  const { TabStrip, h, renderToString } = await serverParts();
  const html = renderToString(
    h(TabStrip, {
      label: "Open tabs",
      closeLabel: "Close tab",
      selected: "b",
      tabs: [
        { key: "a", label: "Access keys", icon: h("svg", { id: "ico-a" }), title: "Access keys" },
        { key: "b", label: "My orders", mark: h("i", { className: "dot" }) },
        { key: "c", label: "Service Plaza", keep: true, mark: h("span", null, "Needs you") },
        { key: "d", label: "Profile", faded: true },
      ],
      pair: ["b", "c"],
      onSelect() {},
      onClose() {},
      end: h("button", { type: "button", id: "new" }, "+"),
    }),
  );
  assert.match(html, /<div role="tablist" aria-label="Open tabs" aria-orientation="horizontal" class="s1-tabstrip__list">/);
  const tabs = [...html.matchAll(/<div role="tab" id="s1-tab-([a-d])" aria-selected="(true|false)" tabindex="(0|-1)"([^>]*)>/g)].map((m) => ({ key: m[1], selected: m[2], tabindex: m[3], rest: m[4] }));
  assert.deepEqual(tabs.map((t) => [t.key, t.selected, t.tabindex]), [["a", "false", "-1"], ["b", "true", "0"], ["c", "false", "-1"], ["d", "false", "-1"]]);
  assert.match(tabs[0]!.rest, /title="Access keys"/);
  assert.match(tabs[1]!.rest, /data-on="true"/);
  assert.match(tabs[2]!.rest, /data-on="true"/, "the pair is in front together");
  assert.match(tabs[2]!.rest, /data-keep="true"/);
  assert.match(tabs[3]!.rest, /data-faded="true"/);
  assert.match(html, /<div class="s1-tabstrip__pair" role="presentation"><div role="tab" id="s1-tab-b"[^>]*data-joined="first"/);
  assert.match(html, /<span class="s1-tabstrip__icon" aria-hidden="true"><svg id="ico-a"><\/svg><\/span><span class="s1-tabstrip__label">Access keys<\/span>/);
  assert.match(html, /<span class="s1-tabstrip__mark"><span>Needs you<\/span><\/span>/);
  const closes = [...html.matchAll(/<button type="button" tabindex="-1" class="s1-tabstrip__close" aria-label="Close tab" title="Close tab">/g)];
  assert.equal(closes.length, 4, "every tab has its close button, named, out of the Tab order");
  assert.match(html, /<div class="s1-tabstrip__end"><button type="button" id="new">\+<\/button><\/div><\/div>$/);
});

test("TabStrip's stylesheet: no border round a tab, tokens for every colour", () => {
  const css = readFileSync(path.join(ROOT, "src/ui/tab-strip.css"), "utf8");
  assert.doesNotMatch(css, /\bborder\s*:(?!\s*0)/, "a switcher has no border");
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "no colour but a token");
  assert.match(css, /\.s1-tabstrip__tab\[data-on\]\s*\{[^}]*background:\s*var\(--s1-paper\)/, "the tab in front is raised onto the paper");
});
