"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "./cn";
import { useField } from "./field";
import "./tokens.css";
import "./input.css";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> & {
  /** "md" is 40px tall, as a Button; "sm" 30px, as a small one. */
  size?: "md" | "sm";
  /** Before the text, inside the box: a currency, a scheme. Words are read with the field. */
  prefix?: ReactNode;
  /** After the text, inside the box: a unit, or a small Button. Words are read with the field. */
  suffix?: ReactNode;
  /** In error without a Field around it. */
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
};

const isText = (n: ReactNode) => typeof n === "string" || typeof n === "number";

/**
 * A text box: a native <input> of any text type (text, number, search,
 * password, email, url), in a hairline box, with words or a button inside it
 * before or after. In a Field it takes the label, hint and error from it.
 * `className` goes to the box; every other prop to the <input>.
 */
export function Input({ size = "md", prefix, suffix, invalid, className, id, required, disabled, type = "text", ref, ...rest }: InputProps) {
  const auto = useId();
  const prefixId = prefix != null && isText(prefix) ? `${auto}-prefix` : undefined;
  const suffixId = suffix != null && isText(suffix) ? `${auto}-suffix` : undefined;
  const field = useField({ id, required, disabled, invalid, "aria-describedby": rest["aria-describedby"], "aria-invalid": rest["aria-invalid"] });
  const describedBy = [prefixId, suffixId, field["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  return (
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
}
