import { useId, type ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./meter.css";

type Props = {
  /** What is measured: "Spend this month". */
  label: ReactNode;
  value: number;
  /** The limit. */
  max?: number;
  min?: number;
  /** The value in words, shown at the right and read by screen readers: "$41.20 of $50". By default "value / max". */
  valueText?: string;
  /** The share of the range from which the bar is hatched, as a warning. */
  warnAt?: number;
  /** A line under the bar. */
  hint?: ReactNode;
  className?: string;
};

/**
 * How much of a limit is used: a quota, a budget, a rate limit. A bar in ink
 * that turns hatched past `warnAt` and solid with a double line once the
 * limit is passed, the value in words beside its label. A meter to screen
 * readers (role="meter"), with the words as its value.
 */
export function Meter({ label, value, max = 100, min = 0, valueText, warnAt = 0.8, hint, className }: Props) {
  const id = useId();
  const span = max - min || 1;
  const share = (value - min) / span;
  const level = share > 1 ? "over" : share >= warnAt ? "warn" : "ok";
  const text = valueText ?? `${value} / ${max}`;
  const now = Math.min(max, Math.max(min, value));
  return (
    <div className={cn("s1-meter", `s1-meter--${level}`, className)} data-level={level}>
      <div className="s1-meter__top">
        <span className="s1-meter__label" id={`${id}-label`}>
          {label}
        </span>
        <span className="s1-meter__value" aria-hidden="true">
          {text}
        </span>
      </div>
      <div
        className="s1-meter__track"
        role="meter"
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={now}
        aria-valuetext={text}
      >
        <span className="s1-meter__fill" style={{ width: `${Math.min(1, Math.max(0, share)) * 100}%` }} />
      </div>
      {hint && (
        <p className="s1-meter__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}
