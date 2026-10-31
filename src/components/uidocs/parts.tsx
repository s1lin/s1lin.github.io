import { Fragment, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import manifest from "../../../registry.json";
import { REGISTRY, type Note, type PropDoc } from "@/components/uidocs/registry";
import { Button } from "@/ui/button";
import { Plate } from "@/ui/plate";

/** Words from the inventory: `code` in backticks, nothing else read as markup. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 2 ? <code key={i}>{part.slice(1, -1)}</code> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}

/** A block of code, scrolling sideways inside its own frame when a line is wider than the column. */
export function Code({ children, label }: { children: string; label?: string }) {
  return (
    <figure className="ud-code">
      {label && <figcaption className="ud-code__label">{label}</figcaption>}
      <pre tabIndex={0}>
        <code>{children}</code>
      </pre>
    </figure>
  );
}

/** The plate a live example stands on: the library's Plate, labelled. */
export function Example({ children }: { children: ReactNode }) {
  return (
    <Plate className="ud-plate">
      <p className="ud-plate__kind mono">Live</p>
      <div className="ud-plate__body">{children}</div>
    </Plate>
  );
}

// ------------------------------------------------------------------ install

type Item = (typeof manifest.items)[number];
const ITEMS = new Map<string, Item>(manifest.items.map((i) => [i.name, i]));
const nameOf = (url: string) => url.slice(url.lastIndexOf("/") + 1, -".json".length);

/** An item and every item it brings, depth first, each once. */
function withDependencies(name: string, seen = new Set<string>()): Item[] {
  const item = ITEMS.get(name);
  if (!item || seen.has(name)) return [];
  seen.add(name);
  const deps = ("registryDependencies" in item ? item.registryDependencies : []) ?? [];
  return [item, ...deps.flatMap((d) => withDependencies(nameOf(d), seen))];
}

/** Where shadcn writes a file: `@components/s1lin/x` is the consumer's components folder. */
const placed = (target: string) => target.replace(/^@components\//, "components/");

const RUNNERS = [
  ["npm", "npx shadcn@latest add"],
  ["pnpm", "pnpm dlx shadcn@latest add"],
  ["yarn", "yarn dlx shadcn@latest add"],
  ["bun", "bunx --bun shadcn@latest add"],
] as const;
type Runner = (typeof RUNNERS)[number][0];

/* The reader's package manager, shared by every install block and kept for their next visit. */
const PM_KEY = "s1lin-ui-pm";
const listeners = new Set<() => void>();
let picked: Runner | null = null;
function currentRunner(): Runner {
  if (!picked) {
    try {
      const saved = localStorage.getItem(PM_KEY);
      picked = RUNNERS.some(([id]) => id === saved) ? (saved as Runner) : "npm";
    } catch {
      picked = "npm";
    }
  }
  return picked;
}
function pickRunner(id: Runner) {
  picked = id;
  try {
    localStorage.setItem(PM_KEY, id);
  } catch {
    /* a private window: the choice lasts the visit */
  }
  listeners.forEach((l) => l());
}
function useRunner() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    currentRunner,
    () => "npm" as Runner,
  );
}

/**
 * The command that adds an item, for the reader's package manager, with Copy.
 * Under it, the same by its address, for an app without the registry set up.
 */
export function Install({ item }: { item: string }) {
  const runner = useRunner();
  const [said, setSaid] = useState("");
  const pre = useRef<HTMLPreElement>(null);
  const timer = useRef<number>(undefined);
  const id = useId();
  const command = `${RUNNERS.find(([r]) => r === runner)![1]} @s1lin/${item}`;
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setSaid("Copied");
    } catch {
      // No clipboard here (an insecure page, a refusal): select the command for the reader to copy.
      const range = document.createRange();
      if (pre.current) range.selectNodeContents(pre.current);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
      setSaid("Selected: copy it with ⌘C or Ctrl+C");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaid(""), 2400);
  }

  return (
    <figure className="ud-install" aria-labelledby={`${id}-cap`}>
      <figcaption className="ud-code__label" id={`${id}-cap`}>
        Install
      </figcaption>
      <div className="ud-install__box">
        <div className="ud-install__bar">
          <p className="ud-install__pm" role="group" aria-label="Package manager">
            {RUNNERS.map(([r]) => (
              <button key={r} type="button" aria-pressed={r === runner} onClick={() => pickRunner(r)}>
                {r}
              </button>
            ))}
          </p>
          <Button size="sm" className="ud-install__copy" onClick={() => void copy()} aria-label={`Copy: ${command}`}>
            {said === "Copied" ? "Copied" : "Copy"}
          </Button>
        </div>
        <pre ref={pre} tabIndex={0}>
          <code>{command}</code>
        </pre>
      </div>
      <p className="ud-install__said" aria-live="polite">
        {said}
      </p>
      <p className="ud-install__url">
        No registry set up: <code>npx shadcn@latest add {`${REGISTRY}/${item}.json`}</code>
      </p>
    </figure>
  );
}

/** What an item puts in the app: its files, the items it brings and theirs, and npm packages. */
export function Files({ item }: { item: string }) {
  const [own, ...brought] = withDependencies(item);
  if (!own) return null;
  const packages = [...new Set([own, ...brought].flatMap((i) => ("dependencies" in i ? i.dependencies : []) ?? []))];
  return (
    <div className="ud-files">
      <h4 className="ud-h4 mono">Files</h4>
      <ul>
        {own.files.map((f) => (
          <li key={f.path}>
            <code>{placed(f.target)}</code>
          </li>
        ))}
        {brought.flatMap((b) =>
          b.files.map((f) => (
            <li key={f.path} className="ud-files__dep">
              <code>{placed(f.target)}</code> <span>with {b.name}</span>
            </li>
          )),
        )}
      </ul>
      {packages.length > 0 && (
        <p>
          npm: {packages.map((p, i) => (
            <Fragment key={p}>
              {i > 0 && ", "}
              <code>{p}</code>
            </Fragment>
          ))}
        </p>
      )}
    </div>
  );
}

/** Props as a table on a desktop; on a phone each prop stacks into a small block. */
export function PropsTable({ title, props }: { title: string; props: PropDoc[] }) {
  const defaults = props.some((p) => p.default !== undefined || p.required);
  return (
    <div className="ud-props">
      <h4 className="ud-h4 mono">{title}</h4>
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            {defaults && <th scope="col">Default</th>}
            <th scope="col">What it does</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name}>
              <th scope="row">
                <code>{p.name}</code>
              </th>
              <td className="ud-props__type">
                <code>{p.type}</code>
              </td>
              {defaults && <td className="ud-props__def">{p.required ? <em>required</em> : p.default ? <code>{p.default}</code> : "—"}</td>}
              <td>
                <Inline text={p.desc} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Accessibility, motion, phone, dark mode, cost: what to know before using it. */
export function Notes({ notes }: { notes: Note[] }) {
  return (
    <dl className="ud-notes">
      {notes.map((n, i) => (
        <Fragment key={i}>
          <dt>{n.label}</dt>
          <dd>
            <Inline text={n.text} />
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}
