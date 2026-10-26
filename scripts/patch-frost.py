"""Let Canvas UI's Frost (React build) frost the whole page as a pane of glass.

Three changes:
- HTML-in-Canvas is used only when the content lives inside the source canvas.
  The page pane captures nothing, so it always draws the frost as its own
  translucent layer over the live page, in Chrome's trial and everywhere else.
- A `reach` option stops the frost partway as it grows in from the edges, so
  a pane over text can leave the middle clear. The default, 1, covers it all.
- A resting cursor stops melting after a moment. Otherwise the loop draws a
  full-screen pass every frame for as long as the mouse sits on the page.
Usage: python3 -I scripts/patch-frost.py in.tsx out.tsx (in place is fine)
"""
import sys

src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()


def swap(old, new):
    global s
    assert s.count(old) == 1, old
    s = s.replace(old, new)


swap(
    "  const htmlInCanvas = Boolean(\n    sourceCtx &&",
    "  const htmlInCanvas = Boolean(\n    source.contains(content) &&\n    sourceCtx &&",
)

swap(
    "  introDuration?: number;\n",
    "  introDuration?: number;\n"
    "  /** How far the frost grows in from the edges (0-1). 1 covers the pane. */\n"
    "  reach?: number;\n",
)
swap("  introDuration: 2.5,\n", "  introDuration: 2.5,\n  reach: 1,\n")
swap(
    "    if (introMs <= 0 || reducedMotion) return 1;\n",
    "    if (introMs <= 0 || reducedMotion) return config.reach;\n",
)
swap("    return t * t * (3 - 2 * t);\n", "    return t * t * (3 - 2 * t) * config.reach;\n")

swap("  let pointerOn = false;\n", "  let pointerOn = false;\n  let lastMove = 0;\n")
swap(
    "    pointerOn = true;\n    activeUntil = performance.now() + refreezeDelayMs();\n",
    "    pointerOn = true;\n    lastMove = performance.now();\n    activeUntil = performance.now() + refreezeDelayMs();\n",
)
swap(
    "    const animating =\n",
    "    // s1lin.github.io patch: a cursor at rest stops melting, so the loop can sleep.\n"
    "    if (pointerOn && now - lastMove > 400) pointerOn = false;\n\n"
    "    const animating =\n",
)

note = (
    "// Canvas UI by David Haz (https://canvasui.dev), MIT + Commons Clause. Adapted from\n"
    "// frozen by takuma-hmng8. Local patch (scripts/patch-frost.py): HTML-in-Canvas only\n"
    "// when the content sits inside the source canvas, a `reach` option for frost that\n"
    "// stops short of the middle, and a resting cursor stops melting.\n"
)
if s.startswith('"use client";\n'):
    s = '"use client";\n' + note + s[len('"use client";\n'):]
else:
    s = note + s

# Release the WebGL context in destroy(). Effects mount and unmount as they near
# the viewport, and a destroyed effect's context stays alive until garbage
# collection; past Chrome's limit (about 16) the oldest live context is killed,
# which blanked the sand and the frost and flickered over the photographs.
release = "      if (htmlInCanvas) paintable.onpaint = null;\n"
assert s.count(release) == 1, "release"
s = s.replace(
    release,
    release
    + "      // Hand the context back now; a dead one counts against Chrome's limit until GC.\n"
    + '      gl!.getExtension("WEBGL_lose_context")?.loseContext();\n',
)

open(dst, "w").write(s)
print("patched", dst)
