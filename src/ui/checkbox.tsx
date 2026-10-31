"use client";

import { useCallback, useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./checkbox.css";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  /** The label, beside the box. Without it, give the box an aria-label (a row's checkbox in a table). */
  children?: ReactNode;
  /** A line under the label, read as the box's description. */
  hint?: ReactNode;
  /** Neither on nor off: some of the things it stands for are chosen. Clicking it turns it on. */
  indeterminate?: boolean;
  ref?: Ref<HTMLInputElement>;
};

/**
 * A native checkbox in a drawn box: a tick in paper on ink when on, a bar
 * when some are on. The <input> itself takes the clicks and the focus, so
 * forms, keyboards and screen readers see a checkbox; the box is its picture.
 */
export function Checkbox({ children, hint, indeterminate = false, className, ref, "aria-describedby": described, ...rest }: CheckboxProps) {
  const hintId = useId();
  const own = useRef<HTMLInputElement | null>(null);
  // Every render: a click clears it in the DOM, and the prop may still say it is.
  useEffect(() => {
    if (own.current) own.current.indeterminate = indeterminate;
  });
  const setRef = useCallback(
    (el: HTMLInputElement | null) => {
      own.current = el;
      if (typeof ref === "function") return ref(el);
      if (ref) ref.current = el;
    },
    [ref],
  );
  return (
    <span className={cn("s1-check", rest.disabled && "s1-check--disabled", className)}>
      <label className="s1-check__row">
        <span className="s1-check__control">
          <input ref={setRef} type="checkbox" className="s1-check__input" aria-describedby={[hint ? hintId : "", described ?? ""].join(" ").trim() || undefined} {...rest} />
          <span className="s1-check__box" aria-hidden="true" />
        </span>
        {children != null && <span className="s1-check__label">{children}</span>}
      </label>
      {hint && (
        <span className="s1-check__hint" id={hintId}>
          {hint}
        </span>
      )}
    </span>
  );
}
