import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { build } from "vite";

/*
 * Rail on a server: a nav landmark named by its label (or a group of switches); its head over the places and its foot
 * after them; each place its picture (hidden from screen readers) over its word, a link where it has a page (its title
 * the word) and a button where it has none; the place you are at says so (aria-current), a switch says whether it is
 * on (aria-pressed); a count on the picture's corner with what it counts for screen readers, none for 0; without words
 * every word stays the place's name. Its stylesheet draws no border round a place (switchers are borderless) and uses
 * tokens only. The keys (↑, ↓, Home, End) and a plain click that goes to the app's step are tested where the part is
 * used, with React running (Aha: ui/s1/kit-rail.test.tsx).
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const out = mkdtempSync(path.join(tmpdir(), "s1lin-rail-"));
after(() => rmSync(out, { recursive: true, force: true }));
symlinkSync(path.join(ROOT, "node_modules"), path.join(out, "node_modules"), "dir");

async function serverParts() {
  writeFileSync(path.join(out, "server.ts"), `export * from ${JSON.stringify(path.join(ROOT, "src/ui/rail.tsx"))};`);
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

test("Rail on a server: a named nav, the head, places as links and buttons, the one you are at, a switch, a count, the foot; without words a group of named switches", async () => {
  const { Rail, h, renderToString } = await serverParts();
  const html = renderToString(
    h(Rail, {
      label: "Places",
      current: "files",
      head: h("a", { href: "/", id: "mark" }, "A"),
      foot: h("button", { type: "button", id: "me" }, "Me"),
      items: [
        { id: "tasks", label: "Tasks", icon: h("svg", { id: "ico-t" }), pressed: true, count: 3, countLabel: "Needs you · 3", onSelect() {} },
        { id: "bots", label: "Bots", icon: h("svg"), pressed: false, count: 0, onSelect() {} },
        { id: "files", label: "Files", icon: h("svg"), href: "#/files", onSelect() {} },
        { id: "code", label: h("span", null, "Code"), text: "Code", icon: h("svg"), href: "#/code", disabled: true },
      ],
    }),
  );
  assert.match(html, /^<nav aria-label="Places" class="s1-rail"><div class="s1-rail__head"><a href="\/" id="mark">A<\/a><\/div><ul class="s1-rail__items">/);
  // a panel place: a button, a switch that is on, its count read after its name with what it counts
  assert.match(html, /<li><button type="button" class="s1-rail__item" aria-pressed="true" title="Tasks" data-rail-id="tasks"><span class="s1-rail__icon" aria-hidden="true"><svg id="ico-t"><\/svg><\/span><span class="s1-rail__word">Tasks<\/span><span class="s1-rail__count">3<span class="s1-visually-hidden">, <!-- -->Needs you · 3<\/span><\/span><\/button><\/li>/);
  // a switch that is off says so; no count for 0
  assert.match(html, /<button type="button" class="s1-rail__item" aria-pressed="false" title="Bots" data-rail-id="bots"><span class="s1-rail__icon" aria-hidden="true"><svg><\/svg><\/span><span class="s1-rail__word">Bots<\/span><\/button>/);
  // a page: a link, the place you are at
  assert.match(html, /<a href="#\/files" class="s1-rail__item" aria-current="page" title="Files" data-rail-id="files">/);
  // disabled: no address, and said so; its name from `text`
  assert.match(html, /<a class="s1-rail__item" aria-disabled="true" title="Code" data-rail-id="code">/);
  assert.match(html, /<\/ul><div class="s1-rail__foot"><button type="button" id="me">Me<\/button><\/div><\/nav>$/);

  const dock = renderToString(
    h(Rail, {
      label: "This chat's panels",
      group: true,
      words: false,
      edge: "end",
      items: [{ id: "files", label: "Files in this chat", icon: h("svg"), pressed: false, onSelect() {} }],
    }),
  );
  assert.match(dock, /^<div role="group" aria-label="This chat&#x27;s panels" class="s1-rail s1-rail--end s1-rail--icons"><ul class="s1-rail__items">/);
  assert.match(dock, /<button type="button" class="s1-rail__item" aria-pressed="false" title="Files in this chat" data-rail-id="files"><span class="s1-rail__icon" aria-hidden="true"><svg><\/svg><\/span><span class="s1-rail__word">Files in this chat<\/span><\/button>/);
});

test("Rail's stylesheet: no border round a place, tokens for every colour, the words hidden but read without words", () => {
  const css = readFileSync(path.join(ROOT, "src/ui/rail.css"), "utf8");
  const item = css.match(/\n {2}\.s1-rail__item \{[^}]*\}/)?.[0] ?? "";
  assert.match(item, /border:\s*0;/, "a place has no border");
  // outside forced colours, no rule for a place draws a line or a ring round it; the keyboard's ring is an outline
  const plain = css.slice(0, css.indexOf("@media (forced-colors"));
  for (const [, selector, body] of plain.matchAll(/([^{}]*\.s1-rail__item[^{}]*)\{([^}]*)\}/g)) {
    assert.doesNotMatch(body, /\bborder(?!-radius)(-[a-z-]+)?\s*:(?!\s*(0|none)\b)/, `${selector.trim()} draws a border`);
    assert.doesNotMatch(body, /box-shadow\s*:[^;]*\binset\b/, `${selector.trim()} draws a ring`);
    if (/outline\s*:(?!\s*(0|none)\b)/.test(body)) assert.match(selector, /:focus-visible/, `${selector.trim()}: an outline only for the keyboard`);
  }
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "no colour but a token");
  assert.match(css, /\.s1-rail__item\[aria-current\]\s*\{[^}]*color:\s*var\(--s1-ink\)/, "the place you are at is in the ink");
  assert.match(css, /\.s1-rail--icons \.s1-rail__word \{[^}]*clip-path: inset\(50%\)/, "without words the word stays as the name, off the screen");
});
