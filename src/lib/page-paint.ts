/*
 * A rough painter for the sand over the page (SandPane in components/effects.tsx).
 *
 * Without HTML-in-Canvas a page cannot be captured, so this paints what the
 * sand needs from the layout instead. planPage() reads the page once: the
 * background of each full-width band, and every word where the page set it,
 * every rule, photograph, 2D canvas and drawing. paintPage() then draws the
 * part in view, on each frame the page scrolls: the bands onto a ground layer,
 * the rest onto an ink layer. Grains are a couple of pixels wide, so close is
 * close enough; pseudo-elements and background images are left out.
 */

type Box = { x: number; y: number; w: number; h: number };

/** Where a box is measured from: the document, or a sticky element it rides with. */
type Placed = Box & { anchor: Element | null; clip: (Box & { anchor: Element | null }) | null };

type Item = Placed &
  (
    | { kind: "fill"; color: string }
    | { kind: "text"; text: string; font: string; color: string; spacing: string }
    | { kind: "pre"; el: HTMLElement; font: string; color: string; line: number; pad: [number, number] }
    | { kind: "image"; src: HTMLImageElement | HTMLCanvasElement; host?: Element | null }
  );

export type PagePlan = { paper: string; bands: (Box & { color: string })[]; items: Item[] };

// WebGL outputs read back blank, and the sand must not paint itself.
const SKIP = "[data-fx] canvas, .glitch__out, script, style, noscript, template";
const SVG_PROPS = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-opacity",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "letter-spacing",
  "text-anchor",
  "dominant-baseline",
  "display",
  "visibility",
];

const clear = (c: string) => !c || c === "transparent" || /(,|\/)\s*0\)$/.test(c);

/** An SVG as an image: its computed styles inlined, since an SVG image sees no stylesheet. */
async function rasterise(svg: SVGSVGElement, r: DOMRect): Promise<HTMLImageElement | null> {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const from = [svg, ...svg.querySelectorAll("*")];
  const to = [copy, ...copy.querySelectorAll("*")];
  from.forEach((el, i) => {
    const cs = getComputedStyle(el);
    to[i].setAttribute("style", SVG_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(";"));
  });
  copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copy.setAttribute("width", String(r.width));
  copy.setAttribute("height", String(r.height));
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
  try {
    await img.decode();
    return img;
  } catch {
    return null;
  }
}

/** Read the page under `root` into a plan that paintPage() can draw at any scroll. */
export async function planPage(root: HTMLElement): Promise<PagePlan> {
  const vw = document.documentElement.clientWidth;
  const items: Item[] = [];
  const bands: PagePlan["bands"] = [];
  const pending: Promise<void>[] = [];
  const anchors = new Map<Element, DOMRect>();
  const range = document.createRange();

  const place = (r: DOMRect, anchor: Element | null): Box => {
    if (!anchor) return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
    let a = anchors.get(anchor);
    if (!a) anchors.set(anchor, (a = anchor.getBoundingClientRect()));
    return { x: r.left - a.left, y: r.top - a.top, w: r.width, h: r.height };
  };

  function words(node: Text, cs: CSSStyleDeclaration, anchor: Element | null, clip: Placed["clip"]) {
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const upper = cs.textTransform === "uppercase";
    const spacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
    const vertical = cs.writingMode.startsWith("vertical");
    const push = (r: DOMRect, text: string) => {
      if (r.width && r.height)
        items.push({ kind: "text", ...place(r, anchor), anchor, clip, text: upper ? text.toUpperCase() : text, font, color: cs.color, spacing });
    };
    for (const m of node.data.matchAll(/\S+/g)) {
      const at = m.index ?? 0;
      range.setStart(node, at);
      range.setEnd(node, at + m[0].length);
      const rects = range.getClientRects();
      if (rects.length === 1 && !vertical) {
        push(rects[0], m[0]);
        continue;
      }
      // A word broken over lines, or set vertically: one character at a time.
      for (let i = 0; i < m[0].length; i++) {
        range.setStart(node, at + i);
        range.setEnd(node, at + i + 1);
        push(range.getBoundingClientRect(), m[0][i]);
      }
    }
  }

  function visit(el: Element, anchor: Element | null, clip: Placed["clip"]) {
    if (el.matches(SKIP)) return;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    // A photo an effect has hidden under its canvas still belongs in the sand.
    if (!(el instanceof HTMLImageElement) && Number(cs.opacity) === 0) return;
    if (cs.position === "sticky") anchor = el;
    const r = el.getBoundingClientRect();
    const box = { ...place(r, anchor), anchor, clip };

    if (r.width > 0 && r.height > 0) {
      if (!clear(cs.backgroundColor)) {
        if (!anchor && r.width >= vw * 0.9) bands.push({ ...box, color: cs.backgroundColor });
        else items.push({ kind: "fill", ...box, color: cs.backgroundColor });
      }
      const sides: [string, Box][] = [
        ["Top", { x: box.x, y: box.y, w: box.w, h: parseFloat(cs.borderTopWidth) }],
        ["Bottom", { x: box.x, y: box.y + box.h - parseFloat(cs.borderBottomWidth), w: box.w, h: parseFloat(cs.borderBottomWidth) }],
        ["Left", { x: box.x, y: box.y, w: parseFloat(cs.borderLeftWidth), h: box.h }],
        ["Right", { x: box.x + box.w - parseFloat(cs.borderRightWidth), y: box.y, w: parseFloat(cs.borderRightWidth), h: box.h }],
      ];
      for (const [side, b] of sides) {
        const color = cs.getPropertyValue(`border-${side.toLowerCase()}-color`);
        const style = cs.getPropertyValue(`border-${side.toLowerCase()}-style`);
        if (b.w > 0 && b.h > 0 && style !== "none" && style !== "hidden" && !clear(color))
          items.push({ kind: "fill", ...b, anchor, clip, color });
      }
    }

    if (el instanceof HTMLImageElement || el instanceof HTMLCanvasElement) {
      items.push({ kind: "image", ...box, src: el, host: el instanceof HTMLCanvasElement ? el.parentElement : null });
      return;
    }
    if (el instanceof SVGSVGElement) {
      if (r.width && r.height)
        pending.push(
          rasterise(el, r).then((img) => {
            if (img) items.push({ kind: "image", ...box, src: img });
          }),
        );
      return;
    }
    if (el instanceof HTMLPreElement) {
      const size = parseFloat(cs.fontSize);
      const line = cs.lineHeight === "normal" ? size * 1.2 : parseFloat(cs.lineHeight);
      const pad: [number, number] = [
        parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth),
        parseFloat(cs.paddingTop) + parseFloat(cs.borderTopWidth),
      ];
      // Its text is read when it is painted: typewriters and boards change it as they play.
      items.push({ kind: "pre", ...box, el, font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, color: cs.color, line, pad });
      return;
    }

    if (cs.overflowX !== "visible" || cs.overflowY !== "visible") clip = box;
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) words(child as Text, cs, anchor, clip);
      else if (child.nodeType === Node.ELEMENT_NODE) visit(child as Element, anchor, clip);
    }
  }

  visit(root, null, null);
  await Promise.all(pending);
  const body = getComputedStyle(document.body).backgroundColor;
  return { paper: clear(body) ? getComputedStyle(document.documentElement).backgroundColor : body, bands, items };
}

