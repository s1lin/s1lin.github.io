import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "./button";
import { cn } from "./cn";
import { VisuallyHidden } from "./visually-hidden";
import "./tokens.css";
import "./copy.css";

/**
 * Put text on the clipboard: the Clipboard API where the page may use it
 * (https, localhost), else the old copy command on a hidden textarea, placed
 * in an open modal dialog when there is one (the page behind it is inert).
 * True when it worked.
 */
export async function copyText(text: string, near?: Element | null): Promise<boolean> {
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* refused or not focused: try the old way */
  }
  const box = document.createElement("textarea");
  box.value = text;
  box.setAttribute("readonly", "");
  box.setAttribute("aria-hidden", "true");
  box.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none";
  const host = near?.closest("dialog[open]") ?? document.body;
  const back = document.activeElement as HTMLElement | null;
  host.append(box);
  box.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  box.remove();
  back?.focus?.({ preventScroll: true });
  return ok;
}

type Props = {
  /** The text to copy, or a function that returns it when pressed. */
  value: string | (() => string);
  /** The button's name for screen readers: "Copy API key". It should begin with the visible word. */
  label?: string;
  /** The visible word. */
  children?: ReactNode;
  /** The word after a copy. */
  copiedText?: string;
  /** The word when the clipboard refused. */
  failedText?: string;
  /** What a screen reader hears after a copy, and after a refusal. */
  messages?: { copied: string; failed: string };
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Called after each press: true if the text is on the clipboard. */
  onCopy?: (ok: boolean) => void;
  className?: string;
};

/**
 * A button that copies a value, says "Copied" for two seconds and tells a
 * screen reader so. Where the clipboard is unavailable it falls back to the
 * copy command, and where that fails too it says so: `onCopy(false)` lets the
 * page show the text to copy by hand.
 */
export function Copy({
  value,
  label,
  children = "Copy",
  copiedText = "Copied",
  failedText = "Failed",
  messages = { copied: "Copied to the clipboard", failed: "Could not copy: select the text and copy it" },
  variant = "plain",
  size = "sm",
  onCopy,
  className,
}: Props) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const button = useRef<HTMLButtonElement>(null);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function press() {
    const ok = await copyText(typeof value === "function" ? value() : value, button.current);
    setState(ok ? "copied" : "failed");
    onCopy?.(ok);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), ok ? 2000 : 4000);
  }

  return (
    <span className={cn("s1-copy", className)} data-state={state}>
      <Button ref={button} variant={variant} size={size} aria-label={state === "idle" ? label : undefined} onClick={() => void press()}>
        {state === "copied" ? copiedText : state === "failed" ? failedText : children}
      </Button>
      <VisuallyHidden role="status">{state === "copied" ? messages.copied : state === "failed" ? messages.failed : ""}</VisuallyHidden>
    </span>
  );
}
