# s1lin.github.io

s1lin's personal site, set like a magazine issue: **S1LIN Vol. 30, "Architecture"**.
React 19, TypeScript, Vite and Tailwind CSS, prerendered to static HTML and
served by GitHub Pages.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check, build, prerender into dist/
npm run preview  # serve dist/
npm run lint
```

`npm run build` renders every page to HTML (`src/entry-server.tsx`,
`scripts/prerender.mjs`): the issue, the blog and each post, so they read
without JavaScript and the client only hydrates them.

## Layout

| Path | What |
| --- | --- |
| `src/App.tsx` | The issue, section by section |
| `src/components/` | Cover, contents, features, cities, workshop, departures, colophon |
| `src/components/TokensbeatFigures.tsx` | The plan in the Tokensbeat feature, drawn as a building section: apps moving in on the foundation, the models under it |
| `src/components/canvasui/` | Canvas UI effects (Ripple, Magnify, Frost, Glitch, ParticleScroll), patched; see below |
| `src/components/effects.tsx` | Where those effects meet the photographs and section titles, and the frost over the page |
| `src/components/Metro2Line.tsx`, `src/hooks/useMetro2Line.ts`, `src/lib/metro.ts` | Metro2Line, playable, on the cover: ride twelve metro networks or guess a city |
| `public/data/metro/` | Those networks, from OpenStreetMap (`scripts/metro-data.py`) |
| `src/components/GitHubHeatmap.tsx` | The GitHub heatmap under the contents list: a year of contributions, a square a day |
| `src/content/github.json` | Its counts, from GitHub (`scripts/github-data.py`); see below |
| `src/components/AsciiArt.tsx` | [ascii.rest](https://ascii.rest) pieces: banner, typewriter, skyline, the departures board (inked in airport colours in `Departures.tsx`), and the alpine dawn and Tokyo rain that take turns at the end (`Colophon.tsx`) |
| `src/styles/site.css` | The design system: paper and ink tokens, the page frame, grid, type |
| `src/index.css` | Tailwind theme and utilities over `site.css` (no preflight) |
| `public/assets/img/` | Photographs and screenshots, WebP |
| `blog/`, `src/blog.tsx`, `src/components/Blog.tsx` | The blog at `/blog/`, outside the issue: its index, and a page per post |
| `src/content/posts/` | The posts, newest first in `index.ts`, one file each |
| `life/`, `src/life.tsx`, `src/components/Life.tsx`, `src/components/life/` | Life at `/life/`, outside the issue: the four rules, ARC-style puzzles, a playground, a study of the game |
| `src/lib/life/` | Its engine, levels and creatures, with no dependencies (`life.ts`, `levels.ts`, `patterns.ts`), and the two 160×135 glider-gun seeds from the Java original (`seeds/`) |

## UI components

`components.json` is set up for [shadcn](https://ui.shadcn.com), with the
[Canvas UI](https://canvasui.dev) registry under `@canvas-ui`:

```bash
npx shadcn@latest add @canvas-ui/ripple-react
```

Canvas UI effects normally need Chrome's experimental HTML-in-Canvas API. The
Ripple and Magnify are patched to paint the `<img>` inside them into WebGL instead,
so they run in any WebGL2 browser. Re-apply the patch after reinstalling one:

```bash
python3 scripts/patch-canvasui.py src/components/canvasui/Ripple.tsx src/components/canvasui/Ripple.tsx
```

Two rules hold for every patched effect. They run in image mode even where
Chrome's HTML-in-Canvas is switched on: its native path moves the children
into an absolutely placed canvas, where the figure loses its height and a lazy
`<img>` never loads. And each hands its WebGL context back when it unmounts
(`WEBGL_lose_context`): the effects mount and unmount as they near the
viewport, and past Chrome's limit of about 16 live contexts the oldest is
killed, which blanked the sand and the frost and flickered over the photos.

Frost is one pane of glass over the whole page (`FrostPane`). It captures
nothing, so it draws its own frost over the live page. Its patch adds a `reach`
option, which keeps the frost near the edges of the screen, and lets the render
loop sleep while the cursor rests:

```bash
python3 scripts/patch-frost.py src/components/canvasui/Frost.tsx src/components/canvasui/Frost.tsx
```

Glitch tears the section titles (`GlitchTitle`), once as each comes into view
and again under the pointer, never on a timer. Its patch sets the title's own
words into the canvas, inked so that a difference blend over the paper gives
their colour back and the RGB split shows in colour on either theme; the live
words hide only while a burst runs:

```bash
python3 scripts/patch-glitch.py src/components/canvasui/Glitch.tsx src/components/canvasui/Glitch.tsx
```

ParticleScroll turns the whole page to sand on the last fifth of the screen
(`SandPane`): whatever scrolls up from the bottom edge arrives as drifting
grains and settles into the page as it passes 80% of the way down. Out of the
box it needs HTML-in-Canvas to capture the page. The patch adds a painted mode
instead: `src/lib/page-paint.ts` reads the page's layout once (the band
backgrounds, the words, rules, photos, 2D canvases and drawings) and paints the
view from it as it scrolls, and the canvas is clear wherever the sand has
landed, so the real page shows through, sharp and clickable. Readers who
prefer reduced motion get no sand:

```bash
python3 scripts/patch-particle-scroll.py src/components/canvasui/ParticleScroll.tsx src/components/canvasui/ParticleScroll.tsx
```

Tailwind utilities win over `site.css`. The issue's colours and fonts are available
as `bg-paper`, `text-sumi`, `text-ink-2`, `font-mincho` and so on.

## Blog

`/blog/` holds longer pieces, outside the issue, each in the language it was
written in; the contents list on the issue's front page lists them under
"Blog, between issues". A post is one file in `src/content/posts/` (its title,
spec sheet, text, sources and a note on where it ran first), listed in
`index.ts`, plus an HTML shell at `blog/<slug>/index.html` carrying its title
and meta tags and `data-post="<slug>"` on the root. Vite builds every shell
under `blog/`, and the build fails if a listed post has no shell. Images go in
`public/assets/img/blog-*.webp`.

Maths is LaTeX, set by KaTeX when the pages are prerendered, so readers get
finished HTML (with MathML for screen readers) and no KaTeX script; only the
blog's pages load KaTeX's stylesheet, and its fonts load only where they are
used (`src/components/Tex.tsx`, `src/styles/tex.css`). Write the source with
`String.raw` so its backslashes stay, inline or on its own line:

```tsx
<Tex>{String.raw`P(A \mid B) = 80\%`}</Tex>
<Tex block>{String.raw`P(A \mid B)\,P(B) = P(B \mid A)\,P(A)`}</Tex>
```

A mistake in the source shows in red in its place rather than failing the
build. A wide equation scrolls sideways inside its own line on a phone; on a
desktop, break it into steps with `aligned` so it fits the column.

Pictures that belong to someone else are not rehosted: `<Elsewhere>` (in
`src/components/bits.tsx`) names each and links to where it can be seen, with
the figure's caption.

The issue loads Noto Serif SC only for the characters it shows. When a post's
title is Chinese, add its characters to the `text=` list of that font in the
root `index.html`, or the title falls back to a system font in the contents.

## Metro data

The Metro2Line player on the cover reads one JSON file per city from
`public/data/metro/`. To refresh them from OpenStreetMap, or to add a city to
the list at the top of the script:

```bash
python3 -I scripts/metro-data.py            # every city
python3 -I scripts/metro-data.py tokyo      # one city
```

The public Overpass server is often busy; the script retries. Map data ©
OpenStreetMap contributors, under the ODbL.

## GitHub heatmap

The heatmap under the contents list is drawn from `src/content/github.json`
at build time, so it is in the prerendered page and the browser asks GitHub
for nothing. `scripts/github-data.py` fills that file from the calendar on the
GitHub profile (`https://github.com/users/s1lin/contributions`, public, no
token). It keeps each day's count, GitHub's shade for it (0 to 4) and the
year's total, and nothing else from the page:

