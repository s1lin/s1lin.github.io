"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True while the element is within `margin` of the viewport. Starts false, so
 * the prerendered HTML and the first client render agree.
 */
export function useNear(ref: RefObject<Element | null>, margin = "400px") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: `${margin} 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return near;
}
