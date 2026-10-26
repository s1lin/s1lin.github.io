"""Let Canvas UI's ParticleScroll (React build) turn the whole page to sand in any WebGL2 browser.

Painted mode, used when the elements carry a `paint` callback:
- `content` is the document (document.documentElement), so the window's
  scroll drives the reveal; the window's scroll events wake the loop.
- Nothing is captured: on each frame after a scroll, `paint()` draws the
  view into `source` (the ink the grains are made of) and `ground` (the paper
  of each band). It returns false until it has something to draw, which also
  holds the intro back.
- Where the sand has landed the output is clear, so the live page shows
  through, sharp and clickable; elsewhere it is the ground, until the grains
  land. Without HTML-in-Canvas this is the only mode that draws anything.
Usage: python3 -I scripts/patch-particle-scroll.py in.tsx out.tsx (in place is fine)
"""
import sys

src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()


def sub(old, new, label):
    global s
    assert s.count(old) == 1, label
    s = s.replace(old, new)


sub(
    "  /** Canvas the WebGL effect renders to. */\n  output: HTMLCanvasElement;\n}\n",
    """  /** Canvas the WebGL effect renders to. */
  output: HTMLCanvasElement;
  /** Painted mode: draws the view into `source` and `ground`; false while it has nothing to draw. */
  paint?: () => boolean;
  /** Painted mode: the paper under the page, shown wherever the sand has not landed. */
  ground?: HTMLCanvasElement;
}
""",
    "elements",
)

sub("  const { source, content, output } = elements;\n", "  const { source, content, output, paint, ground } = elements;\n", "destructure")

sub(
    "  if (!htmlInCanvas) return null;\n",
    "  // s1lin.github.io patch: painted mode (see the header).\n"
    "  const painted = !htmlInCanvas && Boolean(paint && ground);\n"
    "  if (!htmlInCanvas && !painted) return null;\n",
    "early return",
)
sub("  prepareHtmlInCanvas(source, content);\n", "  if (htmlInCanvas) prepareHtmlInCanvas(source, content);\n", "prepare")
sub("  let contentDirty = false;\n", "  let contentDirty = false;\n  let paintDirty = painted;\n", "paintDirty")

sub(
    "uniform vec3 uBg;\n",
    "uniform vec3 uBg;\nuniform sampler2D uGround;\nuniform float uPainted;\n",
    "base uniforms",
)
sub(
    "  outColor = vec4(mix(uBg, tex.rgb, vis * tex.a), uCover);\n",
    """  if (uPainted > 0.5) {
    // Painted mode: clear where the sand has landed, the paper where it has not.
    outColor = vis > 0.5 ? vec4(0.0) : vec4(texture(uGround, vec2(vUv.x, 1.0 - vUv.y)).rgb, 1.0);
    return;
  }
  outColor = vec4(mix(uBg, tex.rgb, vis * tex.a), uCover);
""",
    "base output",
)

sub(
    "  let contentMaxX = 1;\n",
    """  const groundTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, groundTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));

  let contentMaxX = 1;
""",
    "ground texture",
)

sub(
    "      paintable.requestPaint!();\n    }\n  }\n\n  const motionQuery",
    """      paintable.requestPaint!();
    } else if (painted) {
      // Grains are a couple of pixels wide: the layers are painted at one pixel a CSS pixel.
      for (const layer of [source, ground!]) {
        if (layer.width !== output.clientWidth || layer.height !== output.clientHeight) {
          layer.width = Math.max(1, output.clientWidth);
          layer.height = Math.max(1, output.clientHeight);
        }
      }
      paintDirty = true;
    }
  }

  const motionQuery""",
    "syncCanvasSize",
)

sub(
    "    if (!htmlInCanvas || !contentDirty) return;\n",
    "    if (!contentDirty) return;\n",
    "upload guard",
)
sub(
    "    gl!.generateMipmap(gl!.TEXTURE_2D);\n  }\n\n  function rowTargetFor",
    """    gl!.generateMipmap(gl!.TEXTURE_2D);
    if (painted) {
      gl!.bindTexture(gl!.TEXTURE_2D, groundTexture);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, ground!);
    }
  }

  function rowTargetFor""",
    "upload ground",
)

sub(
    "    gl!.uniform3f(base.uniforms.uBg, bg[0], bg[1], bg[2]);\n",
    """    gl!.uniform3f(base.uniforms.uBg, bg[0], bg[1], bg[2]);
    gl!.uniform1f(base.uniforms.uPainted, painted ? 1 : 0);
    if (painted) {
      gl!.activeTexture(gl!.TEXTURE2);
      gl!.bindTexture(gl!.TEXTURE_2D, groundTexture);
      gl!.uniform1i(base.uniforms.uGround, 2);
      gl!.activeTexture(gl!.TEXTURE0);
    }
""",
    "base uniforms set",
)
sub("    if (!htmlInCanvas || rowsAssembled) return;\n", "    if ((!htmlInCanvas && !painted) || rowsAssembled) return;\n", "points pass")

sub(
    "    render(delta);\n",
    """    if (paintDirty && paint!()) {
      paintDirty = false;
      contentDirty = true;
    }
    render(delta);
""",
    "paint step",
)

sub(
    "    if (htmlInCanvas) paintable.requestPaint!();\n    start();\n",
    "    if (htmlInCanvas) paintable.requestPaint!();\n    else if (painted) paintDirty = true;\n    start();\n",
    "onScroll",
)
sub(
    '  content.addEventListener("scroll", onScroll, { passive: true });\n',
    '  content.addEventListener("scroll", onScroll, { passive: true });\n'
    '  // The document scrolls the window, whose scroll events never reach documentElement.\n'
    '  if (painted) window.addEventListener("scroll", onScroll, { passive: true });\n',
    "listeners",
)
sub(
    '      content.removeEventListener("scroll", onScroll);\n',
    '      content.removeEventListener("scroll", onScroll);\n      window.removeEventListener("scroll", onScroll);\n',
    "destroy listeners",
)
sub("      gl!.deleteTexture(rowTex);\n", "      gl!.deleteTexture(rowTex);\n      gl!.deleteTexture(groundTexture);\n", "destroy ground")

note = (
    "// Canvas UI by David Haz (https://canvasui.dev), MIT + Commons Clause.\n"
    "// Local patch (scripts/patch-particle-scroll.py): painted mode. The document is the content,\n"
    "// a `paint` callback draws the view into `source` and `ground` instead of a DOM capture, and\n"
    "// the output is clear wherever the sand has landed, so it works in any WebGL2 browser.\n"
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
