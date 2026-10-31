import { useEffect, useRef, useState } from "react";
import manifest from "../../../registry.json";
import { Runhead } from "@/components/Runhead";
import { Demo } from "@/components/uidocs/examples";
import { Guide } from "@/components/uidocs/guides";
import { Example, Inline, Install, Path, Reference } from "@/components/uidocs/parts";
import { ENTRIES, GROUPS, LISTED, REGISTRY, type Entry, type Group } from "@/components/uidocs/registry";
import { Kicker } from "@/ui/kicker";
import { Toaster } from "@/ui/toast";

const RUN = "部品 · UI library";
const BY_GROUP = GROUPS.map((g) => ({ ...g, entries: ENTRIES.filter((e) => e.group === g.id) }));
type Family = Group & { entries: Entry[] };
const PARTS = manifest.items.filter((i) => i.type === "registry:ui").length;
const CONSOLE = manifest.items.filter((i) => i.type === "registry:ui" && i.categories?.includes("console")).length;
const HOOKS = manifest.items.filter((i) => i.type === "registry:hook").length;

/** The index's chapters, in the page's order: each holds one group, or (the parts) several families. */
const CHAPTERS = BY_GROUP.reduce<{ name: string; groups: Family[] }[]>((all, g) => {
  const last = all[all.length - 1];
  if (last?.name === g.chapter) last.groups.push(g);
  else all.push({ name: g.chapter, groups: [g] });
  return all;
}, []);
const SITE_NO = CHAPTERS.length + 1;
const pad = (n: number) => String(n).padStart(2, "0");

/** Where a group stands: "03 · Parts · 2 of 6" for a family, "02 · Foundations" for a chapter of its own. */
function placeOf(g: Group) {
  const i = CHAPTERS.findIndex((c) => c.name === g.chapter);
  const c = CHAPTERS[i];
  return c.groups.length > 1 ? `${pad(i + 1)} · ${c.name} · ${c.groups.findIndex((x) => x.id === g.id) + 1} of ${c.groups.length}` : `${pad(i + 1)} · ${c.name}`;
}

/** One item, always in the same order: name, what it is, the example, the command, then the reference in tabs. */
function Item({ e }: { e: Entry }) {
  return (
    <article className="ud-item" id={e.id} aria-labelledby={`${e.id}-name`}>
      <header className="ud-item__head">
        <h3 className="ud-item__name" id={`${e.id}-name`}>
          {e.name}
        </h3>
        {e.item && <p className="ud-item__file">@s1lin/{e.item}</p>}
      </header>
      <p className="ud-item__sum">
        <Inline text={e.summary} />
      </p>
      {e.example === "guide" && <Guide id={e.id} />}
      {e.example === "live" && (
        <Example>
          <Demo id={e.id} />
        </Example>
      )}
      {e.item && <Install item={e.item} />}
      <Reference e={e} />
    </article>
  );
}

/**
 * What the reader is at: the last group or item whose top has passed 45% of
 * the screen, read from the layout on each scroll, so a jump by a link (which
 * skips every line in between) lands marked too.
 */
function useActive(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const line = innerHeight * 0.45;
      let at: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top > line) break;
        at = id;
      }
      setActive(at);
    };
    const soon = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    addEventListener("scroll", soon, { passive: true });
    addEventListener("resize", soon);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", soon);
      removeEventListener("resize", soon);
    };
  }, [ids]);
  return active;
}

/* In the page's order: each group, then its items; the site parts last. */
const IDS = [...BY_GROUP.flatMap((g) => [g.id, ...g.entries.map((e) => e.id)]), "site"];
const GROUP_IDS = new Set<string>([...GROUPS.map((g) => g.id), "site"]);
/** The group the reader is in, whether at its heading or at one of its items. */
const groupOf = (active: string | null) => (active && GROUP_IDS.has(active) ? active : ENTRIES.find((e) => e.id === active)?.group);

