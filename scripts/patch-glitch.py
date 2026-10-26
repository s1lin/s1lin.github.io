"""Let Canvas UI's Glitch (React build) tear a section title in any WebGL2 browser.

Four changes:
- HTML-in-Canvas is used only when the content lives inside the source canvas.
- Text mode: otherwise the words inside `content` are set into the source
  canvas where the page laid them out. Each is inked as the difference between
  the paper behind it and its own colour, so the output, blended by difference
  over the paper, gives back the text's colour, and the RGB split comes out as
  coloured fringes on dark ink as well as on light.
- The copy is repainted as each burst starts (which also picks up a theme
  change), and `content` carries data-glitching while the burst runs, so the
  page can hide the live words for that moment and show only the torn copy.
- destroy() clears data-glitching, so a title never stays hidden.
Usage: python3 -I scripts/patch-glitch.py in.tsx out.tsx (in place is fine)
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
    "  let contentDirty = false;\n  let wake = () => {};\n",
    '''  let contentDirty = false;
  let wake = () => {};

  // s1lin.github.io patch: text mode. Without HTML-in-Canvas, set the words of
  // `content` into `source` where the page laid them out.
  const textMode = !htmlInCanvas && sourceCtx !== null;

  function rgb(colour: string) {
    return (colour.match(/[\\d.]+/g) ?? []).slice(0, 4).map(Number);
  }

  /** The paper behind the content: the first opaque background up the tree. */
  function paperBehind() {
    for (let el: Element | null = content; el; el = el.parentElement) {
      const [r, g, b, a = 1] = rgb(getComputedStyle(el).backgroundColor);
      if (a > 0.5) return [r, g, b];
    }
    return [255, 255, 255];
  }

  function paintText() {
    const ctx = sourceCtx!;
    const box = output.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(box.width * ratio));
    const h = Math.max(1, Math.round(box.height * ratio));
    if (source.width !== w || source.height !== h) {
      source.width = w;
      source.height = h;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, box.width, box.height);
    ctx.textBaseline = "alphabetic";
    const paper = paperBehind();
    const range = document.createRange();
    const walk = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    for (let node = walk.nextNode(); node; node = walk.nextNode()) {
      const style = getComputedStyle(node.parentElement!);
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.letterSpacing = style.letterSpacing;
      // Inked as |paper - colour|: a difference blend over the paper gives the colour back.
      const ink = rgb(style.color);
      ctx.fillStyle = `rgb(${paper.map((p, i) => Math.abs(p - ink[i])).join(" ")})`;
      for (const word of node.textContent!.matchAll(/\\S+/g)) {
        range.setStart(node, word.index!);
        range.setEnd(node, word.index! + word[0].length);
        const r = range.getClientRects()[0];
        if (!r) continue;
        const ascent = ctx.measureText(word[0]).fontBoundingBoxAscent;
        ctx.fillText(word[0], r.left - box.left, r.top - box.top + ascent);
      }
    }
    contentDirty = true;
  }
''',
)

swap(
    "    if (!htmlInCanvas || !contentDirty) return;\n",
    "    if (!(htmlInCanvas || textMode) || !contentDirty) return;\n",
)

swap(
    "    if (!reducedMotion) advanceTimeline(delta);\n    else envelope = 0;\n",
    "    if (!reducedMotion) advanceTimeline(delta);\n    else envelope = 0;\n"
    "    // Text mode: a fresh copy as each burst starts, and the live words hidden while it runs.\n"
    "    if (textMode && envelope > 0 !== wasActive) {\n"
    "      if (!wasActive) paintText();\n"
    '      content.toggleAttribute("data-glitching", envelope > 0);\n'
    "    }\n",
)

swap(
    "      if (htmlInCanvas) paintable.onpaint = null;\n",
    "      if (htmlInCanvas) paintable.onpaint = null;\n"
    '      content.removeAttribute("data-glitching");\n',
)

note = (
    "// Canvas UI by David Haz (https://canvasui.dev), MIT + Commons Clause.\n"
    "// Local patch (scripts/patch-glitch.py): HTML-in-Canvas only when the content sits in\n"
    "// the source canvas; otherwise a text mode sets the content's words into it, and the\n"
    "// content carries data-glitching while a burst runs.\n"
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
