import { useId, type FieldsetHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";
import { Fieldset } from "./field";
import "./tokens.css";
import "./radio-group.css";

export interface RadioOption {
  value: string;
  label: ReactNode;
  /** A line under the label, read as the option's description. */
  hint?: ReactNode;
  disabled?: boolean;
}

export type RadioGroupProps = Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "children" | "defaultValue" | "onChange"> & {
  /** What the choice is, as the group's legend. */
  legend: ReactNode;
  options: RadioOption[];
  /** The chosen value, when the group is controlled. */
  value?: string;
  /** The value chosen at first, when it is not. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** The radios' name in a form; one is made up if not given. */
  name?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** "list", radios down the page; "cards", a tile each (amounts, plans); "segmented", one joined row of short words (24h · 7d · 30d). */
  variant?: "list" | "cards" | "segmented";
  /** "horizontal" sets a list's radios in a row that wraps. */
  orientation?: "vertical" | "horizontal";
};

/**
 * One choice of a few: native radios with one name, in a fieldset that is the
 * radiogroup, so Tab enters at the chosen one and the arrow keys move and
 * choose, as browsers do. As a list, as cards to pick an amount or a plan, or
 * as a segmented row for a range.
 */
export function RadioGroup({
  legend,
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  hint,
  error,
  required,
  variant = "list",
  orientation = "vertical",
  className,
  ...rest
}: RadioGroupProps) {
  const auto = useId();
  const group = name ?? auto;
  return (
    <Fieldset
      legend={legend}
      hint={hint}
      error={error}
      required={required}
      role="radiogroup"
      aria-required={required || undefined}
      aria-invalid={error ? true : undefined}
      className={cn("s1-radios", `s1-radios--${variant}`, orientation === "horizontal" && "s1-radios--row", className)}
      {...rest}
    >
      {options.map((o, i) => {
        const labelId = `${auto}-${i}-label`;
        const hintId = o.hint ? `${auto}-${i}-hint` : undefined;
        return (
          <label key={o.value} className={cn("s1-radio", o.disabled && "s1-radio--disabled")}>
            <span className="s1-radio__control">
              <input
                type="radio"
                className="s1-radio__input"
                name={group}
                value={o.value}
                checked={value === undefined ? undefined : value === o.value}
                defaultChecked={value === undefined && defaultValue !== undefined ? defaultValue === o.value : undefined}
                onChange={() => onValueChange?.(o.value)}
                disabled={o.disabled}
                required={required}
                aria-labelledby={labelId}
                aria-describedby={hintId}
              />
              <span className="s1-radio__dot" aria-hidden="true" />
            </span>
            <span className="s1-radio__text">
              <span className="s1-radio__label" id={labelId}>
                {o.label}
              </span>
              {o.hint && (
                <span className="s1-radio__hint" id={hintId}>
                  {o.hint}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </Fieldset>
  );
}
