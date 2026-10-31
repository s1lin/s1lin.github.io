import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { registryItemSchema, registrySchema } from "shadcn/schema";
import { ENTRIES, GROUPS, LISTED, REGISTRY } from "../src/components/uidocs/registry.ts";

/*
 * The library against what describes it: registry.json (what the registry
 * serves) must name real files that bring everything they import, the /ui/
 * docs must document every item and every export, the inventory must cover
 * every exported component of the site, the built registry must be what
 * shadcn reads, and the docs page must never mount a part that talks to Aha.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (f: string) => readFileSync(path.join(ROOT, f), "utf8");

type File = { path: string; type: string; target: string };
type Item = { name: string; type: string; files: File[]; dependencies?: string[]; registryDependencies?: string[] };
const MANIFEST = JSON.parse(read("registry.json")) as { name: string; homepage: string; items: Item[] };
const ITEMS = new Map(MANIFEST.items.map((i) => [i.name, i]));

/** Every file under a source: the file itself, or each .ts/.tsx file in a folder. */
function files(source: string): string[] {
  const full = path.join(ROOT, source);
  if (!statSync(full).isDirectory()) return [source];
  return readdirSync(full)
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => path.join(source, f));
}

const exported = (name: string) => new RegExp(`export (async )?(function|const|interface|type|class) ${name}\\b`);
const itemOf = (url: string) => {
  assert.ok(url.startsWith(`${REGISTRY}/`) && url.endsWith(".json"), `${url} is not an item of ${REGISTRY}`);
  return url.slice(REGISTRY.length + 1, -".json".length);
};
/** An item and every item it brings, each once. */
function closure(name: string, seen = new Set<string>()): Item[] {
  const item = ITEMS.get(name);
  assert.ok(item, `no item ${name}`);
  if (seen.has(name)) return [];
  seen.add(name);
  return [item, ...(item.registryDependencies ?? []).flatMap((u) => closure(itemOf(u), seen))];
}
const code = (i: Item) => i.files.filter((f) => /\.tsx?$/.test(f.path));

// ------------------------------------------------------------------ the registry

test("every item's files exist in src/ui/ and install side by side under components/s1lin/", () => {
  const listed = new Set<string>();
  for (const item of MANIFEST.items) {
    assert.ok(item.files.length > 0, `${item.name} has no files`);
    for (const f of item.files) {
      assert.ok(existsSync(path.join(ROOT, f.path)), `${item.name}: ${f.path} does not exist`);
      assert.match(f.path, /^src\/ui\/[a-z-]+\.(tsx?|css)$/, `${item.name}: ${f.path} is not a file of src/ui/`);
      assert.equal(f.target, `@components/s1lin/${path.basename(f.path)}`, `${item.name}: ${f.path} would not land beside the others`);
      assert.ok(!listed.has(f.path), `${f.path} is in two items`);
      listed.add(f.path);
    }
  }
  const unlisted = readdirSync(path.join(ROOT, "src/ui")).filter((f) => !listed.has(`src/ui/${f}`));
  assert.deepEqual(unlisted, [], "every file in src/ui/ is published: add these to an item in registry.json");
});

test("an item brings everything its files import", () => {
  for (const item of MANIFEST.items) {
    const all = closure(item.name);
    const shipped = new Set(all.flatMap((i) => i.files.map((f) => path.basename(f.path))));
    const packages = new Set(all.flatMap((i) => i.dependencies ?? []).map((d) => d.replace(/(.)@.*$/, "$1")));
    for (const f of item.files) {
      const text = read(f.path);
      const specs = [
        ...text.matchAll(/(?:^|\n)\s*import\s+["']([^"']+)["']/g), // import "./x.css"
        ...text.matchAll(/(?:^|\n)\s*(?:import|export)\s[^;"']*?\sfrom\s+["']([^"']+)["']/g), // import … from "x"
        ...text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g), // import("x")
        ...text.matchAll(/@import\s+["']([^"']+)["']/g), // @import "x" in a stylesheet
      ].map((m) => m[1]);
      for (const spec of specs) {
        if (spec.startsWith("./")) {
          const base = spec.slice(2);
          assert.ok([base, `${base}.ts`, `${base}.tsx`].some((b) => shipped.has(b)), `${item.name}: ${f.path} imports ${spec}, which the item does not bring`);
        } else {
          assert.ok(!spec.startsWith("@/") && !spec.startsWith("../"), `${item.name}: ${f.path} imports ${spec}; parts import one another by ./ only`);
          const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
          if (pkg === "react" || pkg === "react-dom") continue;
          assert.ok(packages.has(pkg), `${item.name}: ${f.path} imports ${pkg}, not in the item's dependencies`);
        }
      }
    }
  }
});

