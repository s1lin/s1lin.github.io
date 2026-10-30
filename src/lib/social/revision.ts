/*
 * The revision thread of the comment composer ("Revise with Aha"): a short chat with Aha about one draft. Pure state,
 * no React and no window, so `node --test` covers it. The component asks, the effect calls the API, and the answers
 * come back here.
 */
import { SocialError, type Tone } from "./client.ts";

/** What the reader asked Aha for: a quick tone, or something said in their own words. */
export type Ask = { kind: "tone"; tone: Tone } | { kind: "say"; text: string };

/** Why a turn failed, in the kinds the composer explains (each with its own fix). */
export interface TurnError {
  kind: "nokey" | "rate" | "refused" | "failed" | "offline" | "auth";
  reason?: string;
}

export interface Turn {
  id: number;
  ask: Ask;
  /** The text Aha was asked to revise: the draft, or the latest suggestion for a follow-up. */
  input: string;
  state: "waiting" | "done" | "error";
  text?: string;
  model?: string;
  error?: TurnError;
}

export interface RevState {
  open: boolean;
  turns: Turn[];
  seq: number;
  /** The draft as the thread last saw it; a different draft means the reader typed since. */
  seen: string | null;
  /** What the next follow-up starts from while the draft is unchanged: the latest answer, or the one put in the box. */
  pin: string | null;
  /** The draft from before "Use this", for Undo, and the text that replaced it. */
  undo: { before: string; applied: string } | null;
}

/** Kept in memory per composer; the thread shows the last SHOWN_TURNS and folds the rest. */
export const MAX_TURNS = 20;
export const SHOWN_TURNS = 6;

export const initialRevision: RevState = { open: false, turns: [], seq: 0, seen: null, pin: null, undo: null };

export type RevAction =
  | { type: "ask"; ask: Ask; draft: string }
  | { type: "again"; draft: string }
  | { type: "answer"; id: number; text: string; model: string }
  | { type: "fail"; id: number; error: TurnError }
  | { type: "abort"; id: number }
  | { type: "use"; id: number; draft: string }
  | { type: "undo" }
  | { type: "close" }
  | { type: "posted" };

export const waitingTurn = (s: RevState): Turn | undefined => s.turns.find((t) => t.state === "waiting");

/**
 * What a new request revises. If the reader has typed in the box since the thread last looked, their draft; otherwise
 * the latest suggestion (a follow-up builds on it, as in a chat), or the draft when there is none yet.
 */
export function baseFor(s: RevState, draft: string): string {
  if (s.seen === null || draft !== s.seen) return draft;
  return s.pin ?? draft;
}

function push(s: RevState, ask: Ask, input: string, draft: string): RevState {
  if (waitingTurn(s) || !input.trim()) return s;
  const id = s.seq + 1;
  const turns = [...s.turns, { id, ask, input, state: "waiting" as const }].slice(-MAX_TURNS);
  // A fresh start from what the reader typed: the old answers no longer lead anywhere.
  const pin = draft !== s.seen ? null : s.pin;
  return { ...s, open: true, seq: id, turns, seen: draft, pin };
}

export function revisionReducer(s: RevState, a: RevAction): RevState {
  switch (a.type) {
    case "ask":
      return push(s, a.ask, baseFor(s, a.draft), a.draft);
    case "again": {
      // Repeat the last request on the same text it had.
      const last = s.turns.at(-1);
      if (!last || waitingTurn(s)) return s;
      return push({ ...s, seen: a.draft }, last.ask, last.input, a.draft);
    }
    case "answer": {
      const t = s.turns.find((x) => x.id === a.id);
      if (!t || t.state !== "waiting") return s;
      return { ...s, pin: a.text, turns: s.turns.map((x) => (x.id === a.id ? { ...x, state: "done" as const, text: a.text, model: a.model } : x)) };
    }
    case "fail": {
      const t = s.turns.find((x) => x.id === a.id);
      if (!t || t.state !== "waiting") return s;
      return { ...s, turns: s.turns.map((x) => (x.id === a.id ? { ...x, state: "error" as const, error: a.error } : x)) };
    }
    case "abort":
      // A stopped request leaves no trace: the reader can ask again.
      return { ...s, turns: s.turns.filter((x) => !(x.id === a.id && x.state === "waiting")) };
    case "use": {
      const t = s.turns.find((x) => x.id === a.id);
      if (!t || t.state !== "done" || t.text === undefined) return s;
      // Undo goes back to the draft from before the first "Use this", however many times Aha's text is used.
      const before = s.undo ? s.undo.before : a.draft;
      return { ...s, seen: t.text, pin: t.text, undo: { before, applied: t.text } };
    }
    case "undo":
      return { ...s, undo: null, seen: null, pin: null };
    case "close":
      return { ...s, open: false, turns: [], seen: null, pin: null };
    case "posted":
      return initialRevision;
  }
}

/** A failed revision as what the composer tells the reader; null when the reader stopped it. */
export function turnError(e: unknown): TurnError | null {
  if (!(e instanceof SocialError)) return { kind: "failed" };
  switch (e.kind) {
    case "aborted":
      return null;
    case "auth":
      return { kind: "auth" };
    case "rate":
      return { kind: "rate" };
    case "network":
      return { kind: "offline" };
    case "refused":
    case "invalid":
      return e.code === "no_key" ? { kind: "nokey" } : { kind: "refused", reason: e.reason };
    default:
      return { kind: "failed" };
  }
}

/** The number in the box, in the reader's language: "1,240 / 2,000". */
export function countLabel(n: number, max: number, lang: "en" | "zh" | "ja"): string {
  const f = new Intl.NumberFormat(lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : "en");
  return `${f.format(n)} / ${f.format(max)}`;
}