```bash
python3 -I scripts/github-data.py
```

The deploy workflow runs it before every build, and builds once a day for it,
so the published page is at most a day behind. If GitHub cannot be reached or
its page has changed shape, the script writes nothing and exits 1, and the
build goes on with the snapshot in the repo. Local builds use that snapshot
too; commit a fresh one now and then so it does not drift far.

## Life

`/life/` is Conway's Game of Life as a grid puzzle in the manner of ARC-AGI, lifted from a Java program (built on
the ACM graphics library) into TypeScript. The Java gave two seed grids, `GliderGun` and `TwoGliderGuns`, 160 by
135 cells of 0 and 1; they are in `src/lib/life/seeds/` and load into the playground as "Gun" and "Two guns".
The page, set on a visible twelve-column grid (the Grid button), has four parts:

- **The rules**: four cards, each a 3×3 neighbourhood drawn by the engine, so the picture cannot disagree with the rule.
- **Puzzles**: `levels.ts` lists them as a start grid and a number of generations; the answer is the engine's.
  Nothing is explained, and solving counts actions.
- **Playground**: a 160×135 board with a brush, the creatures of `patterns.ts`, a random soup and the two guns.
  Cells are coloured by age.
- **The study**: the field's history, a table of creatures and a reading list.

The engine (`life.ts`: B3/S23, bounded or wrapped) has no dependencies. Its tests live beside the source in the
author's Life repository: they check that each creature's period and movement match its entry in `patterns.ts`,
that the gun fires every 30 generations, that Diehard dies at generation 130, and that the seeds round-trip. Any new
creature or level needs its numbers checked the same way before it is listed. The page is drawn on canvases and is
not prerendered. The ACM library itself is not used and not included.

