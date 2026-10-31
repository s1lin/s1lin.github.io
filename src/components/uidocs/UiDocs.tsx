import { useEffect, useRef, useState } from "react";
import manifest from "../../../registry.json";
import { Runhead } from "@/components/Runhead";
import { Demo } from "@/components/uidocs/examples";
import { Guide } from "@/components/uidocs/guides";
import { Code, Example, Files, Inline, Install, Notes, PropsTable } from "@/components/uidocs/parts";
import { ENTRIES, GROUPS, LISTED, REGISTRY, type Entry } from "@/components/uidocs/registry";
import { Kicker } from "@/ui/kicker";
import { Toaster } from "@/ui/toast";

const RUN = "部品 · UI library";
const BY_GROUP = GROUPS.map((g) => ({ ...g, entries: ENTRIES.filter((e) => e.group === g.id) }));
const PARTS = manifest.items.filter((i) => i.type === "registry:ui").length;
const CONSOLE = manifest.items.filter((i) => i.type === "registry:ui" && i.categories?.includes("console")).length;
const HOOKS = manifest.items.filter((i) => i.type === "registry:hook").length;

/** One item: what it is, a live example, the command that adds it, how to use it, its props, what to know, its files. */
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
      {e.usage && <Code label="Usage">{e.usage}</Code>}
      {e.props && <PropsTable title={e.propsTitle ?? "Props"} props={e.props} />}
      {e.notes && <Notes notes={e.notes} />}
      {e.item && <Files item={e.item} />}
      {e.where && (
        <p className="ud-where">
          <b>On the site</b> {e.where}
        </p>
      )}
    </article>
  );
}

/**
 * The part under the reader's eye, from the ids given, as the running head
 * reads its label: whatever crosses the middle of the screen.
 */
function useActive(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) if (en.isIntersecting) setActive(en.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ids]);
  return active;
}

const IDS = [...ENTRIES.map((e) => e.id), "site"];

/** The index of parts: held on the left on a desktop, a strip of groups under the running head on a phone. */
function Nav() {
  const active = useActive(IDS);
  const group = active === "site" ? "site" : ENTRIES.find((e) => e.id === active)?.group;
  const nav = useRef<HTMLElement>(null);

  // Keep the current link in view inside the index, by scrolling the index alone, never the page.
  useEffect(() => {
    const box = nav.current;
    if (!box) return;
    const strip = box.querySelector<HTMLElement>(".ud-nav__groups");
    const link = box.querySelector<HTMLElement>(".ud-nav__items a[aria-current]") ?? box.querySelector<HTMLElement>(".ud-nav__group[aria-current]");
    if (!link || !strip) return;
    if (strip.scrollWidth > strip.clientWidth) {
      const g = box.querySelector<HTMLElement>(".ud-nav__group[aria-current]");
      if (g) strip.scrollTo({ left: g.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft - 8 });
    } else if (box.scrollHeight > box.clientHeight) {
      const top = link.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
      if (top < box.scrollTop + 40 || top > box.scrollTop + box.clientHeight - 40) box.scrollTo({ top: top - box.clientHeight / 3 });
    }
  }, [active]);

  return (
    <nav className="ud-nav" aria-label="Parts" ref={nav}>
      <p className="ud-nav__title mono">Library</p>
      <ol className="ud-nav__groups">
        {BY_GROUP.map((g) => (
          <li key={g.id}>
            <a className="ud-nav__group" href={`#${g.id}`} aria-current={group === g.id ? "true" : undefined}>
              {g.name}
            </a>
            <ul className="ud-nav__items">
              {g.entries.map((e) => (
                <li key={e.id}>
                  <a href={`#${e.id}`} aria-current={active === e.id ? "location" : undefined}>
                    {e.name}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
        <li>
          <a className="ud-nav__group" href="#site" aria-current={group === "site" ? "true" : undefined}>
            Site parts
          </a>
        </li>
      </ol>
    </nav>
  );
}

/** The site's own parts, not in the registry: a short list, so the inventory is whole. */
function SiteParts() {
  return (
    <section className="ud-group" id="site" data-run="部品 · Site parts" aria-labelledby="site-h">
      <h2 className="ud-group__h" id="site-h">
        Site parts <span className="mono">not published</span>
      </h2>
      <p className="ud-group__blurb">
        Sections and pieces written for one place in the site, from the parts above. They are listed so the inventory is
        whole; they are not in the registry. The WebGL effects are Canvas UI&rsquo;s: take them from{" "}
        <a href="https://canvasui.dev">canvasui.dev</a>, under its own licence.
      </p>
      <div className="ud-props ud-listed">
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
                <th scope="row">
                  <code>{l.name}</code>
                </th>
                <td className="ud-props__type">
                  <code>{l.sources.join(", ")}</code>
                </td>
                <td className="ud-props__def">
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
      <a className="skip" href="#parts">
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

              <div className="ud-body" id="parts">
                {BY_GROUP.map((g) => (
                  <section key={g.id} className="ud-group" id={g.id} data-run={`部品 · ${g.name}`} aria-labelledby={`${g.id}-h`}>
                    <h2 className="ud-group__h" id={`${g.id}-h`}>
                      {g.name} <span className="mono">{g.entries.length}</span>
                    </h2>
                    <p className="ud-group__blurb">{g.blurb}</p>
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
