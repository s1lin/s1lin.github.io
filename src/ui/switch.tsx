import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./switch.css";

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role" | "children"> & {
  /** The label: what the switch turns on. */
  children?: ReactNode;
  /** A line under the label, read as the switch's description. */
  hint?: ReactNode;
  /** The label first and the switch at the far end of the row, for a list of settings. */
  reverse?: boolean;
  ref?: Ref<HTMLInputElement>;
};

/**
 * On or off, taking effect at once: a native checkbox with `role="switch"`,
 * drawn as a track and a thumb (ink and to the right when on). For a choice
 * that waits for a Save, use a Checkbox.
 */
export function Switch({ children, hint, reverse = false, className, ref, "aria-describedby": described, ...rest }: SwitchProps) {
  const hintId = useId();
  return (
    <span className={cn("s1-switch", reverse && "s1-switch--reverse", rest.disabled && "s1-switch--disabled", className)}>
      <label className="s1-switch__row">
        <span className="s1-switch__control">
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            className="s1-switch__input"
            aria-describedby={[hint ? hintId : "", described ?? ""].join(" ").trim() || undefined}
            {...rest}
          />
          <span className="s1-switch__track" aria-hidden="true" />
        </span>
        {children != null && <span className="s1-switch__label">{children}</span>}
      </label>
      {hint && (
        <span className="s1-switch__hint" id={hintId}>
          {hint}
        </span>
      )}
    </span>
  );
}