/** The whole index, chapter by chapter, the parts by family: the same tree on a desktop and in the phone's drawer. */
function Tree({ active, onPick }: { active: string | null; onPick?: () => void }) {
  const group = groupOf(active);
  const items = (g: Family) => (
    <ul className="ud-tree__items">
      {g.entries.map((e) => (
        <li key={e.id}>
          <a href={`#${e.id}`} aria-current={active === e.id ? "location" : undefined} onClick={onPick}>
            {e.name}
          </a>
        </li>
      ))}
    </ul>
  );
  return (
    <ol className="ud-tree">
      {CHAPTERS.map((c, i) => (
        <li key={c.name} className="ud-tree__chapter">
          <a className="ud-tree__head" href={`#${c.groups[0].id}`} aria-current={c.groups.some((g) => g.id === group) ? "true" : undefined} onClick={onPick}>
            <span className="ud-tree__no">{pad(i + 1)}</span>
            {c.name}
          </a>
          {c.groups.length > 1 ? (
            <ol className="ud-tree__families">
              {c.groups.map((g) => (
                <li key={g.id}>
                  <a className="ud-tree__family" href={`#${g.id}`} aria-current={g.id === group ? "true" : undefined} onClick={onPick}>
                    {g.name} <span className="ud-tree__count">{g.entries.length}</span>
                  </a>
                  {items(g)}
                </li>
              ))}
            </ol>
          ) : (
            items(c.groups[0])
          )}
        </li>
      ))}
      <li className="ud-tree__chapter">
        <a className="ud-tree__head" href="#site" aria-current={group === "site" ? "true" : undefined} onClick={onPick}>
          <span className="ud-tree__no">{pad(SITE_NO)}</span>
          Site parts
        </a>
      </li>
    </ol>
  );
}

/**
 * The index. On a desktop it is held on the left, whole, the part being read
 * marked and kept in view. On a phone it is a bar under the running head that
 * says where you are and opens the same tree; a native <details>, so it opens
 * without JavaScript too.
 */
function Nav() {
  const active = useActive(IDS);
  const entry = ENTRIES.find((e) => e.id === active);
  const group = groupOf(active);
  const groupName = group === "site" ? "Site parts" : (GROUPS.find((g) => g.id === group) ?? GROUPS[0]).name;
  const here = entry ? `${groupName} · ${entry.name}` : groupName;
  const side = useRef<HTMLDivElement>(null);
  const drawer = useRef<HTMLDetailsElement>(null);

  // Keep the current link in view inside the held index, by scrolling the index alone, never the page.
  useEffect(() => {
    const box = side.current;
    const link = box?.querySelector<HTMLElement>("a[aria-current='location']") ?? box?.querySelector<HTMLElement>(".ud-tree__family[aria-current], .ud-tree__head[aria-current]");
    if (!box || !link || box.scrollHeight <= box.clientHeight) return;
    const top = link.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    if (top < box.scrollTop + 48 || top > box.scrollTop + box.clientHeight - 48) box.scrollTo({ top: top - box.clientHeight / 3 });
  }, [active]);

  // The drawer closes on Esc, giving focus back to its bar.
  useEffect(() => {
    const d = drawer.current;
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && d.open) {
        d.open = false;
        d.querySelector("summary")?.focus();
      }
    };
    d.addEventListener("keydown", onKey);
    return () => d.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav className="ud-nav" aria-label="Library">
      <details className="ud-nav__drawer" ref={drawer}>
        <summary className="ud-nav__bar">
          <span className="ud-nav__label">Index</span>
          <span className="ud-nav__here">{here}</span>
          <span className="ud-nav__sign" aria-hidden="true" />
        </summary>
        <div className="ud-nav__sheet">
          <Tree
            active={active}
            onPick={() => {
              if (drawer.current) drawer.current.open = false;
            }}
          />
        </div>
      </details>
      <div className="ud-nav__side" ref={side}>
        <p className="ud-nav__title">Index</p>
        <Tree active={active} />
      </div>
    </nav>
  );
}

