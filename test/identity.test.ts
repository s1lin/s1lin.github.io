import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/*
 * The site never names the editor (the no-real-name rule). A patent record lists its inventors by name, so the site
 * links no patent office and carries no patent number: the work is described in words instead. Found 2026-11-07 (the
 * frontend scan's P0): the career map and the 2024 feature linked patent application (number removed) on Google Patents,
 * one click from the anonymous site to the editor's name. Every source and page the site ships is read: src/, the
 * HTML entry pages and public/ (the registry, the data files), not node_modules or the build.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const SHIPPED = ["src", "public", "blog", "life", "ui"];
const TEXT = /\.(tsx?|jsx?|mjs|css|html?|json|md|txt|xml|svg)$/;
const PATENT_SITES = /patents\.google\.com|patentimages\.storage\.googleapis\.com|worldwide\.espacenet\.com|patentscope\.wipo\.int|ppubs\.uspto\.gov|pss-system\.cponline\.cnipa\.gov\.cn|epub\.cnipa\.gov\.cn/i;
// A publication number: office, 6 to 13 digits, a kind code ((number removed), US2024123456A1, WO2024012345A1, EP4123456B1).
const PATENT_NUMBER = /\b(?:CN|US|WO|EP|JP|KR|DE)\s?\d{6,13}\s?[ABCUY]\d?\b/;

function files(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (TEXT.test(name)) out.push(p);
  }
  return out;
}

const shipped = [
  ...SHIPPED.map((d) => path.join(ROOT, d)).filter((d) => {
    try {
      return statSync(d).isDirectory();
    } catch {
      return false;
    }
  }).flatMap(files),
  ...readdirSync(ROOT).filter((n) => n.endsWith(".html")).map((n) => path.join(ROOT, n)),
];

test("the site links no patent office and names no patent number", () => {
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
  for (const s of ["#", "patent application (number removed)", "US2024123456A1", "WO 2024012345 A1"]) {
    assert.ok(PATENT_SITES.test(s) || PATENT_NUMBER.test(s), s);
  }
  for (const s of ["a patent application for image processing", "CN¥ 34000", "since 2019", "H20 8×", "ISO 27001"]) {
    assert.ok(!PATENT_SITES.test(s) && !PATENT_NUMBER.test(s), s);
  }
});
