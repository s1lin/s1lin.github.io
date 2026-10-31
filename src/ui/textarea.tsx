"use client";

import type { Ref, TextareaHTMLAttributes } from "react";
import { cn } from "./cn";
import { useField } from "./field";
import "./tokens.css";
import "./textarea.css";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Grow with what is typed, from `rows` lines up to `maxRows`, where the browser can (field-sizing); else it is dragged taller. */
  grow?: boolean;
  /** The most lines it grows to before it scrolls. */
  maxRows?: number;
  /** In error without a Field around it. */
  invalid?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
};

/**
 * Lines of text: a native <textarea> in the Input's box, four lines tall,
 * dragged taller or growing as it fills. In a Field it takes the label, hint
 * and error from it.
 */
export function Textarea({ grow = false, rows = 4, maxRows = 12, invalid, className, id, required, disabled, style, ref, ...rest }: TextareaProps) {
  const field = useField({ id, required, disabled, invalid, "aria-describedby": rest["aria-describedby"], "aria-invalid": rest["aria-invalid"] });
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn("s1-textarea", grow && "s1-textarea--grow", className)}
      style={grow ? { ["--s1-rows" as string]: rows, ["--s1-max-rows" as string]: maxRows, ...style } : style}
      {...rest}
      {...field}
    />
  );
}
