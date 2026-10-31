import { Fragment, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import manifest from "../../../registry.json";
import { REGISTRY, type Entry, type Note, type PropDoc } from "@/components/uidocs/registry";
import { Button } from "@/ui/button";
import { Plate } from "@/ui/plate";
import { Select } from "@/ui/select";
import { Tabs, type Tab } from "@/ui/tabs";

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

/** The stage a live example stands on: the library's Plate, in the light hairline, the same size for every part. */
export function Example({ children }: { children: ReactNode }) {
  return (
    <Plate className="ud-plate">
      <div className="ud-plate__body">{children}</div>
    </Plate>
  );
}

/** A path with a place to break after each "/", so a long one wraps at its folders and never mid-name. */
export function Path({ children }: { children: string }) {
  return (
    <code>
      {children.split("/").map((seg, i, all) => (
        <Fragment key={i}>
          {seg}
          {i < all.length - 1 && (
            <>
              /<wbr />
            </>
          )}
        </Fragment>
      ))}
    </code>
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
 * The command that adds an item, for the reader's package manager, with Copy:
 * one line. The package manager is one choice for the whole page, kept for the
 * next visit; changing it here changes every command.
 */
export function Install({ item }: { item: string }) {
  const runner = useRunner();
  const [said, setSaid] = useState("");
  const pre = useRef<HTMLPreElement>(null);
  const timer = useRef<number>(undefined);
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
    <div className="ud-install" role="group" aria-label={`Install @s1lin/${item}`}>
      <div className="ud-install__row">
        <pre ref={pre} tabIndex={0}>
          <code>{command}</code>
        </pre>
        <Select size="sm" className="ud-install__pm" aria-label="Package manager" value={runner} onChange={(e) => pickRunner(e.target.value as Runner)}>
          {RUNNERS.map(([r]) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Button size="sm" className="ud-install__copy" onClick={() => void copy()} aria-label={`Copy: ${command}`}>
          {said === "Copied" ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="ud-install__said" aria-live="polite">
        {said}
      </p>
    </div>
  );
}

/** The files an item puts in the app, with the items it brings. */
function fileCount(item: string) {
  return withDependencies(item).reduce((n, i) => n + i.files.length, 0);
}

/** What an item puts in the app: its files, the items it brings and theirs, npm packages, and the command by address. */
export function Files({ item }: { item: string }) {
  const [own, ...brought] = withDependencies(item);
  if (!own) return null;
  const packages = [...new Set([own, ...brought].flatMap((i) => ("dependencies" in i ? i.dependencies : []) ?? []))];
  return (
    <div className="ud-files">
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
      <p className="ud-files__url">
        No registry set up: <code>npx shadcn@latest add {`${REGISTRY}/${item}.json`}</code>
      </p>
    </div>
  );
}

/**
 * Props as a table on a desktop: names never wrap, types wrap at their spaces,
 * the words take what is left. In a narrow box each prop is a block, its type
 * and default labelled.
 */
export function PropsTable({ title, props }: { title: string; props: PropDoc[] }) {
  const defaults = props.some((p) => p.default !== undefined || p.required);
  return (
    <div className="ud-props">
      <table>
        <caption className="visually-hidden">{title}</caption>
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
              <th scope="row" className="ud-props__name">
                <code>{p.name}</code>
              </th>
              <td className="ud-props__type" data-label="Type">
                <code>{p.type}</code>
              </td>
              {defaults && (
                <td className="ud-props__def" data-label="Default" data-none={!p.required && !p.default ? "" : undefined}>
                  {p.required ? <em>required</em> : p.default ? <code>{p.default}</code> : "—"}
                </td>
              )}
              <td className="ud-props__desc">
                <Inline text={p.desc} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Accessibility, motion, phone, dark mode, cost: what to know before using it; then where the site uses it. */
export function Notes({ notes, where }: { notes: Note[]; where?: string }) {
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
      {where && (
        <>
          <dt>On the site</dt>
          <dd>{where}</dd>
        </>
      )}
    </dl>
  );
}

/** A tab's name with its count beside it, in the third ink. */
function Counted({ name, n }: { name: string; n: number }) {
  return (
    <>
      {name} <span className="ud-ref__n">{n}</span>
    </>
  );
}

/**
 * The reference under an item, one tab each: its usage (open), its props, what
 * to know, the files it adds. Every panel is in the page's HTML; only the open
 * one shows.
 */
export function Reference({ e }: { e: Entry }) {
  const notes = (e.notes?.length ?? 0) + (e.where ? 1 : 0);
  const tabs: Tab[] = [];
  if (e.usage) tabs.push({ id: "usage", label: "Usage", content: <Code>{e.usage}</Code> });
  if (e.props) tabs.push({ id: "props", label: <Counted name={e.propsTitle ?? "Props"} n={e.props.length} />, content: <PropsTable title={`${e.name}: ${e.propsTitle ?? "Props"}`} props={e.props} /> });
  if (notes) tabs.push({ id: "notes", label: <Counted name="Notes" n={notes} />, content: <Notes notes={e.notes ?? []} where={e.where} /> });
  if (e.item) tabs.push({ id: "files", label: <Counted name="Files" n={fileCount(e.item)} />, content: <Files item={e.item} /> });
  if (tabs.length === 0) return null;
  return <Tabs className="ud-ref" label={`${e.name}: reference`} tabs={tabs} keepMounted />;
}