## Comments and shapes

Blog posts and the Life page take comments, likes and reposts, and Life takes shapes readers publish from the launch
pad. None of it is stored here: the site is static, so it all goes to **Aha Social**, the API the TokensBeat BFF
serves (contract: `agent-ui/SOCIAL.md` in the sub2api repository).

A repost is real: it lists the thing on the reposter's Aha page, and the thread shows "Reposted by …" (public names, a link when the member has a handle; `src/lib/social/client.ts` `repostedBy`, `reposts(handle)`).

- **API base:** `https://aha.tokensbeat.com` (`AHA_BASE` in `src/lib/social/client.ts`). A page can set
  `window.__SOCIAL_BASE__` before the app loads; on localhost `?social=http://127.0.0.1:8799` works too (nowhere else).
  The BFF must allow this site's origin (`AGENTUI_SOCIAL_ORIGINS`: `https://s1lin.tokensbeat.com`, `https://s1lin.github.io`).
- **Signing in:** only TokensBeat users act. "Sign in" opens an Aha popup (`#/social-connect?origin=<this origin>`) that
  posts back `{type: "tokensbeat-social", token, user}`; the page accepts it only from Aha's origin, keeps the token in
  `localStorage`, and sends it as a bearer header, never in a URL. "Create a TokensBeat account" is the owner's referral
  link, taken from `GET /api/public/social/config` (`signInUrl`).
- **Moderation:** every comment and shape is screened by Qwen on the server: approved at once, held for the owner, or
  refused with a reason the author sees. Comment text is shown as plain text, never as HTML.
