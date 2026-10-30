import { createContext, useContext } from "react";
import { COPY, type Copy, type Lang } from "@/components/life/copy";

export interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  copy: Copy;
}

export const LangContext = createContext<LangState>({ lang: "en", setLang: () => {}, copy: COPY.en });

export const useLang = () => useContext(LangContext);
export const useCopy = () => useContext(LangContext).copy;

/** The language to open in: ?lang=, then the saved choice, then the browser's, else English. */
export function initialLang(): Lang {
  const ok = (v: string | null): v is Lang => v === "en" || v === "zh" || v === "ja";
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (ok(q)) return q;
    const s = localStorage.getItem("life-lang");
    if (ok(s)) return s;
  } catch {
    /* private mode: no saved choice */
  }
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("zh") ? "zh" : nav.startsWith("ja") ? "ja" : "en";
}

export const HTML_LANG: Record<Lang, string> = { en: "en", zh: "zh-Hans", ja: "ja" };
