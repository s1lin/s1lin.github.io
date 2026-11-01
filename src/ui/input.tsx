"use client";

import { isValidElement, useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { useField } from "./field";
import "./tokens.css";
import "./input.css";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> & {
  /** "md" is 40px tall, as a Button; "sm" 30px, as a small one. */
  size?: "md" | "sm";
  /** Before the text, inside the box: a currency, a scheme. Words are read with the field. */
  prefix?: ReactNode;
  /** After the text, inside the box: a unit. Words are read with the field. A Button given here is set after the box, as `action` is. */
  suffix?: ReactNode;
  /**
   * After the box, outside it, on the same line: an action on what is typed
   * (Apply, Max, Show), a Button with its icon and word. It is drawn without
   * its line, the box's height, centred with it.
   */
  action?: ReactNode;
  /** In error without a Field around it. */
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
};

const isText = (n: ReactNode) => typeof n === "string" || typeof n === "number";
const isButton = (n: ReactNode) => isValidElement(n) && n.type === Button;

/**
 * A text box: a native <input> of any text type (text, number, search,
 * password, email, url), in a hairline box, with words inside it before or
 * after, and an action after the box, never a box in the box. In a Field it
 * takes the label, hint and error from it. `className` goes to the box; every
 * other prop to the <input>.
 */
export function Input({ size = "md", prefix, suffix: given, action: own, invalid, className, id, required, disabled, type = "text", ref, ...rest }: InputProps) {
  // A Button handed in as the suffix is the action: after the box, not inside it.
  const moved = own == null && isButton(given);
  const suffix = moved ? undefined : given;
  const action = moved ? given : own;
  const auto = useId();
  const prefixId = prefix != null && isText(prefix) ? `${auto}-prefix` : undefined;
  const suffixId = suffix != null && isText(suffix) ? `${auto}-suffix` : undefined;
  const field = useField({ id, required, disabled, invalid, "aria-describedby": rest["aria-describedby"], "aria-invalid": rest["aria-invalid"] });
  const describedBy = [prefixId, suffixId, field["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  const box = (
    <span
      className={cn("s1-input", `s1-input--${size}`, className)}
      data-invalid={field["aria-invalid"] !== undefined && field["aria-invalid"] !== false && field["aria-invalid"] !== "false" ? "" : undefined}
      data-disabled={field.disabled ? "" : undefined}
      data-readonly={rest.readOnly ? "" : undefined}
    >
      {prefix != null && (
        <span className="s1-input__affix" id={prefixId}>
          {prefix}
        </span>
      )}
      <input ref={ref} type={type} className="s1-input__control" {...rest} {...field} aria-describedby={describedBy} />
      {suffix != null && (
        <span className="s1-input__affix s1-input__affix--end" id={suffixId}>
          {suffix}
        </span>
      )}
    </span>
  );
  if (action == null) return box;
  return (
    <span className={cn("s1-input__row", `s1-input__row--${size}`)}>
      {box}
      <span className="s1-input__action">{action}</span>
    </span>
  );
}