test("the built registry is what shadcn reads", () => {
  const out = mkdtempSync(path.join(tmpdir(), "s1lin-r-"));
  try {
    execFileSync(path.join(ROOT, "node_modules/.bin/shadcn"), ["build", "registry.json", "--output", out], { cwd: ROOT, stdio: "pipe" });
    const built = readdirSync(out).filter((f) => f.endsWith(".json"));
    assert.deepEqual(built.sort(), [...MANIFEST.items.map((i) => `${i.name}.json`), "registry.json"].sort());
    registrySchema.parse(JSON.parse(readFileSync(path.join(out, "registry.json"), "utf8")));
    for (const item of MANIFEST.items) {
      const json = registryItemSchema.parse(JSON.parse(readFileSync(path.join(out, `${item.name}.json`), "utf8")));
      for (const f of json.files ?? []) assert.equal(f.content, read(f.path), `${item.name}: ${f.path} is not shipped as it is`);
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

// ------------------------------------------------------------------ the docs

test("every item is documented once, and every documented item is in the registry", () => {
  const documented = ENTRIES.filter((e) => e.item).map((e) => e.item!);
  assert.equal(new Set(documented).size, documented.length, "an item is documented twice");
  assert.deepEqual([...documented].sort(), MANIFEST.items.map((i) => i.name).sort());
  for (const e of ENTRIES) if (e.item) assert.equal(e.id, e.item, `${e.name}: its anchor should be its item's name`);
});

test("every export of a published file is documented, and every documented export exists", () => {
  for (const e of ENTRIES.filter((x) => x.item)) {
    const item = ITEMS.get(e.item!)!;
    const text = code(item).map((f) => read(f.path)).join("\n");
    const found = [...text.matchAll(/export (?:async )?(?:function|const|interface|type|class) (\w+)/g)].map((m) => m[1]);
    assert.deepEqual([...found].sort(), [...e.exports].sort(), `${e.name}: exports and docs differ`);
  }
});

test("every documented prop is named in its source", () => {
  for (const e of ENTRIES) {
    if (!e.item || !e.props) continue;
    const text = ITEMS.get(e.item)!.files.map((f) => read(f.path)).join("\n");
    for (const p of e.props) assert.match(text, new RegExp(`(^|[^\\w-])${p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`), `${e.name}: ${p.name} not found in its files`);
  }
  // and the tokens the docs list are all the tokens there are
  const declared = new Set([...read("src/ui/tokens.css").matchAll(/(--s1-[\w-]+):/g)].map((m) => m[1]));
  const listed = ENTRIES.find((e) => e.id === "tokens")!.props!.map((p) => p.name);
  assert.deepEqual([...declared].sort(), [...listed].sort());
});

test("every source the site-parts list names exists and exports what it says", () => {
  for (const l of LISTED) {
    for (const s of l.sources) assert.ok(existsSync(path.join(ROOT, s)), `${l.name}: ${s} does not exist`);
    const text = l.sources.flatMap(files).map(read).join("\n");
    for (const name of l.exports) assert.match(text, exported(name), `${l.name}: ${name} is not exported from ${l.sources.join(", ")}`);
  }
});

test("the inventory covers every exported component in src/components", () => {
  const named = new Set(LISTED.flatMap((i) => i.exports));
  const walk = (dir: string): string[] =>
    readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? (d.name === "uidocs" ? [] : walk(path.join(dir, d.name))) : /\.tsx$/.test(d.name) ? [path.join(dir, d.name)] : [],
    );
  const missing: string[] = [];
  for (const f of walk("src/components")) {
    for (const m of read(f).matchAll(/export function ([A-Z]\w*)/g)) if (!named.has(m[1])) missing.push(`${m[1]} (${f})`);
  }
  assert.deepEqual(missing, [], "add these to LISTED in src/components/uidocs/registry.ts, or publish them in src/ui/");
});

test("ids are unique and every group has entries", () => {
  const ids = ENTRIES.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
  const groups = new Set(GROUPS.map((g) => g.id));
  for (const e of ENTRIES) assert.ok(groups.has(e.group), `${e.id}: unknown group ${e.group}`);
  for (const g of GROUPS) assert.ok(ENTRIES.some((e) => e.group === g.id), `${g.id} has no entries`);
});

test("the groups keep the anchors links point at, each in a chapter of the index", () => {
  const ids = GROUPS.map((g) => g.id);
  for (const id of ["start", "parts", "forms", "data", "overlays", "feedback", "text", "hooks"]) assert.ok(ids.includes(id), `#${id} is linked to: keep the group`);
  for (const g of GROUPS) assert.ok(g.chapter, `${g.id} is in no chapter`);
  // a chapter's groups stand together, so the index reads in the page's order
  const chapters = GROUPS.map((g) => g.chapter).filter((c, i, all) => c !== all[i - 1]);
  assert.equal(new Set(chapters).size, chapters.length, "a chapter's groups are split apart");
  assert.ok(!ENTRIES.some((e) => e.id === "library" || e.id === "site"), "#library and #site are the page's own");
});

test("every entry with an example or a guide has its case", () => {
  const examples = read("src/components/uidocs/examples.tsx");
  const guides = read("src/components/uidocs/guides.tsx");
  for (const e of ENTRIES) {
    if (e.example === "live") assert.ok(examples.includes(`case "${e.id}":`), `${e.id} is live but has no example`);
    if (e.example === "guide") assert.ok(guides.includes(`case "${e.id}":`), `${e.id} has no guide`);
    if (e.item && e.group !== "start") assert.equal(e.example, "live", `${e.id}: a published part needs a live example`);
  }
});

test("the docs page never mounts a part that calls Aha", () => {
  const forbidden = [/<(Comments|Composer|Reactions|ShapeGallery|ShapeSubmit|SignInBar)\b/, /@\/lib\/social\//, /@\/components\/social\//, /\bsocial\(\)/, /\buse(Session|SocialConfig|Models)\(/];
  const pages = files("src/components/uidocs").filter((f) => f.endsWith(".tsx")).concat("src/ui.tsx");
  assert.ok(pages.length > 1);
  for (const f of pages) {
    const text = read(f);
    for (const re of forbidden) assert.ok(!re.test(text), `${f} must not use ${re}`);
  }
});
