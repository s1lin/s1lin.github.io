import { useEffect, useState, type RefObject } from "react";

/**
 * How many CSS pixels one unit of a drawing `width` units wide comes to, once it
 * is laid out, so its words can be set at a size that holds at any width.
 * Starts at 1, so the prerendered HTML and the first client render agree.
 */
export function useScale(ref: RefObject<Element | null>, width: number) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("ResizeObserver" in window)) return;
    const ro = new ResizeObserver(() => setScale(el.getBoundingClientRect().width / width || 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, width]);
  return scale;
}
