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

`npm run build` renders the app to HTML (`src/entry-server.tsx`,
`scripts/prerender.mjs`), so the page reads without JavaScript and the client
only hydrates it.

## Layout

| Path | What |
| --- | --- |
| `src/App.tsx` | The issue, section by section |
| `src/components/` | Cover, contents, features, cities, workshop, departures, colophon |
| `src/components/TokensbeatFigures.tsx` | The section drawing in the Tokensbeat feature: the platform, its tenants, and the models under it |
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

## Deploy

`.github/workflows/deploy.yml` builds on every push to `master`, and daily at
06:17 UTC to refresh the heatmap, and publishes `dist/`. In the repository
settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Credits

Canvas UI by David Haz (MIT + Commons Clause); its Frost is adapted from
[frozen](https://github.com/takuma-hmng8/frozen) by takuma-hmng8. ascii.rest by
@bas3line (MIT).
Cities: Skylines is a trademark of Paradox Interactive.
