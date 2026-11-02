import { Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Mark } from "@/ui/mark";
import { useDark } from "@/ui/use-dark";

const CJK = /[぀-ヿ㐀-鿿]/;

/**
 * Night, on or off: "夜 · " and the moon, a toggle (aria-pressed) in the kit's filled design, so on night paper it
 * sits on the chosen fill and on paper it is words that tint under the pointer. One label in both states: the fill
 * says whether night is on. Its name is 夜 and "Night".
 */
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
    <Button variant="ghost" size="sm" className="theme-toggle" aria-pressed={dark} iconEnd={<Moon />} onClick={flip}>
      <span lang="ja">夜</span>
      <span aria-hidden="true">·</span>
      <span className="visually-hidden">Night</span>
    </Button>
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
  label: initial = "特集 · Architecture — nine lines, one proof",
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
        </a>
        <p className="runhead__now" aria-live="off">
          {ja && <b lang="ja">{ja}</b>}
          {ja && "  "}
          {en}
        </p>
        <ThemeToggle />
      </div>
    </header>
  );
}
