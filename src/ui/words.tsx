"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * Every word the parts print or say for themselves, in English. A part takes
 * its words from here unless its own prop gives one; an app translates the lot
 * once, with <S1Words> around it, and gives a prop only where one place needs
 * other words. The few that take a number or a name are functions.
 */
export interface S1WordMap {
  /** Copy's word, and its words after a copy and after a refusal. */
  copy: string;
  copied: string;
  copyFailed: string;
  /** What a screen reader hears after a copy, and after a refusal. */
  copiedMessage: string;
  copyFailedMessage: string;
  /** The name of a Copy button for a named thing: Code's "Copy curl", Secret's "Copy API key". */
  copyName: (name: string) => string;
  /** Code: the Copy button's name in a block with no label, and the block's name while it scrolls. */
  copyCode: string;
  code: string;
  /** Dialog: the close button's name. */
  close: string;
  /** Notice and Toast: the close button's name. */
  dismiss: string;
  /** Toaster: the region's name. */
  notifications: string;
  /** Notice and Toast: the status word a screen reader hears first; the shape says it on screen. */
  statusInfo: string;
  statusOk: string;
  statusWarn: string;
  statusBad: string;
  /** Stat: the trend a screen reader hears before the change. */
  trendUp: string;
  trendDown: string;
  trendFlat: string;
  /** Pagination: the navigation's name, the two steps, a page's name, and the page of all in a narrow box. */
  pagination: string;
  previous: string;
  next: string;
  page: (n: number) => string;
  pageOf: (n: number, count: number) => string;
  /** Secret: its name when it is given none, the two buttons, and what a screen reader hears while it is hidden. */
  secret: string;
  show: string;
  hide: string;
  hidden: string;
  /** Menu: the three-dots button's name when it is given none. */
  moreActions: string;
  /** Spinner's status, and Table's while it loads. */
  loading: string;
  /** Table: the hint under a table that scrolls, the sort button's state, the empty row, the actions column's name. */
  scrollHint: string;
  sortAscending: string;
  sortDescending: string;
  sortNone: string;
  empty: string;
  actions: string;
  /** Table with collapsible groups: the button above it. */
  expandAll: string;
  collapseAll: string;
}

/** The words in English: what every part says with no <S1Words> around it. */
export const S1_WORDS: S1WordMap = {
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Failed",
  copiedMessage: "Copied to the clipboard",
  copyFailedMessage: "Could not copy: select the text and copy it",
  copyName: (name) => `Copy ${name}`,
  copyCode: "Copy code",
  code: "Code",
  close: "Close",
  dismiss: "Dismiss",
  notifications: "Notifications",
  statusInfo: "Note: ",
  statusOk: "Done: ",
  statusWarn: "Warning: ",
  statusBad: "Error: ",
  trendUp: "Up",
  trendDown: "Down",
  trendFlat: "No change",
  pagination: "Pagination",
  previous: "Previous",
  next: "Next",
  page: (n) => `Page ${n}`,
  pageOf: (n, count) => `Page ${n} of ${count}`,
  secret: "Secret",
  show: "Show",
  hide: "Hide",
  hidden: "hidden",
  moreActions: "More actions",
  loading: "Loading",
  scrollHint: "Scroll sideways for more",
  sortAscending: "sorted ascending",
  sortDescending: "sorted descending",
  sortNone: "sort",
  empty: "Nothing here yet.",
  actions: "Actions",
  expandAll: "Expand all",
  collapseAll: "Collapse all",
};

const Words = createContext<S1WordMap>(S1_WORDS);

/**
 * The parts' words for everything inside: give the ones you translate, and
 * the rest stay as they are around it (English at the top). Put it inside
 * whatever holds your language, so a switch gives the parts new words.
 */
export function S1Words({ words, children }: { words: Partial<S1WordMap>; children?: ReactNode }) {
  const outer = useContext(Words);
  const value = useMemo(() => {
    const given = Object.fromEntries(Object.entries(words).filter(([, w]) => w !== undefined)) as Partial<S1WordMap>;
    return { ...outer, ...given };
  }, [outer, words]);
  return <Words.Provider value={value}>{children}</Words.Provider>;
}

/** The parts' words here: the nearest <S1Words>, over the English. */
export function useS1Words(): S1WordMap {
  return useContext(Words);
}
