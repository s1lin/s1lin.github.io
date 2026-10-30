import { useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { Icon } from "@/components/social/common";
import { errorText, signInText } from "@/components/social/helpers";
import type { SocialCopy } from "@/components/social/copy";
import type { Lang } from "@/components/life/copy";
import { CONSOLE_KEYS_URL, MAX_COMMENT, MAX_INSTRUCTION, TONES, loadRevisePrefs, pickModel, saveRevisePrefs, type ModelCatalog } from "@/lib/social/client.ts";
import { SHOWN_TURNS, baseFor, countLabel, initialRevision, revisionReducer, turnError, waitingTurn, type Ask, type RevAction, type Turn } from "@/lib/social/revision.ts";
import { forgetSession, social, useModels, useSession, useSocialConfig, type ModelsState } from "@/lib/social/useSocial";

type Choice = { keyId: number | string; model: string };
type Outcome = { tone: "ok" | "wait" | "bad"; text: string } | null;

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};
// Sizing the box before paint, in the browser only (the blog is prerendered on the server).
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;
const MAX_ROWS = 14;

/**
 * The model chip in the composer's toolbar: the model "Revise with Aha" uses, and a popover of the reader's own
 * models, by key. No key yet: a link to add one.
 */
function ModelChip({ c, models, choice, onPick, reload }: { c: SocialCopy; models: ModelsState; choice: Choice | null; onPick: (p: Choice) => void; reload: () => void }) {
  const [open, setOpen] = useState(false);
  // Up from the toolbar, like Aha's composer, unless the box sits too near the top of the window.
  const [down, setDown] = useState(false);
  const chip = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const box = pop.current;
    (box?.querySelector<HTMLButtonElement>('[aria-selected="true"]') ?? box?.querySelector<HTMLButtonElement>('[role="option"]'))?.focus();
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!pop.current?.contains(t) && !chip.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  if (models.state === "loading") {
    return (
      <span className="soc__chip soc__chip--model is-quiet">
        <Icon name="half" size={14} />
        {c.modelsLoading}
      </span>
    );
  }
  if (models.state === "error") {
    return (
      <button type="button" className="soc__chip soc__chip--model" onClick={reload}>
        <Icon name="half" size={14} />
        {c.modelsError}
      </button>
    );
  }
  const cat = models.cat;
  if (!choice || cat.keys.length === 0) {
    return (
      <a className="soc__chip soc__chip--model soc__chip--add" href={CONSOLE_KEYS_URL} target="_blank" rel="noopener">
        <Icon name="half" size={14} />
        {c.addModel} ↗
      </a>
    );
  }

  const close = () => {
    setOpen(false);
    chip.current?.focus();
  };
  const keys = (e: React.KeyboardEvent) => {
    const opts = [...(pop.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])];
    const i = opts.indexOf(document.activeElement as HTMLButtonElement);
    const go = (n: number) => {
      e.preventDefault();
      opts[(n + opts.length) % opts.length]?.focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(opts.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") setOpen(false);
  };
  const many = cat.keys.length > 1;
  const toggle = () => {
    const r = chip.current?.getBoundingClientRect();
    if (r) setDown(r.top < 380 && window.innerHeight - r.bottom > r.top);
    setOpen((o) => !o);
  };

  return (
    <span className="soc__chipwrap">
      <button
        ref={chip}
        type="button"
        className="soc__chip soc__chip--model"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={c.modelChip(choice.model)}
        onClick={toggle}
        onKeyDown={(e) => {
          if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <Icon name="half" size={14} />
        <span className="soc__chip-label">{choice.model}</span>
        <Icon name="caret" size={14} />
      </button>
      {open && (
        <div className={`soc__pop${down ? " soc__pop--down" : ""}`} id={id} ref={pop} role="dialog" aria-label={c.modelsTitle} onKeyDown={keys}>
          <p className="soc__pop-title">{c.modelsTitle}</p>
          <p className="soc__pop-note">{c.modelsNote}</p>
          <div className="soc__pop-list" role="listbox" aria-label={c.modelsTitle}>
            {cat.keys.map((k) => (
              <div key={k.id} role="group" aria-label={k.name} className="soc__pop-group">
                {many && (
                  <p className="soc__pop-key" aria-hidden="true">
                    {k.name}
                  </p>
                )}
                {k.models.map((m) => {
                  const on = choice.keyId === k.id && choice.model === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      role="option"
                      aria-selected={on}
                      tabIndex={-1}
                      className="soc__opt"
                      onClick={() => {
                        onPick({ keyId: k.id, model: m });
                        close();
                      }}
                    >
                      <span className="soc__opt-dot" aria-hidden="true" />
                      {m}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}

/** One request and Aha's answer, as a short exchange in the thread. */
function TurnView({ t, c, last, model, inBox, waiting, onUse, onAgain, onStop }: { t: Turn; c: SocialCopy; last: boolean; model: string; inBox: boolean; waiting: boolean; onUse: () => void; onAgain: () => void; onStop: () => void }) {
  const fix = (() => {
    switch (t.error?.kind) {
      case "nokey":
        return { text: c.errNoKey, link: c.addModel };
      case "refused":
        return { text: c.errRefused(t.error?.reason ?? ""), link: c.openConsole };
      case "rate":
        return { text: c.errRate };
      case "offline":
        return { text: c.errOffline, retry: true };
      case "auth":
        return { text: c.errAuth };
      default:
        return { text: c.errFailed, retry: true };
    }
  })();
  return (
    <li className="soc__turn">
      <p className={`soc__ask${t.ask.kind === "tone" ? ` soc__tone--${t.ask.tone}` : ""}`}>
        <span className="soc__sr">{c.you}: </span>
        {t.ask.kind === "tone" ? c.tones[t.ask.tone] : `“${t.ask.text}”`}
      </p>
      <div className="soc__aha">
        <p className="soc__aha-head">
          <Icon name="sparkle" size={13} />
          {c.aha(t.model ?? model)}
        </p>
        {t.state === "waiting" && (
          <div className="soc__bubble soc__bubble--wait">
            <span className="soc__dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="soc__wait-text">{c.thinking}</span>
            <button type="button" className="soc__link" onClick={onStop}>
              {c.stop}
            </button>
          </div>
        )}
        {t.state === "done" && (
          <>
            {/* Plain text only, as the model returned it. */}
            <p className="soc__bubble soc__text">{t.text}</p>
            <div className="soc__turn-actions">
              {inBox ? (
                <span className="soc__inbox">✓ {c.inBox}</span>
              ) : (
                <button type="button" className="soc__btn soc__btn--sm soc__btn--go" onClick={onUse}>
                  {c.use}
                </button>
              )}
              {last && (
                <button type="button" className="soc__btn soc__btn--sm" onClick={onAgain} disabled={waiting}>
                  {c.again}
                </button>
              )}
            </div>
          </>
        )}
        {t.state === "error" && (
          <div className="soc__bubble soc__bubble--err" role="alert">
            <span>{fix.text}</span>
            {fix.link && (
              <a className="soc__link" href={CONSOLE_KEYS_URL} target="_blank" rel="noopener">
                {fix.link} ↗
              </a>
            )}
            {fix.retry && last && (
              <button type="button" className="soc__link" onClick={onAgain} disabled={waiting}>
                {c.again}
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * The comment composer: one box, like a chat composer. The draft, a toolbar with the model chip, "Revise with Aha"
 * and Post, and, while revising, a short thread with Aha above the draft. Aha only suggests: the draft changes when
 * the reader chooses "Use this", and nothing is posted until they press Post.
 */
export function Composer({ target, parentId, c, lang, placeholder, onDone, onCancel }: { target: string; parentId?: string; c: SocialCopy; lang: Lang; placeholder: string; onDone: () => void; onCancel?: () => void }) {
  const { session, signIn, signOut } = useSession();
  const cfg = useSocialConfig();
  const { models, reload } = useModels();
  const reply = parentId !== undefined;
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Outcome>(null);
  const [signing, setSigning] = useState(false);
  const [signErr, setSignErr] = useState("");
  const [say, setSay] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [picked, setPicked] = useState<Choice | null>(null);
  const [rev, dispatch] = useReducer(revisionReducer, initialRevision);
  const area = useRef<HTMLTextAreaElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const flights = useRef(new Map<number, AbortController>());

  // The model: the reader's pick on this page, else the one they chose last time, else the server's default.
  const cat: ModelCatalog | null = models?.state === "ready" ? models.cat : null;
  const saved = useMemo(() => (cat ? pickModel(cat, loadRevisePrefs(storage())) : null), [cat]);
  const choice = picked && cat?.keys.some((k) => k.id === picked.keyId && k.models.includes(picked.model)) ? picked : saved;

  // The box grows with the draft, from its first rows to MAX_ROWS, then scrolls.
  useBeforePaint(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    const cs = getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || 24;
    const max = line * MAX_ROWS + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [body, session]);

  // Keep the newest exchange in view.
  const last = rev.turns.at(-1);
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rev.turns.length, last?.state]);

  // Stop whatever is in flight when the composer goes away.
  useEffect(() => {
    const live = flights.current;
    return () => live.forEach((ac) => ac.abort());
  }, []);

  const pending = waitingTurn(rev);
  const ready = models?.state === "ready";
  const canAsk = ready && !pending && baseFor(rev, body).trim().length > 0;
  const over = body.length > MAX_COMMENT;

  /** Ask Aha: the turn is added, then sent on the reader's own key and model. */
  const start = (t: Turn) => {
    if (!choice) {
      dispatch({ type: "fail", id: t.id, error: { kind: "nokey" } });
      return;
    }
    const ac = new AbortController();
    flights.current.set(t.id, ac);
    const how = t.ask.kind === "tone" ? { tone: t.ask.tone } : { instruction: t.ask.text };
    social()
      .revise({ text: t.input, keyId: choice.keyId, model: choice.model, ...how }, ac.signal)
      .then(
        (r) => dispatch({ type: "answer", id: t.id, text: r.text, model: r.model }),
        (e: unknown) => {
          const err = turnError(e);
          if (err?.kind === "auth") forgetSession();
          if (err) dispatch({ type: "fail", id: t.id, error: err });
        },
      )
      .finally(() => flights.current.delete(t.id));
  };
  const run = (a: RevAction) => {
    const next = revisionReducer(rev, a);
    if (next === rev) return;
    dispatch(a);
    const t = waitingTurn(next);
    if (t) start(t);
  };
  const ask = (a: Ask) => run({ type: "ask", ask: a, draft: body });
  const again = () => run({ type: "again", draft: body });
  const stop = () => {
    if (!pending) return;
    flights.current.get(pending.id)?.abort();
    dispatch({ type: "abort", id: pending.id });
  };
  const close = () => {
    stop();
    dispatch({ type: "close" });
    setShowAll(false);
    area.current?.focus();
  };
  const use = (t: Turn) => {
    if (t.text === undefined) return;
    dispatch({ type: "use", id: t.id, draft: body });
    setBody(t.text);
    setOut(null);
    area.current?.focus();
  };
  const undo = () => {
    if (!rev.undo) return;
    setBody(rev.undo.before);
    dispatch({ type: "undo" });
    area.current?.focus();
  };
  const pick = (p: Choice) => {
    setPicked(p);
    saveRevisePrefs(storage(), { keyId: p.keyId, model: p.model });
  };

  const post = async () => {
    const text = body.trim();
    if (!text || busy || over) return;
    setBusy(true);
    setOut(null);
    try {
      const v = await social().comment(target, text, parentId);
      if (v.status === "rejected") setOut({ tone: "bad", text: c.rejectedNote(v.reason ?? "") });
      else {
        flights.current.forEach((ac) => ac.abort());
        setBody("");
        setSay("");
        dispatch({ type: "posted" });
        setOut(v.status === "approved" ? { tone: "ok", text: c.approvedNote } : { tone: "wait", text: c.pendingNote });
        onDone();
      }
    } catch (err) {
      setOut({ tone: "bad", text: errorText(err, c) });
    } finally {
      setBusy(false);
    }
  };
  const enter = async () => {
    setSigning(true);
    setSignErr("");
    try {
      await signIn();
    } catch (e) {
      setSignErr(signInText(e, c));
    } finally {
      setSigning(false);
    }
  };

  const hidden = showAll ? 0 : Math.max(0, rev.turns.length - SHOWN_TURNS);
  const shown = rev.turns.slice(hidden);
  const usedNow = rev.undo !== null && body === rev.undo.applied;

  return (
    <div
      className={`soc__compose${reply ? " soc__compose--reply" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Escape" && pending) {
          e.preventDefault();
          stop();
        }
      }}
    >
      <div className={`soc__box${session ? "" : " is-out"}${rev.open ? " is-revising" : ""}`}>
        {session && rev.open && (
          <div className="soc__rev" aria-label={c.revise}>
            {hidden > 0 && (
              <button type="button" className="soc__earlier" onClick={() => setShowAll(true)}>
                {c.earlier(hidden)}
              </button>
            )}
            <ol className="soc__turns" ref={list} aria-live="polite">
              {shown.map((t) => (
                <TurnView
                  key={t.id}
                  t={t}
                  c={c}
                  last={t.id === last?.id}
                  model={choice?.model ?? ""}
                  inBox={t.state === "done" && t.text === body && rev.undo?.applied === t.text}
                  waiting={Boolean(pending)}
                  onUse={() => use(t)}
                  onAgain={again}
                  onStop={stop}
                />
              ))}
            </ol>
            <div className="soc__asks">
              <div className="soc__chips" role="group" aria-label={c.quick}>
                {TONES.map((tone) => (
                  <button key={tone} type="button" className={`soc__tone soc__tone--${tone}`} onClick={() => ask({ kind: "tone", tone })} disabled={!canAsk}>
                    {c.tones[tone]}
                  </button>
                ))}
              </div>
              <form
                className="soc__say"
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = say.trim();
                  if (!text || !canAsk) return;
                  ask({ kind: "say", text });
                  setSay("");
                }}
              >
                <input value={say} onChange={(e) => setSay(e.target.value)} maxLength={MAX_INSTRUCTION} placeholder={c.sayPlaceholder} aria-label={c.sayLabel} />
                <button type="submit" className="soc__say-go" aria-label={c.saySend} title={c.saySend} disabled={!say.trim() || !canAsk}>
                  <Icon name="enter" />
                </button>
              </form>
              <button type="button" className="soc__x" onClick={close} aria-label={c.closeThread} title={c.closeThread}>
                <Icon name="close" />
              </button>
            </div>
          </div>
        )}

        <textarea
          ref={area}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (out?.tone !== "wait") setOut(null);
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void post();
            }
          }}
          rows={reply ? 2 : 4}
          disabled={!session}
          placeholder={session ? placeholder : c.signedOutPlaceholder}
          aria-label={session ? placeholder : c.signedOutPlaceholder}
          aria-invalid={over || undefined}
        />

        <div className="soc__bar">
          {session && models ? (
            <>
              <span className="soc__bar-start">
                <ModelChip c={c} models={models} choice={choice} onPick={pick} reload={reload} />
                <button type="button" className="soc__aha-btn" onClick={() => ask({ kind: "tone", tone: "polish" })} disabled={!ready || Boolean(pending) || !baseFor(rev, body).trim()} title={c.reviseTitle} aria-expanded={rev.open}>
                  <Icon name="sparkle" />
                  {c.revise}
                </button>
              </span>
              <span className="soc__bar-end">
                {rev.undo && (
                  <button type="button" className="soc__link" onClick={undo} title={c.undoTitle}>
                    {c.undo}
                  </button>
                )}
                <span className={`soc__len${over ? " is-over" : ""}`}>{countLabel(body.length, MAX_COMMENT, lang)}</span>
                {onCancel && (
                  <button type="button" className="soc__btn soc__btn--sm" onClick={onCancel}>
                    {c.cancel}
                  </button>
                )}
                <button type="button" className="soc__btn soc__btn--go" onClick={() => void post()} disabled={busy || !body.trim() || over}>
                  {busy ? c.sending : c.send}
                </button>
              </span>
            </>
          ) : (
            <span className="soc__bar-out">
              <a className="soc__btn soc__btn--go" href={cfg?.signInUrl ?? "https://tokensbeat.com/?aff=EL8RSC36GVWT"} target="_blank" rel="noopener">
                {c.createAccount}
              </a>
              <button type="button" className="soc__btn soc__btn--go" onClick={enter} disabled={signing}>
                {signing ? c.waitingPopup : c.signIn}
              </button>
            </span>
          )}
        </div>
      </div>

      {session && !reply && (
        <p className="soc__under">
          <span>
            {c.signedInAs(session.user.name)}
            {" · "}
            <button type="button" className="soc__link" onClick={signOut}>
              {c.signOut}
            </button>
          </span>
          <span className="soc__hint">{c.postHint}</span>
        </p>
      )}
      <div className="soc__notes" aria-live="polite">
        {over && <p className="soc__note soc__note--bad">{c.overLimit}</p>}
        {usedNow && <p className="soc__note soc__note--ok">{c.usedNote}</p>}
        {rev.open && !reply && <p className="soc__small">{c.revisionNote}</p>}
        {!reply && <p className="soc__small">{c.reviewNote}</p>}
        {out && (
          <p className={`soc__note soc__note--${out.tone}`} role="status">
            {out.text}
          </p>
        )}
        {signErr && (
          <p className="soc__note soc__note--bad" role="alert">
            {signErr}
          </p>
        )}
      </div>
    </div>
  );
}
