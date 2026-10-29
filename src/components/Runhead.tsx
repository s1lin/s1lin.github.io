import { useEffect, useState } from "react";
import { Mark } from "@/components/Mark";
import { useDark } from "@/hooks/useDark";

const CJK = /[぀-ヿ㐀-鿿]/;

function ThemeToggle() {
  const dark = useDark();
  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("s1lin-theme", next);
    } catch {
      /* private mode: the choice lasts until reload */
    }
  };
  return (
    <button className="theme-toggle" type="button" aria-label="Switch between paper and night" onClick={flip}>
      <span lang="ja">{dark ? "紙" : "夜"}</span>
    </button>
  );
}

/** The section label under the reader's eye, from the nearest [data-run]. */
function useRunningHead(initial: string) {
  const [label, setLabel] = useState(initial);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const run = (e.target as HTMLElement).dataset.run;
          if (e.isIntersecting && run) setLabel(run);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    document.querySelectorAll("[data-run]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return label;
}

/** The running head. Off the issue's page (the blog), `home` leads back to it and `label` holds still. */
export function Runhead({
  label: initial = "特集 · Architecture — five lines, one proof",
  home = "#cover",
}: {
  label?: string;
  home?: string;
}) {
  const label = useRunningHead(initial);
  const parts = label.split(" · ");
  const ja = parts.find((p) => CJK.test(p)) ?? "";
  const en = parts.filter((p) => p !== ja).join(" · ");
  return (
    <header className="runhead">
      <div className="wrap">
        <a className="runhead__brand" href={home}>
          <Mark className="runhead__mark" />
          <b>S1LIN</b>
          <span lang="ja">設計</span>
        </a>
        <p className="runhead__now" aria-live="off">
          {ja && <b lang="ja">{ja}</b>}
          {ja && "  "}
          {en}
        </p>
        <span className="runhead__vol">Vol.30 · 2026 Autumn</span>
        <ThemeToggle />
      </div>
    </header>
  );
}
