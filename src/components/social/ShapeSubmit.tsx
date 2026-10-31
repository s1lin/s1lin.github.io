import { useMemo, useState } from "react";
import { Board } from "@/components/life/Board";
import { SignInBar } from "@/components/social/common";
import { errorText } from "@/components/social/helpers";
import { SOCIAL_COPY } from "@/components/social/copy";
import type { Lang } from "@/components/life/copy";
import type { Grid } from "@/lib/life/life";
import { ARC } from "@/lib/life/palette";
import { MAX_SHAPE } from "@/lib/social/client.ts";
import { cropShape } from "@/lib/social/shape.ts";
import { social, useSession } from "@/lib/social/useSocial";
import { Button } from "@/ui/button";

type Outcome = { tone: "ok" | "wait" | "bad"; text: string } | null;

/** "Publish my shape" in the launch pad: the live cells, cropped, with a name and a note, sent to be screened. */
export function ShapeSubmit({ grid, lang }: { grid: Grid; lang: Lang }) {
  const c = SOCIAL_COPY[lang];
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Outcome>(null);
  // The shape is taken when the form is opened and while it stays open, from the board as it is.
  const crop = useMemo(() => (open ? cropShape(grid) : null), [open, grid]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop?.ok || busy || !title.trim() || !note.trim()) return;
    setBusy(true);
    setOut(null);
    try {
      const v = await social().submitShape({ title: title.trim(), note: note.trim(), ...crop.shape });
      if (v.status === "rejected") setOut({ tone: "bad", text: c.shapeRejected(v.reason ?? "") });
      else {
        setOut({ tone: v.status === "approved" ? "ok" : "wait", text: v.status === "approved" ? c.shapeApproved : c.shapePending });
        setTitle("");
        setNote("");
      }
    } catch (err) {
      setOut({ tone: "bad", text: errorText(err, c) });
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className="life__btn soc__publish" onClick={() => setOpen(true)}>
        {c.publish}
      </button>
    );
  }
  const preview = crop?.ok ? crop.shape : null;
  const previewGrid: Grid | null = preview ? { w: preview.w, h: preview.h, cells: Uint8Array.from(preview.cells.join(""), Number) } : null;
  return (
    <form className="soc__submit" onSubmit={send} aria-label={c.publishH}>
      <h4>{c.publishH}</h4>
      <p className="soc__small">{c.publishHint}</p>
      {crop && !crop.ok && crop.why === "empty" && <p className="soc__note soc__note--bad">{c.emptyBoard}</p>}
      {crop && !crop.ok && crop.why === "big" && <p className="soc__note soc__note--bad">{c.tooBig(crop.w ?? 0, crop.h ?? 0, MAX_SHAPE)}</p>}
      {previewGrid && preview && (
        <figure className="soc__preview">
          <Board grid={previewGrid} color={ARC.green} cell={Math.max(3, Math.min(10, Math.floor(160 / Math.max(preview.w, preview.h))))} label={c.cropInfo(preview.w, preview.h)} />
          <figcaption>{c.cropInfo(preview.w, preview.h)}</figcaption>
        </figure>
      )}
      {!session ? (
        <SignInBar c={c} />
      ) : (
        <>
          <SignInBar c={c} />
          <label className="soc__field">
            <span>{c.titleLabel}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={c.titlePlaceholder} />
          </label>
          <label className="soc__field">
            <span>{c.noteLabel}</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} placeholder={c.notePlaceholder} />
          </label>
          <div className="soc__row">
            <Button variant="go" type="submit" disabled={busy || !crop?.ok || !title.trim() || !note.trim()}>
              {busy ? c.sending : c.submitShape}
            </Button>
            <Button onClick={() => setOpen(false)}>
              {c.close}
            </Button>
          </div>
        </>
      )}
      {!session && (
        <Button onClick={() => setOpen(false)}>
          {c.close}
        </Button>
      )}
      {out && (
        <p className={`soc__note soc__note--${out.tone}`} role="status">
          {out.text}
        </p>
      )}
    </form>
  );
}
