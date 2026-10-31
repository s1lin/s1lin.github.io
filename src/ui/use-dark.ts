import { useSyncExternalStore } from "react";

const DARK = "(prefers-color-scheme: dark)";

/* Paper or night, read as tokens.css reads it: what the root says (data-theme,
   a "dark" or "light" class, Kumo's data-mode), else the system's scheme. On
   this site the choice lives on <html data-theme>, which an inline script in
   each page's head restores before first paint. */
function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DARK);
  const mo = new MutationObserver(onChange);
  mq.addEventListener("change", onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-mode", "class"] });
  return () => {
    mq.removeEventListener("change", onChange);
    mo.disconnect();
  };
}

function isDark() {
  const root = document.documentElement;
  const said = root.dataset.theme ?? root.dataset.mode;
  if (said === "dark" || root.classList.contains("dark")) return true;
  if (said === "light" || root.classList.contains("light")) return false;
  return window.matchMedia(DARK).matches;
}

/** True when the page is printed on night paper; false on the server. */
export function useDark() {
  return useSyncExternalStore(subscribe, isDark, () => false);
}
