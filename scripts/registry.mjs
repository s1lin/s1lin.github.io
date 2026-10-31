// Builds the UI library's shadcn registry: registry.json (the items, each
// naming its files in src/ui/) into public/r/, one JSON file an item with the
// files' source inside, and public/r/registry.json, the index. Vite copies
// public/ into dist/, so Pages serves them at https://s1lin.tokensbeat.com/r/.
//
//   node scripts/registry.mjs                                  (npm run registry; npm run build runs it first)
//   S1LIN_REGISTRY=http://127.0.0.1:4192 node scripts/registry.mjs
//
// Items name their dependencies by full URL, so `shadcn add <url>` works with
// no registry set up. S1LIN_REGISTRY points those URLs at another host, to try
// the registry before it is published; never build for Pages with it set.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const HOME = "https://s1lin.tokensbeat.com";
const out = new URL("../public/r/", import.meta.url);
const shadcn = new URL("../node_modules/.bin/shadcn", import.meta.url).pathname;

rmSync(out, { recursive: true, force: true });
try {
  execFileSync(shadcn, ["build", "registry.json", "--output", "public/r"], { cwd: new URL("..", import.meta.url).pathname, stdio: "pipe" });
} catch (e) {
  // shadcn reports on stderr, with its progress; show it all only when the build failed
  process.stderr.write(`${e.stdout ?? ""}${e.stderr ?? ""}`);
  process.exit(1);
}

const base = process.env.S1LIN_REGISTRY?.replace(/\/$/, "");
const files = readdirSync(out).filter((f) => f.endsWith(".json"));
if (base && base !== HOME) {
  for (const f of files) {
    const file = new URL(f, out);
    writeFileSync(file, readFileSync(file, "utf8").replaceAll(`${HOME}/r/`, `${base}/r/`));
  }
}
console.log(`registry: ${files.length - 1} items in public/r/${base && base !== HOME ? `, dependencies at ${base}/r/` : ""}`);
