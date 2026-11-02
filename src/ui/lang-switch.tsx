"use client";

import { Fragment, type HTMLAttributes, type MouseEvent, type ReactNode, type Ref } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./lang-switch.css";

/** A language the switch offers. */
export interface LangOption {
  /** What `value` names: "en", "zh". */
  value: string;
  /** What shows, written in that language: "EN", "中文". */
  label: string;
  /** Its own name, for screen readers, where the label is short: "English". */
  name?: string;
  /** Its tag, set on the item as `lang` (and on a link as `hrefLang`): "en", "zh-CN". */
  lang: string;
  /** This page in that language: the item is then a link (through `renderLink`), else a button. */
  href?: string;
}

/** What `renderLink` is handed: spread it on your router's link, with `href` as its destination. */
export interface LangSwitchLinkProps {
  href: string;
  className: string;
  lang: string;
  hrefLang: string;
  "aria-label"?: string;
  "aria-current"?: "page";
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}

export type LangSwitchProps = Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role" | "aria-label"> & {
  /** The group's name, in the page's language: "Language", "语言". */
  label: string;
  options: LangOption[];
  /** The language in force. */
  value: string;
  /** Called with the language chosen: a button's press, or a link's click before it is followed. Never for the one in force. */
  onValueChange?: (value: string) => void;
  /** Your router's link, for the options with an `href`; a plain <a> without it. */
  renderLink?: (link: LangSwitchLinkProps) => ReactNode;
  /** 30px, a head's controls (sm, the default); 40px, a sheet or a form (md); 24px, a foot or a line of text (xs). */
  size?: "md" | "sm" | "xs";
  ref?: Ref<HTMLSpanElement>;
};

/**
 * The languages as words, with no box round them or round the group: the one
 * in force in the ink with a dot under it, the others dimmer. Buttons that
 * call `onValueChange` (a language kept in state), or links to this page in
 * each language (an option with an `href`), the current one `aria-pressed` or
 * `aria-current="page"`; each carries its own `lang`. A span, so it may
 * stand in a line of text or in a paragraph of controls.
 */
export function LangSwitch({ label, options, value, onValueChange, renderLink, size = "sm", className, ref, ...rest }: LangSwitchProps) {
  return (
    <span ref={ref} role="group" aria-label={label} className={cn("s1-lang", `s1-lang--${size}`, className)} {...rest}>
      {options.map((o) => {
        const on = o.value === value;
        const name = o.name && o.name !== o.label ? o.name : undefined;
        const choose = () => {
          if (!on) onValueChange?.(o.value);
        };
        const words = <span className="s1-lang__label">{o.label}</span>;
        if (o.href === undefined) {
          return (
            <button key={o.value} type="button" className="s1-lang__item" lang={o.lang} aria-label={name} aria-pressed={on} onClick={choose}>
              {words}
            </button>
          );
        }
        const link: LangSwitchLinkProps = { href: o.href, className: "s1-lang__item", lang: o.lang, hrefLang: o.lang, onClick: choose, children: words };
        if (name) link["aria-label"] = name;
        if (on) link["aria-current"] = "page";
        return <Fragment key={o.value}>{renderLink ? renderLink(link) : <a {...link} />}</Fragment>;
      })}
    </span>
  );
}
