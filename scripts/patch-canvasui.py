"""Add an image mode to Canvas UI overlay effects (vanilla builds).

Without Chrome's HTML-in-Canvas API these effects have no page texture and
draw only their own highlights. The patch paints the first <img> inside
`content` into the `source` canvas instead, so they work in every WebGL2
browser. Usage: python3 -I scripts/patch-canvasui.py in.tsx out.tsx (in place is fine)
"""
import re
import sys

src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()

# HTML-in-Canvas only works when the content lives inside the source canvas.
detect = "  const htmlInCanvas = Boolean(\n    sourceCtx &&"
assert s.count(detect) == 1, "detect"
s = s.replace(detect, "  const htmlInCanvas = Boolean(\n    source.contains(content) &&\n    sourceCtx &&")

anchor = "  if (htmlInCanvas) prepareHtmlInCanvas(source, content);\n"
assert s.count(anchor) == 1, "anchor"
s = s.replace(anchor, anchor + '''
  // s1lin.github.io patch: image mode. Without HTML-in-Canvas, paint the first
  // <img> inside `content` into `source` so the effect still has a page.
  const plate = htmlInCanvas ? null : content.querySelector("img");
  const hasPage = htmlInCanvas || plate !== null;
  function paintPlate() {
    if (!plate || !sourceCtx) return;
    if (!plate.complete || !plate.naturalWidth) {
      plate.addEventListener("load", paintPlate, { once: true });
      return;
    }
    const box = output.getBoundingClientRect();
    const pic = plate.getBoundingClientRect();
    // Paint at the image's own resolution (up to 3x) so zoomed effects stay sharp.
    const ratio = Math.min(
      Math.max(window.devicePixelRatio || 1, plate.naturalWidth / Math.max(pic.width, 1)),
      3,
      4096 / Math.max(box.width, box.height, 1),
    );
    const w = Math.max(1, Math.round(box.width * ratio));
    const h = Math.max(1, Math.round(box.height * ratio));
    if (source.width !== w || source.height !== h) {
      source.width = w;
      source.height = h;
    }
    const fit = Math.max(pic.width / plate.naturalWidth, pic.height / plate.naturalHeight);
    const dw = plate.naturalWidth * fit;
    const dh = plate.naturalHeight * fit;
    // Honour object-fit: cover with the image's object-position (percentages).
    const [ox, oy] = getComputedStyle(plate).objectPosition
      .split(" ")
      .map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : 0.5));
    const ctx = sourceCtx as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(ratio, ratio);
    ctx.beginPath();
    ctx.rect(pic.left - box.left, pic.top - box.top, pic.width, pic.height);
    ctx.clip();
    ctx.drawImage(
      plate,
      pic.left - box.left + (pic.width - dw) * ox,
      pic.top - box.top + (pic.height - dh) * oy,
      dw,
      dh,
    );
    ctx.restore();
    content.setAttribute("data-painted", "");
    contentDirty = true;
    wake();
  }
''', 1)

n = s.count("htmlInCanvas ? 1 : 0")
assert n == 1, ("uHasContent", n)
s = s.replace("htmlInCanvas ? 1 : 0", "hasPage ? 1 : 0")

guard = "if (!htmlInCanvas || !contentDirty) return;"
assert s.count(guard) == 1, "upload guard"
s = s.replace(guard, "if (!hasPage || !contentDirty) return;")

# An effect that sleeps between ripples must keep drawing the page while idle:
# the <img> is hidden under the canvas once painted, so a cleared canvas is a
# blank photo (it flickered black between ripples).
idle = "    if (htmlInCanvas) {\n      render();\n    } else {\n      gl!.clearColor(0, 0, 0, 0);"
if idle in s:
    s = s.replace(idle, "    // The page is hidden under the canvas once painted, so idle must still draw it.\n    if (hasPage) {\n      render();\n    } else {\n      gl!.clearColor(0, 0, 0, 0);", 1)

paint = re.compile(r"(      paintable\.requestPaint!\(\);\n    \})")
assert len(paint.findall(s)) == 1, "requestPaint"
s = paint.sub(r"\1 else if (plate) {\n      paintPlate();\n    }", s, count=1)

note = (
    "// Canvas UI by David Haz (https://canvasui.dev), MIT + Commons Clause.\n"
    "// Local patch (scripts/patch-canvasui.py): image mode. Without HTML-in-Canvas, the first\n"
    "// <img> in the content is painted into the source canvas, so the effect works in any\n"
    "// WebGL2 browser. The content gets data-painted once that texture is in.\n"
)
if s.startswith('"use client";\n'):
    s = '"use client";\n' + note + s[len('"use client";\n'):]
else:
    s = note + s

# Image mode in every browser, even where HTML-in-Canvas exists. The native
# path moves the children into an absolutely placed canvas, so the figure loses
# its height and a lazy <img> in it never loads: the photo vanished there.
native = """  const supported = useSyncExternalStore(
    emptySubscribe,
    supportsHtmlInCanvas,
    () => false,
  );
"""
assert s.count(native) == 1, "native"
s = s.replace(
    native,
    "  // s1lin.github.io patch: image mode in every browser. The native path moves the\n"
    "  // children into an absolutely placed canvas, so the figure loses its height and a\n"
    "  // lazy <img> in it never loads: photos vanished wherever HTML-in-Canvas was on.\n"
    "  const supported = useSyncExternalStore(emptySubscribe, () => false, () => false);\n",
)

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
