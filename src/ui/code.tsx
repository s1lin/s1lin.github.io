"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "./cn";
import { Copy } from "./copy";
import { useOverflow } from "./use-overflow";
import { useS1Words } from "./words";
import "./tokens.css";
import "./code.css";

type Props = {
  /** The code, as text. */
  children: string;
  /** A block of its own, scrolling sideways inside its frame when a line is long; inline by default. */
  block?: boolean;
  /** A Copy button in the block's bar. */
  copy?: boolean;
  /** The block's bar: "curl", "Python". It also names the Copy button. */
  label?: ReactNode;
  className?: string;
};

/**
 * Code in mono: inline in a sentence (a model id, a header), or a block with a
 * bar for its name and Copy (a request to try). No colours: the one ink. A
 * long line scrolls inside the block, which takes focus then, so a keyboard
 * can scroll it.
 */
export function Code({ children, block = false, copy = false, label, className }: Props) {
  const pre = useRef<HTMLPreElement>(null);
  const over = useOverflow(pre);
  const w = useS1Words();
  if (!block) return <code className={cn("s1-code", className)}>{children}</code>;
  const name = typeof label === "string" ? label : undefined;
  return (
    <div className={cn("s1-code-block", className)}>
      {(label || copy) && (
        <div className="s1-code-block__bar">
          <span className="s1-code-block__label">{label}</span>
          {copy && <Copy value={children} label={name === undefined ? w.copyCode : w.copyName(name)} />}
        </div>
      )}
      <pre
        className="s1-code-block__pre"
        ref={pre}
        tabIndex={over ? 0 : undefined}
        role={over ? "region" : undefined}
        aria-label={over ? (name ?? w.code) : undefined}
        data-overflow={over ? "" : undefined}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}