/** A group's opening: where it stands, its name, what is in it. */
function GroupHead({ g }: { g: Group }) {
  return (
    <header className="ud-group__head">
      <p className="ud-group__no">{placeOf(g)}</p>
      <h2 className="ud-group__h" id={`${g.id}-h`}>
        {g.name}
      </h2>
      <p className="ud-group__blurb">{g.blurb}</p>
    </header>
  );
}

/** The site's own parts, not in the registry: a short list, so the inventory is whole. */
function SiteParts() {
  return (
    <section className="ud-group" id="site" data-run="部品 · Site parts" aria-labelledby="site-h">
      <header className="ud-group__head">
        <p className="ud-group__no">{pad(SITE_NO)} · Not published</p>
        <h2 className="ud-group__h" id="site-h">
          Site parts
        </h2>
        <p className="ud-group__blurb">
          Sections and pieces written for one place in the site, from the parts above. They are listed so the inventory is
          whole; they are not in the registry. The WebGL effects are Canvas UI&rsquo;s: take them from{" "}
          <a href="https://canvasui.dev">canvasui.dev</a>, under its own licence.
        </p>
      </header>
      <div className="ud-listed">
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">File</th>
              <th scope="col">Where</th>
              <th scope="col">What it is</th>
            </tr>
          </thead>
          <tbody>
            {LISTED.map((l) => (
              <tr key={l.name}>
                <th scope="row" className="ud-listed__name">
                  <code>{l.name}</code>
                </th>
                <td className="ud-listed__file">
                  {l.sources.map((s, i) => (
                    <span key={s}>
                      {i > 0 && ", "}
                      <Path>{s}</Path>
                    </span>
                  ))}
                </td>
                <td className="ud-listed__where">
                  <a href={l.where}>{l.where.replace(/^https:\/\//, "")}</a>
                </td>
                <td>{l.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** /ui/: the library the site is built from, documented for installing elsewhere. */
export function UiPage() {
  return (
    <>
      <a className="skip" href="#library">
        Skip to the parts
      </a>
      <Runhead label={RUN} home="/" />
      <main>
        <section className="spread uidocs" data-run={RUN}>
          <div className="wrap grid">
            <header className="ud-intro">
              <Kicker ja="部品">UI · a library from the issue</Kicker>
              <h1 className="display">
                The parts, <em>to take with you.</em>
              </h1>
              <p className="dek">
                The parts this site is set with, and the parts a console needs (forms, tables, dialogs, keys), published as
                a component registry: one command adds a part to your app, its source and its own stylesheet, and the copy
                is yours. Plain CSS in tokens you can restyle; no Tailwind needed, and none in the way if you have it.
              </p>
            </header>
            <div className="ud-aside">
              <p>
                <b>{manifest.items.length} items</b>: {PARTS} parts ({CONSOLE} of them for a console), {HOOKS} hooks,{" "}
                <code>cn</code> and the tokens, each with a live example on this page.
              </p>
              <p>
                <code>npx shadcn@latest add @s1lin/button</code>, once <code>@s1lin</code> is in your components.json; the
                index is <a href={`${REGISTRY}/registry.json`}>/r/registry.json</a>.
              </p>
              <p>The examples are the published code: the site imports the same files it serves.</p>
            </div>

            {/* the index and the parts in a box of their own, so the held index lets go where the parts end */}
            <div className="ud-main">
              <Nav />

              <div className="ud-body" id="library">
                {BY_GROUP.map((g) => (
                  <section key={g.id} className="ud-group" id={g.id} data-run={`部品 · ${g.name}`} aria-labelledby={`${g.id}-h`}>
                    <GroupHead g={g} />
                    {g.entries.map((e) => (
                      <Item key={e.id} e={e} />
                    ))}
                  </section>
                ))}
                <SiteParts />
              </div>
            </div>

            <div className="endmark mono">
              <p>© 2026 s1lin</p>
              <p>
                <a href="#top">Back to the top ↑</a>
              </p>
              <p>
                <a href="/">The issue →</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Toaster />
    </>
  );
}
