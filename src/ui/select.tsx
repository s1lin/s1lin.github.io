import type { Ref, SelectHTMLAttributes } from "react";
import { cn } from "./cn";
import { useField } from "./field";
import "./tokens.css";
import "./select.css";

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  /** "md" is 40px tall, "sm" 30px, as Input. */
  size?: "md" | "sm";
  /** A first option with no value, shown until one is chosen: "Choose a model". */
  placeholder?: string;
  /** In error without a Field around it. */
  invalid?: boolean;
  ref?: Ref<HTMLSelectElement>;
};

/**
 * A choice from a list: the native <select>, so the phone's own picker and
 * every keyboard and screen reader work as they always do, drawn in the
 * Input's box with a chevron. Options are its children. In a Field it takes
 * the label, hint and error from it.
 */
export function Select({ size = "md", placeholder, invalid, className, id, required, disabled, children, ref, ...rest }: SelectProps) {
  const field = useField({ id, required, disabled, invalid, "aria-describedby": rest["aria-describedby"], "aria-invalid": rest["aria-invalid"] });
  const blank = placeholder !== undefined && !rest.multiple;
  // With a placeholder and no value given, the placeholder is what shows first.
  const defaultValue = blank && rest.value === undefined && rest.defaultValue === undefined ? "" : rest.defaultValue;
  return (
    <span
      className={cn("s1-select", `s1-select--${size}`, rest.multiple && "s1-select--multiple", className)}
      data-invalid={field["aria-invalid"] ? "" : undefined}
      data-disabled={field.disabled ? "" : undefined}
    >
      <select ref={ref} className="s1-select__control" {...rest} defaultValue={defaultValue} {...field}>
        {blank && (
          <option value="" disabled={field.required}>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    </span>
  );
}
