import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { build } from "vite";

/*
 * Split on a server: a named group; each pane a named region with its side and, on the active one, its mark; the frame
 * marked as split only when two are shown. Its stylesheet draws two equal columns only while split, sets the end pane off
 * by a hairline and the active one by a rule (no border round a pane), and uses tokens only. Activation on a press or the
 * focus (the capture phase, before the press acts inside the pane) is tested where the part is used, with React running
 * (Aha: ui/s1/kit-split.test.tsx).
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const out = mkdtempSync(path.join(tmpdir(), "s1lin-split-"));
after(() => rmSync(out, { recursive: true, force: true }));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");

async function serverParts() {
  writeFileSync(path.join(out, "server.ts"), `export * from ${JSON.stringify(path.join(ROOT, "src/ui/split.tsx"))};`);
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

test("Split on a server: a named group, split only with two panes; each pane a named region with its side, the active one marked", async () => {
  const { Split, SplitPane, h, renderToString } = await serverParts();
  const two = renderToString(
    h(Split, { label: "Split view", split: true }, h(SplitPane, { label: "Trip plan", side: "start", onActivate() {} }, h("p", null, "a")), h(SplitPane, { label: "Files", side: "end", active: true, onActivate() {} }, h("p", null, "b"))),
  );
  assert.match(two, /^<div role="group" aria-label="Split view" class="s1-split" data-split="true">/);
  const panes = [...two.matchAll(/<section aria-label="([^"]+)" class="s1-split__pane" data-side="(start|end)"( data-active="true")?>/g)].map((m) => [m[1], m[2], !!m[3]]);
  assert.deepEqual(panes, [["Trip plan", "start", false], ["Files", "end", true]]);
  const one = renderToString(h(Split, { label: "Split view", split: false, className: "app" }, h(SplitPane, { label: "Trip plan", active: true }, "a")));
  assert.match(one, /^<div role="group" aria-label="Split view" class="s1-split app">/, "one pane: not marked split");
  assert.match(one, /<section aria-label="Trip plan" class="s1-split__pane" data-side="start" data-active="true">a<\/section>/);
});

test("Split's stylesheet: two equal columns only while split, the end pane set off by a hairline, the active one by a rule, no border round a pane, tokens only", () => {
  const css = readFileSync(path.join(ROOT, "src/ui/split.css"), "utf8");
  assert.match(css, /\.s1-split\[data-split\] \{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\);/);
  assert.match(css, /\[data-side="end"\] \{\s*order: 2;\s*box-shadow: inset 1px 0 0 var\(--s1-rule-strong\);/);
  assert.match(css, /\[data-active\]::after \{[^}]*height: 2px;[^}]*background: var\(--s1-split-mark, var\(--s1-accent\)\);/);
  const outside = css.replace(/@media \(forced-colors: active\) \{[\s\S]*?\n {2}\}\n/, "");
  assert.doesNotMatch(outside, /\bborder(-[a-z-]+)?\s*:/, "no border round a pane (forced colours draw one)");
  assert.doesNotMatch(outside, /#[0-9a-f]{3,8}\b|rgba?\(/i, "colours are tokens");
});