/** The element now standing where a replaced photo or canvas stood. */
function successor(it: Extract<Item, { kind: "image" }>): HTMLImageElement | HTMLCanvasElement | null {
  if (it.src instanceof HTMLCanvasElement) return it.host?.querySelector("canvas") ?? null;
  const src = it.src.getAttribute("src");
  return src ? document.querySelector<HTMLImageElement>(`main img[src="${CSS.escape(src)}"]`) : null;
}

/** Draw the part of the plan in view: bands onto `ground`, everything else onto `ink`. */
export function paintPage(plan: PagePlan, ink: HTMLCanvasElement, ground: HTMLCanvasElement) {
  const w = ink.width;
  const h = ink.height;
  const g = ground.getContext("2d");
  const c = ink.getContext("2d");
  if (!g || !c) return;

  g.fillStyle = plan.paper;
  g.fillRect(0, 0, w, h);
  for (const b of plan.bands) {
    const y = b.y - scrollY;
    if (y > h || y + b.h < 0) continue;
    g.fillStyle = b.color;
    g.fillRect(b.x - scrollX, y, b.w, b.h);
  }

  c.clearRect(0, 0, w, h);
  c.textBaseline = "middle";
  const anchors = new Map<Element, DOMRect>();
  const at = (b: Box, anchor: Element | null): [number, number] => {
    if (!anchor) return [b.x - scrollX, b.y - scrollY];
    let a = anchors.get(anchor);
    if (!a) anchors.set(anchor, (a = anchor.getBoundingClientRect()));
    return [a.left + b.x, a.top + b.y];
  };
  let font = "";
  let spacing = "";
  const setFont = (f: string, s: string) => {
    if (f !== font) c.font = font = f;
    if (s !== spacing && "letterSpacing" in c) c.letterSpacing = spacing = s;
  };

  for (const it of plan.items) {
    const [x, y] = at(it, it.anchor);
    if (y > h || y + it.h < 0 || x > w || x + it.w < 0) continue;
    if (it.clip) {
      const [cx, cy] = at(it.clip, it.clip.anchor);
      c.save();
      c.beginPath();
      c.rect(cx, cy, it.clip.w, it.clip.h);
      c.clip();
    }
    switch (it.kind) {
      case "fill":
        c.fillStyle = it.color;
        c.fillRect(x, y, it.w, it.h);
        break;
      case "text":
        setFont(it.font, it.spacing);
        c.fillStyle = it.color;
        c.fillText(it.text, x, y + it.h / 2, it.w + 2);
        break;
      case "pre": {
        setFont(it.font, "0px");
        c.fillStyle = it.color;
        const lines = (it.el.textContent ?? "").split("\n");
        lines.forEach((line, i) => {
          const ly = y + it.pad[1] + (i + 0.5) * it.line;
          if (ly > -it.line && ly < h + it.line) c.fillText(line, x + it.pad[0], ly);
        });
        break;
      }
      case "image": {
        // React replaces some elements after the page is read: a closing plate turning swaps
        // its canvas, an effect mounting near the viewport re-creates its photo. Follow them.
        if (!it.src.isConnected) it.src = successor(it) ?? it.src;
        const img = it.src;
        const ready = img instanceof HTMLImageElement ? img.complete && img.naturalWidth > 0 : img.width > 0;
        if (ready) c.drawImage(img, x, y, it.w, it.h);
        break;
      }
    }
    if (it.clip) c.restore();
  }
}
