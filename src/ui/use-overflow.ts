"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True while an element is wider than its box: its content scrolls sideways.
 * Kept current as the box resizes or its content changes. Starts false, so
 * the prerendered HTML and the first client render agree.
 * Make the box focusable (tabIndex 0) only while it is true, so a keyboard can
 * scroll it without stopping at every box that fits.
 */
export function useOverflow(ref: RefObject<HTMLElement | null>) {
  const [over, setOver] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("ResizeObserver" in window)) return;
    const check = () => setOver(el.scrollWidth > el.clientWidth + 1);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    // new text in the same box resizes nothing: watch the content too
    const mo = new MutationObserver(check);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [ref]);
  return over;
}
