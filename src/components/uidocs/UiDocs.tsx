import { useEffect, useRef, useState } from "react";
import { Kicker } from "@/components/bits";
import { Runhead } from "@/components/Runhead";
import { Demo } from "@/components/uidocs/examples";
import { Code, Inline, Notes, Plate, PropsTable } from "@/components/uidocs/parts";
import { ENTRIES, GROUPS, LISTED, type Entry } from "@/components/uidocs/registry";

const RUN = "部品 · UI components";
const BY_GROUP = GROUPS.map((g) => ({ ...g, entries: ENTRIES.filter((e) => e.group === g.id) }));
const LIVE = ENTRIES.filter((e) => e.example !== "none").length;

/** One part: what it is, a live example, how to bring it in and use it, its props, and what to know. */
function Item({ e }: { e: Entry }) {
  return (
    <article className="ud-item" id={e.id} aria-labelledby={`${e.id}-name`}>
      <header className="ud-item__head">
        <h3 className="ud-item__name" id={`${e.id}-name`}>
          {e.name}
        </h3>
        <p className="ud-item__file">{e.sources.join(" · ")}</p>
      </header>
      <p className="ud-item__sum">
        <Inline text={e.summary} />
      </p>
      {e.import && <Code label="Import">{e.import}</Code>}
      {e.example !== "none" && (
        <Plate kind={e.example}>
          <Demo id={e.id} />
        </Plate>
      )}
      {e.see && (
        <p className="ud-see">
          <a href={e.see.href}>{e.see.label} →</a>
        </p>
      )}
      {e.usage && <Code label="Use">{e.usage}</Code>}
      {e.props && <PropsTable title={e.propsTitle ?? "Props"} props={e.props} />}
      {e.notes && <Notes notes={e.notes} />}
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
      <p className="ud-nav__title mono">Parts</p>
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

/** The site's own sections, for completeness. */
function SiteParts() {
  return (
    <section className="ud-group" id="site" data-run="部品 · Site parts" aria-labelledby="site-h">
      <h2 className="ud-group__h" id="site-h">
        Site parts <span className="mono">{LISTED.length}</span>
      </h2>
      <p className="ud-group__blurb">
        Sections and pages written for one place in the site, from the parts above. They are listed so the inventory is
        whole; they are not meant to be lifted out as they are.
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
                  <a href={l.where}>{l.where}</a>
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

/** /ui/: every part this site is built from, documented for reuse. */
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
              <Kicker ja="部品">UI · the parts of the issue</Kicker>
              <h1 className="display">
                The parts <em>of the issue.</em>
              </h1>
              <p className="dek">
                Every component and shared part this site is built from, in one place: what each is for, an example that
                runs, its props, how to import it, and what to know before using it.
              </p>
            </header>
            <div className="ud-aside">
              <p>
                <b>{ENTRIES.length} parts</b> in {GROUPS.length} groups, {LIVE} with an example on the page; {LISTED.length}{" "}
                site parts listed at the end.
              </p>
              <p>
                Import from <code>@/</code>, the alias for <code>src/</code>. Styles are global: <code>site.css</code> for
                everything, <code>social.css</code> and <code>life.css</code> for those pages&rsquo; parts.
              </p>
              <p>
                Specimens are the real markup with mock data: nothing on this page signs in, posts or calls Aha. Heavy
                effects start only near the screen, or when you ask.
              </p>
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
    </>
  );
}
