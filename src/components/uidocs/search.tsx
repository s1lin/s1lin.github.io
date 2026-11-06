import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { Search as Glass } from "lucide-react";
import { find, isChinese, type Place } from "@/components/uidocs/search-index";
import { Button } from "@/ui/button";
import { Combobox } from "@/ui/combobox";

const INPUT = "ud-search";
const FIELD = "ud-search-field";
/** Where "/" is a character being typed, or a key a control of its own uses, and not the search's. */
const TYPING =
  'input:not([type="checkbox"], [type="radio"], [type="range"], [type="button"], [type="submit"], [type="reset"], [type="color"], [type="file"]), textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="searchbox"]';

/** A result: its name and its other name, a section marked so, and what it is in a line. In Chinese, the Chinese name first. */
function Hit({ place, zh }: { place: Place; zh: boolean }) {
  const cn = place.zh ? <span lang="zh-CN">{place.zh}</span> : null;
  const first = zh && cn ? cn : place.name;
  const other = zh && cn ? place.name : cn;
  return (
    <span className="ud-hit">
      <span className="ud-hit__name">
        {first}
        {other && <span className="ud-hit__alt">{other}</span>}
        {place.kind === "section" && <span className="ud-hit__tag">{zh ? <span lang="zh-CN">章节</span> : "Section"}</span>}
      </span>
      <span className="ud-hit__line">{place.line}</span>
    </span>
  );
}

/**
 * The search over the index: the kit's Combobox, the places in the page's sections as you type, in English or in
 * Chinese. A choice scrolls there (at once under reduced motion), puts it in the address, gives its heading focus
 * and marks it for a moment; the box empties. "/" brings focus here from anywhere but a field. On a phone it is a
 * button at the end of the index's bar that opens the box over the bar.
 */
export function DocSearch() {
  const [text, setText] = useState("");
  // the phone's box, over the index's bar
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const marked = useRef<{ el: Element; timer: number } | null>(null);
  const zh = isChinese(text);
  const groups = useMemo(
    () =>
      find(text).map(({ section, places }) => ({
        key: section.id,
        label: zh ? <span lang="zh-CN">{section.zh}</span> : section.name,
        items: places,
      })),
    [text, zh],
  );

  const onPhone = () => toggle.current !== null && toggle.current.offsetParent !== null;
  function show() {
    if (onPhone()) flushSync(() => setOpen(true));
    const box = document.getElementById(INPUT);
    if (!box) return;
    // held in sight under the running head, it needs no scroll (a phone's would move the page to put it mid-screen)
    const at = box.getBoundingClientRect();
    box.focus({ preventScroll: at.top >= 0 && at.bottom <= innerHeight });
  }
  function hide() {
    flushSync(() => setOpen(false));
    toggle.current?.focus();
  }

  // "/" from anywhere but a field, a control that takes letters, or the phone's open index (which holds focus)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
      const at = e.target instanceof Element ? e.target : null;
      if (at && (at.closest(TYPING) || (at instanceof HTMLElement && at.isContentEditable))) return;
      if (document.querySelector(".ud-nav[data-open], dialog:modal")) return;
      e.preventDefault();
      show();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => () => window.clearTimeout(marked.current?.timer), []);

  function arrive(place: Place) {
    const target = document.getElementById(place.id);
    if (!target) return;
    const heading = document.getElementById(place.heading) ?? target;
    // focus first, so the box gives it up while it is still shown and a screen reader starts at the heading
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
    setOpen(false);
    if (location.hash !== `#${place.id}`) history.pushState(null, "", `#${place.id}`);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: still ? "instant" : "smooth", block: "start" });
    const mark = heading.closest("header, tr") ?? heading;
    if (marked.current) {
      window.clearTimeout(marked.current.timer);
      marked.current.el.removeAttribute("data-found");
    }
    mark.setAttribute("data-found", "");
    marked.current = { el: mark, timer: window.setTimeout(() => mark.removeAttribute("data-found"), 2400) };
  }

  return (
    <div
      className="ud-search"
      role="search"
      aria-label="The parts and sections"
      data-open={open ? "" : undefined}
      onKeyDown={(e: ReactKeyboardEvent) => {
        // an Esc the box did not use closes the phone's box
        if (e.key === "Escape" && open && !e.defaultPrevented) hide();
      }}
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Button ref={toggle} variant="ghost" className="ud-search__open" icon={<Glass />} aria-label="Search the parts" aria-expanded={open} aria-controls={FIELD} onClick={show} />
      <div className="ud-search__field" id={FIELD}>
        <Combobox
          id={INPUT}
          className="ud-search__box"
          listClassName="ud-search__list"
          aria-label="Search the parts and sections"
          aria-keyshortcuts="/"
          placeholder="Search the parts"
          enterKeyHint="go"
          spellCheck={false}
          autoCapitalize="none"
          groups={groups}
          value={null}
          clearOnChoose
          showButton={false}
          onValueChange={(place) => {
            if (place) arrive(place);
          }}
          onInputChange={setText}
          itemText={(p) => p.name}
          itemKey={(p) => p.id}
          renderItem={(p) => <Hit place={p} zh={zh} />}
          empty={text.trim() === "" ? undefined : zh ? <span lang="zh-CN">没有匹配的部件或章节</span> : "Nothing matches"}
          prefix={<Glass className="ud-search__glass" aria-hidden="true" />}
          suffix={
            <kbd className="ud-search__key" aria-hidden="true">
              /
            </kbd>
          }
        />
        <Button variant="ghost" size="sm" className="ud-search__close" onClick={hide}>
          Close
        </Button>
      </div>
    </div>
  );
}
