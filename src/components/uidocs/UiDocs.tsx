import { useEffect, useState } from "react";
import manifest from "../../../registry.json";
import { Runhead } from "@/components/Runhead";
import { Demo } from "@/components/uidocs/examples";
import { Guide } from "@/components/uidocs/guides";
import { Example, Inline, Install, Path, Reference } from "@/components/uidocs/parts";
import { ENTRIES, GROUPS, LISTED, REGISTRY, type Entry, type Group } from "@/components/uidocs/registry";
import { Kicker } from "@/ui/kicker";
import { SideNav, type SideNavItem, type SideNavSection } from "@/ui/side-nav";
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

/** The whole index, chapter by chapter, the parts by family, as the library's SideNav: the same tree on a desktop and in the phone's sheet. */
const entryItem = (e: Entry): SideNavItem => ({ id: e.id, label: e.name, href: `#${e.id}` });
const NAV: SideNavSection[] = [
  ...CHAPTERS.map((c, i): SideNavSection =>
    c.groups.length > 1
      ? {
          id: `chapter-${c.groups[0].id}`,
          number: pad(i + 1),
          title: c.name,
          href: `#${c.groups[0].id}`,
          sections: c.groups.map((g) => ({ id: g.id, title: g.name, count: g.entries.length, href: `#${g.id}`, items: g.entries.map(entryItem) })),
        }
      : { id: c.groups[0].id, number: pad(i + 1), title: c.name, href: `#${c.groups[0].id}`, items: c.groups[0].entries.map(entryItem) },
  ),
  { id: "site", number: pad(SITE_NO), title: "Site parts", href: "#site" },
];

/**
 * The index. On a desktop it is held on the left, whole, the part being read
 * marked and kept in view. On a phone it is a bar under the running head that
 * says where you are and opens the same tree as a sheet (without script the
 * tree stays in the page).
 */
function Nav() {
  const active = useActive(IDS);
  const entry = ENTRIES.find((e) => e.id === active);
  const group = groupOf(active);
  const groupName = group === "site" ? "Site parts" : (GROUPS.find((g) => g.id === group) ?? GROUPS[0]).name;
  const here = entry ? `${groupName} · ${entry.name}` : groupName;
  return <SideNav className="ud-nav" label="Library" title="Index" sections={NAV} current={active} currentType="location" sheet={900} here={here} />;
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
