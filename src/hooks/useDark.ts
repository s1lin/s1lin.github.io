import { useSyncExternalStore } from "react";

const DARK = "(prefers-color-scheme: dark)";

/* Paper or night. The choice lives on <html data-theme>, which an inline
   script in index.html restores before first paint. */
function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DARK);
  const mo = new MutationObserver(onChange);
  mq.addEventListener("change", onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    mq.removeEventListener("change", onChange);
    mo.disconnect();
  };
}

function isDark() {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : window.matchMedia(DARK).matches;
}

/** True when the issue is printed on night paper; false on the server. */
export function useDark() {
  return useSyncExternalStore(subscribe, isDark, () => false);
}
