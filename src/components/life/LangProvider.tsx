import { useEffect, useMemo, useState, type ReactNode } from "react";
import { COPY, type Lang } from "@/components/life/copy";
import { HTML_LANG, LangContext, initialLang } from "@/components/life/lang";

/** Holds the page's language, keeps <html lang> and the saved choice in step with it. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
    try {
      localStorage.setItem("life-lang", lang);
    } catch {
      /* private mode: the choice lasts until reload */
    }
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang, copy: COPY[lang] }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
