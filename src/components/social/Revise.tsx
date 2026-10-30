import { useRef, useState } from "react";
import { errorText } from "@/components/social/helpers";
import type { SocialCopy } from "@/components/social/copy";
import { TONES, SocialError, loadRevisePrefs, pickModel, saveRevisePrefs, type ModelCatalog, type Revision, type Tone } from "@/lib/social/client.ts";
import { social, useSession, useSocialConfig } from "@/lib/social/useSocial";

type Pick = { keyId: number | string; model: string };

const encode = (p: Pick) => `${p.keyId}|${p.model}`;
/** Model ids hold no "|", so the last one splits the key from the model. */
const decode = (cat: ModelCatalog, v: string): Pick | null => {
  const i = v.lastIndexOf("|");
  const key = cat.keys.find((k) => String(k.id) === v.slice(0, i));
  const model = v.slice(i + 1);
  return key && key.models.includes(model) ? { keyId: key.id, model } : null;
};

/** What to tell the reader when a revision fails: the kind of failure, in plain words. */
function reviseError(e: unknown, c: SocialCopy): string {
  if (e instanceof SocialError) {
    if (e.kind === "rate") return c.reviseRate;
    if (e.kind === "refused" || e.kind === "invalid") return c.reviseRefused(e.reason ?? "");
    if (e.kind === "server") return c.reviseFailed;
  }
  return errorText(e, c);
}

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/**
 * "Revise with AI" under a comment box: the reader's own model, on their own key, rewrites the draft. It only
 * suggests: nothing is posted from here, the reader decides, and what they post is screened like any comment.
 */
export function Revise({ c, draft, setDraft, disabled }: { c: SocialCopy; draft: string; setDraft: (s: string) => void; disabled?: boolean }) {
  const { session } = useSession();
  const cfg = useSocialConfig();
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<ModelCatalog | "loading" | null>(null);
  const [sel, setSel] = useState<Pick | null>(null);
  const [tone, setTone] = useState<Tone>("polish");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sug, setSug] = useState<(Revision & { original: string }) | null>(null);
  const [applied, setApplied] = useState<{ restore: string; applied: string } | null>(null);
  const run = useRef(0);

  if (!session) return null;

  const load = async () => {
    setCat("loading");
    setErr("");
    try {
      const m = await social().models();
      const prefs = loadRevisePrefs(storage());
      setCat(m);
      setSel(pickModel(m, prefs));
      if (prefs.tone) setTone(prefs.tone);
    } catch (e) {
      setCat(null);
      setErr(reviseError(e, c));
    }
  };
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && cat === null) void load();
  };
  const remember = (p: Pick | null, t: Tone) => saveRevisePrefs(storage(), { keyId: p?.keyId, model: p?.model, tone: t });

  const revise = async () => {
    const original = draft;
    if (!original.trim() || !sel || busy) return;
    const mine = ++run.current;
    setBusy(true);
    setErr("");
    setApplied(null);
    try {
      const r = await social().revise({ text: original.trim(), keyId: sel.keyId, model: sel.model, tone });
      if (mine === run.current) setSug({ ...r, original });
    } catch (e) {
      if (mine === run.current) setErr(reviseError(e, c));
    } finally {
      if (mine === run.current) setBusy(false);
    }
  };
  const use = () => {
    if (!sug) return;
    setApplied({ restore: draft, applied: sug.text });
    setDraft(sug.text);
    setSug(null);
  };
  const undo = () => {
    if (!applied) return;
    setDraft(applied.restore);
    setApplied(null);
  };

  const showSug = sug !== null && sug.original === draft;
  const showApplied = applied !== null && applied.applied === draft;
  const empty = cat !== null && cat !== "loading" && cat.keys.length === 0;

  return (
    <div className="soc__revise">
      <div className="soc__row">
        <button type="button" className="soc__btn" aria-expanded={open} onClick={toggle}>
          {open ? c.reviseHide : c.revise}
        </button>
        {showApplied && (
          <>
            <span className="soc__note soc__note--ok" role="status">
              {c.reviseApplied}
            </span>
            <button type="button" className="soc__link" onClick={undo}>
              {c.reviseUndo}
            </button>
          </>
        )}
      </div>
      {open && (
        <div className="soc__revpanel" aria-busy={busy}>
          <p className="soc__small">{c.reviseNote}</p>
          {cat === "loading" && <p className="soc__note">{c.reviseLoadingModels}</p>}
          {empty && (
            <p className="soc__note">
              {c.reviseNoKey}{" "}
              <a className="soc__link" href={cfg?.signInUrl ?? "https://tokensbeat.com/?aff=EL8RSC36GVWT"} target="_blank" rel="noopener">
                {c.reviseNoKeyLink}
              </a>
            </p>
          )}
          {cat !== null && cat !== "loading" && !empty && (
            <div className="soc__revrow">
              <label className="soc__field">
                {c.reviseModel}
                <select
                  value={sel ? encode(sel) : ""}
                  onChange={(e) => {
                    const p = decode(cat, e.target.value);
                    setSel(p);
                    remember(p, tone);
                  }}
                  disabled={busy}
                >
                  {cat.keys.map((k) => (
                    <optgroup key={k.id} label={k.name}>
                      {k.models.map((m) => (
                        <option key={m} value={encode({ keyId: k.id, model: m })}>
                          {m}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="soc__field">
                {c.reviseTone}
                <select
                  value={tone}
                  onChange={(e) => {
                    const t = TONES.find((x) => x === e.target.value) ?? "polish";
                    setTone(t);
                    remember(sel, t);
                  }}
                  disabled={busy}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {c.tones[t]}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="soc__btn soc__btn--go" onClick={revise} disabled={busy || disabled || !draft.trim() || !sel}>
                {busy ? (
                  <>
                    <span className="soc__spin" aria-hidden="true" />
                    {c.revising}
                  </>
                ) : (
                  c.reviseGo
                )}
              </button>
            </div>
          )}
          {err && (
            <p className="soc__note soc__note--bad" role="alert">
              {err}{" "}
              {cat === null && (
                <button type="button" className="soc__link" onClick={load}>
                  {c.retry}
                </button>
              )}
            </p>
          )}
          {showSug && sug && (
            <div className="soc__compare">
              <figure>
                <figcaption>{c.reviseYours}</figcaption>
                {/* Plain text only, as typed and as the model returned it. */}
                <p className="soc__text">{sug.original}</p>
              </figure>
              <figure className="soc__compare--new">
                <figcaption>{c.reviseSuggestion(sug.model)}</figcaption>
                <p className="soc__text">{sug.text}</p>
              </figure>
              <div className="soc__row soc__compare-actions">
                <button type="button" className="soc__btn soc__btn--go" onClick={use}>
                  {c.reviseUse}
                </button>
                <button type="button" className="soc__btn" onClick={revise} disabled={busy}>
                  {c.reviseAgain}
                </button>
                <button type="button" className="soc__btn" onClick={() => setSug(null)}>
                  {c.reviseDiscard}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
