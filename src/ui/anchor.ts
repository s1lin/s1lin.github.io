/*
 * The machinery every part that opens a panel over the page shares (Menu, Dropdown, Popover, Combobox, Select): the
 * panel sits in the top layer (the Popover API), so no frame or table clips it, and is held against what opened it.
 * It goes on its side of that element (below, above, or beside it: a rail's flyout), or on the other when it does not
 * fit and there is more room there; it lines up with an edge or the middle; it is kept 8px inside the screen; and it is
 * never taller than the room it has, written to a custom property its stylesheet caps its height with. It is placed
 * again when it or what it holds changes size, when the window is resized and when anything scrolls.
 */

/** Where the panel opens: below the anchor, above it, or beside it, after its right edge or before its left. */
export type AnchorSide = "bottom" | "top" | "right" | "left";

export interface AnchorOptions {
  /**
   * Below the anchor, above it, or beside it (right, left: a rail's flyout); the panel goes to the other side when it
   * does not fit and there is more room there.
   */
  side?: AnchorSide;
  /**
   * Which edge of the anchor the panel lines up with, or its middle: its left, middle or right below or above it, its
   * top, middle or bottom beside it. It is kept 8px inside the screen either way.
   */
  align?: "start" | "center" | "end";
  /** Pixels between the anchor and the panel. */
  offset?: number;
  /** The custom property the room on the chosen side is written to, for the panel's max-height: "--s1-popover-room". */
  room?: string;
  /** At least as wide as the anchor. */
  matchWidth?: boolean;
}

const canPop = (el: HTMLElement) => typeof el.showPopover === "function";

/**
 * Places a panel against a box once: on its side or the other, lined up, inside the screen, its room written to
 * `room`. Says which side it went to, and sets it on the panel as `data-side`.
 */
export function placePanel(panel: HTMLElement, at: DOMRect, { side = "bottom", align = "start", offset = 4, room, matchWidth = false }: AnchorOptions = {}): AnchorSide {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  if (matchWidth) panel.style.minWidth = `${Math.round(at.width)}px`;
  const give = (px: number) => {
    if (room) panel.style.setProperty(room, `${Math.max(0, Math.round(px))}px`);
  };
  if (side === "right" || side === "left") {
    // Beside the anchor: as tall as the screen allows, lined up with its top, middle or bottom, on the side with room.
    give(vh - 16);
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const after = vw - at.right - offset - 8;
    const before = at.left - offset - 8;
    const here = side === "right" ? after : before;
    const there = side === "right" ? before : after;
    const went = w > here && there > here ? (side === "right" ? "left" : "right") : side;
    const x = went === "right" ? at.right + offset : at.left - offset - w;
    const y = align === "end" ? at.bottom - h : align === "center" ? at.top + (at.height - h) / 2 : at.top;
    panel.style.left = `${Math.round(Math.max(8, Math.min(x, vw - w - 8)))}px`;
    panel.style.top = `${Math.round(Math.max(8, Math.min(y, vh - h - 8)))}px`;
    panel.dataset.side = went;
    return went;
  }
  const below = vh - at.bottom - offset - 8;
  const above = at.top - offset - 8;
  // measured with the most room either side could give, so a panel capped by its room shows its own height
  give(Math.max(below, above));
  const tall = panel.offsetHeight;
  const here = side === "top" ? above : below;
  const there = side === "top" ? below : above;
  const went = tall > here && there > here ? (side === "top" ? "bottom" : "top") : side;
  give(went === "top" ? above : below);
  const w = panel.offsetWidth;
  const h = panel.offsetHeight;
  const x = align === "end" ? at.right - w : align === "center" ? at.left + (at.width - w) / 2 : at.left;
  panel.style.left = `${Math.round(Math.max(8, Math.min(x, vw - w - 8)))}px`;
  panel.style.top = `${Math.round(Math.max(8, went === "top" ? at.top - offset - h : at.bottom + offset))}px`;
  panel.dataset.side = went;
  return went;
}

/**
 * Holds a panel against its anchor while it is open: shows it in the top layer where the browser has one, places it,
 * and places it again when it or what it holds grows or shrinks (a list that filters, a section that unfolds, a
 * picture that arrives), when the window is resized and when anything scrolls. Call it once the panel is in the page
 * and no longer hidden; it returns the function that lets go and takes the panel out of the top layer.
 */
export function anchorPanel(panel: HTMLElement, anchor: () => Element | null | undefined, options: AnchorOptions = {}): () => void {
  if (canPop(panel) && !panel.matches(":popover-open")) panel.showPopover();
  const again = () => {
    const at = anchor()?.getBoundingClientRect();
    if (at) placePanel(panel, at, options);
  };
  again();
  const grows = typeof ResizeObserver === "function" ? new ResizeObserver(() => again()) : null;
  grows?.observe(panel);
  const changes = typeof MutationObserver === "function" ? new MutationObserver(() => again()) : null;
  changes?.observe(panel, { childList: true, subtree: true, characterData: true });
  window.addEventListener("resize", again);
  window.addEventListener("scroll", again, true);
  return () => {
    grows?.disconnect();
    changes?.disconnect();
    window.removeEventListener("resize", again);
    window.removeEventListener("scroll", again, true);
    if (canPop(panel) && panel.matches(":popover-open")) panel.hidePopover();
  };
}
