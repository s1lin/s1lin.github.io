import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { ENTRIES, GROUPS, LISTED } from "../src/components/uidocs/registry.ts";

/*
 * The /ui/ docs against the source they describe: what the registry names must
 * exist, the inventory must cover every exported component, and the docs page
 * itself must never mount a part that talks to Aha.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (f: string) => readFileSync(path.join(ROOT, f), "utf8");

/** Every file under a source: the file itself, or each .ts/.tsx file in a folder. */
function files(source: string): string[] {
  const full = path.join(ROOT, source);
  if (!statSync(full).isDirectory()) return [source];
  return readdirSync(full)
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => path.join(source, f));
}

const exported = (name: string) => new RegExp(`export (async )?(function|const|interface|type|class) ${name}\\b`);

test("every source named in the registry exists", () => {
  for (const item of [...ENTRIES, ...LISTED]) {
    for (const s of item.sources) assert.ok(existsSync(path.join(ROOT, s)), `${item.name}: ${s} does not exist`);
  }
});

test("every export named in the registry is exported from its sources", () => {
  for (const item of [...ENTRIES, ...LISTED]) {
    const text = item.sources.flatMap(files).map(read).join("\n");
    for (const name of item.exports) assert.match(text, exported(name), `${item.name}: ${name} is not exported from ${item.sources.join(", ")}`);
  }
});

test("every documented prop is named in its component's source", () => {
  for (const e of ENTRIES) {
    if (!e.props || e.exports.length === 0) continue; // tokens and classes are checked by eye
    const text = e.sources.flatMap(files).map(read).join("\n");
    for (const p of e.props) assert.match(text, new RegExp(`\\b${p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`), `${e.name}: prop ${p.name} not found in its source`);
  }
});

test("the inventory covers every exported component in src/components", () => {
  const named = new Set([...ENTRIES, ...LISTED].flatMap((i) => i.exports));
  const walk = (dir: string): string[] =>
    readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? (d.name === "uidocs" ? [] : walk(path.join(dir, d.name))) : /\.tsx$/.test(d.name) ? [path.join(dir, d.name)] : [],
    );
  const missing: string[] = [];
  for (const f of walk("src/components")) {
    for (const m of read(f).matchAll(/export function ([A-Z]\w*)/g)) if (!named.has(m[1])) missing.push(`${m[1]} (${f})`);
  }
  assert.deepEqual(missing, [], "add these to ENTRIES or LISTED in src/components/uidocs/registry.ts");
});

test("ids are unique and every entry is in a known group", () => {
  const ids = ENTRIES.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  const groups = new Set(GROUPS.map((g) => g.id));
  for (const e of ENTRIES) assert.ok(groups.has(e.group), `${e.id}: unknown group ${e.group}`);
  for (const g of GROUPS) assert.ok(ENTRIES.some((e) => e.group === g.id), `${g.id} has no entries`);
});

test("every entry with a live example has a case in the examples", () => {
  const examples = read("src/components/uidocs/examples.tsx");
  for (const e of ENTRIES) {
    if (e.example === "none") continue;
    assert.ok(examples.includes(`case "${e.id}":`), `${e.id} is marked ${e.example} but has no example`);
  }
});

test("the docs page never mounts a part that calls Aha", () => {
  // Specimens stand in for these; the client and the session hooks are not imported at all.
  const forbidden = [/<(Comments|Composer|Reactions|ShapeGallery|ShapeSubmit|SignInBar)\b/, /@\/lib\/social\//, /\bsocial\(\)/, /\buse(Session|SocialConfig|Models)\(/];
  // The page's code, not the registry, whose usage strings show these parts in use.
  const code = files("src/components/uidocs").filter((f) => f.endsWith(".tsx")).concat("src/ui.tsx");
  assert.ok(code.length > 1);
  for (const f of code) {
    const text = read(f);
    for (const re of forbidden) assert.ok(!re.test(text), `${f} must not use ${re}`);
  }
});
