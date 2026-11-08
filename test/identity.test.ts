import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/*
 * The site never names the editor (the no-real-name rule). A patent record lists its inventors by name, so neither the
 * site nor its public repository links a patent office or carries a patent number: the work is described in words
 * instead. Found 2026-11-07 (the frontend scan's P0): the career map and the 2024 feature linked a patent application
 * on Google Patents, one click from the anonymous site to the editor's name. Every text file of the repository is read
 * (the repository is public too), not node_modules, the build or this file's own made-up samples.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", "dist", "dist-ssr"]);
const SELF = path.join(ROOT, "test", "identity.test.ts");
const TEXT = /\.(tsx?|jsx?|mjs|css|html?|json|md|txt|xml|svg)$/;
const PATENT_SITES = /patents\.google\.com|patentimages\.storage\.googleapis\.com|worldwide\.espacenet\.com|patentscope\.wipo\.int|ppubs\.uspto\.gov|pss-system\.cponline\.cnipa\.gov\.cn|epub\.cnipa\.gov\.cn/i;
// A publication number: office, 6 to 13 digits, a kind code (made up: CN123456789A, US2024123456A1, EP4123456B1).
const PATENT_NUMBER = /\b(?:CN|US|WO|EP|JP|KR|DE)\s?\d{6,13}\s?[ABCUY]\d?\b/;

function files(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith(".")) continue;
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (TEXT.test(name)) out.push(p);
  }
  return out;
}

// The repository's text, the workflows included.
const shipped = [...files(ROOT), ...files(path.join(ROOT, ".github"))].filter((f) => f !== SELF);

test("the site and its repository link no patent office and name no patent number", () => {
  assert.ok(shipped.length > 50, `read ${shipped.length} files: the list of shipped folders is wrong`);
  const hits: string[] = [];
  for (const file of shipped) {
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (PATENT_SITES.test(line) || PATENT_NUMBER.test(line)) hits.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  assert.deepEqual(hits, [], "a patent record names its inventors: describe the work in words, without a number or a link");
});

test("the patterns catch what they are for", () => {
  for (const s of ["https://patents.google.com/patent/CN123456789A/en", "patent application CN123456789A", "US2024123456A1", "WO 2024012345 A1"]) {
    assert.ok(PATENT_SITES.test(s) || PATENT_NUMBER.test(s), s);
  }
  for (const s of ["a patent application for image processing", "CN¥ 34000", "since 2019", "H20 8×", "ISO 27001"]) {
    assert.ok(!PATENT_SITES.test(s) && !PATENT_NUMBER.test(s), s);
  }
});