- **Where:** `src/lib/social/` (client, shape crop, hooks), `src/components/social/` (`Comments`, `Reactions`,
  `ShapeGallery`, `ShapeSubmit`), `src/styles/social.css`; words in three languages in `src/components/social/copy.ts`
  (the blog uses English or Chinese by the post's language). Blog threads are `site:s1lin:blog/<slug>`, Life's is
  `site:s1lin:life`, a shape is `shape:<id>`. Comments load in the browser, so prerendered pages carry no thread.
- **Try it without Aha:** `node scripts/social-mock.mjs 8799`, then open `/life/?social=http://127.0.0.1:8799` on localhost
  (a token for the mock is any 16+ character string in `localStorage` under `tokensbeat-social-token`).
- **Tests:** `npm test` (`node --test test/*.test.ts`): token and origin checks, error mapping, request shape, shape cropping,
  the revision thread.
- **The composer** (`Composer.tsx`) is one box, like a chat composer: the draft, and a toolbar inside it with the model
  chip, **Revise with Aha** and Post (⌘/Ctrl ↵). Revise opens a short thread with Aha above the draft: quick revisions
  (Polish, Shorter, Friendlier, Clearer) or an instruction in words, each a request and an answer; a follow-up revises the
  latest answer, as in a chat, until the reader types in the box again. Aha only suggests: "Use this" puts the answer in
  the box (with Undo), nothing is posted until the reader presses Post, and a posted comment is screened like any other.
  It runs on the reader's own key and model (`GET /api/social/models`, `POST /api/social/revise {text, keyId, model,
  tone?, instruction?}`); the model chosen is kept in `localStorage` (`tokensbeat-social-revise`). The thread's state is a
  pure reducer (`src/lib/social/revision.ts`) under `npm test`. `scripts/social-mock.mjs` answers both calls after
  `DELAY` ms (keywords `plan`, `limit`, `broken`, `nokey`, `slow` steer the errors; `NOKEY=1`, `ONEKEY=1` change the keys).


## Token skyline

Under the GitHub heatmap, the editor's tokens with coding agents: a total and
its value at API list prices, the weeks from the first week there
was any (one equal-width column a week, each filled to full height with that
week's mix of models, a company to a hue and its models in shades of it, so a
quiet week still shows what it was spent on; a bar above each column, on a
square-root scale, is how many tokens it used), a "by model" chart under it that doubles as the key, each company under
its mark (`src/content/logos.ts`, from LobeHub Icons, MIT), and a flow from each agent to the kinds of token it
spent (cache reads, fresh input, cache writes, output), each agent's value
beside it (`src/components/TokenSkyline.tsx`). Money is the cost
cc-switch recorded; rows it left at $0 for want of a price are priced from the
fullest price table among the machines. `scripts/token-data.py` counts them from
cc-switch's usage database on each machine (this one, and others over SSH) and
writes only the totals, per agent per day, per model per day (the models
and their companies named in `FAMILIES`, Claude model by model, the rest as
Other) and per agent per kind, to
`src/content/tokens.json`. Cursor keeps no database there: pass its usage CSV exports with
`--cursor file.csv` (repeatable; a row in two exports counts once). Only daily totals reach
the site, and Cursor counts as unpriced, as its export has plan billing and no list prices.
Keep the CSVs out of the repo:

```bash
python3 -I scripts/token-data.py ~/.cc-switch/cc-switch.db ssh://user@host:port/root/.cc-switch/cc-switch.db
python3 -I scripts/token-data.py ... --sync   # first bring in the latest session logs
```

The machines are private, so the deploy workflow cannot run this; run it, then
commit the new `tokens.json`. A day that cc-switch holds both as a rollup and as
request rows counts once, at the larger figure, so the total is a floor.

## Deploy

`.github/workflows/deploy.yml` builds on every push to `master`, and daily at
06:17 UTC to refresh the heatmap, and publishes `dist/`. In the repository
settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Credits

Canvas UI by David Haz (MIT + Commons Clause); its Frost is adapted from
[frozen](https://github.com/takuma-hmng8/frozen) by takuma-hmng8. ascii.rest by
@bas3line (MIT).
Cities: Skylines is a trademark of Paradox Interactive.
