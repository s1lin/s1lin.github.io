"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * False in the prerendered HTML and during hydration, true after. For output
 * that only the browser should produce, without a hydration mismatch.
 */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
