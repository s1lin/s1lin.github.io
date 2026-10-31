"use client";

import { useId, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./slider.css";

/** A mark under the track: a tick, and words under it if given. */
export interface SliderMark {
  value: number;
  /** Words under the tick: "Default". Read with the value when the value sits on the mark. */
  label?: ReactNode;
}

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "min" | "max" | "step" | "size" | "children"> & {
  /** What is set: "Line contrast". A <label> for the range; without one, give the slider an `aria-label`. */
  label?: ReactNode;
  /** The value, when controlled. */
  value?: number;
  /** The value at first, when not; `min` by default. */
  defaultValue?: number;
  /** Called with the new value as it moves. */
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  /** The smallest move, by an arrow key or the pointer. */
  step?: number;
  /** The value in words, shown beside the label and read by screen readers: (v) => `${v}%`. */
  format?: (value: number) => string;
  /** Ticks under the track, as numbers or { value, label }. */
  marks?: (number | SliderMark)[];
  /** Keep the value out of sight; it is still read. */
  hideValue?: boolean;
  /** A line under the track, read as the slider's description. */
  hint?: ReactNode;
  /** In error: a double line round the track, and `aria-invalid`. */
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * A number in a range, set by dragging or with the arrow keys: a native
 * <input type="range"> drawn as a hairline track filled in ink to its thumb,
 * its label and its value above, optional marks under it. The range is the
 * control, so the keyboard (← → ↑ ↓, Page Up and Down, Home and End), a form's
 * submit and every screen reader work as they always do. `className` and
 * `style` go to the wrapper; every other prop to the <input>.
 */
export function Slider({
  label,
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  format,
  marks,
  hideValue = false,
  hint,
  invalid,
  className,
  style,
  id,
  disabled,
  onChange,
  ref,
  "aria-describedby": described,
  "aria-invalid": ariaInvalid,
  "aria-valuetext": ownValueText,
  ...rest
}: SliderProps) {
  const auto = useId();
  const inputId = id ?? `${auto}-range`;
  const hintId = hint ? `${auto}-hint` : undefined;
  const [own, setOwn] = useState(() => clamp(defaultValue ?? min, min, max));
  const current = clamp(value ?? own, min, max);
  const span = max - min || 1;
  const text = format ? format(current) : String(current);
  const ticks = (marks ?? []).map((m) => (typeof m === "number" ? { value: m } : m)).filter((m) => m.value >= min && m.value <= max);
  // A mark's words say what the number alone does not ("Default"), so they are read with it.
  const named = ticks.find((m) => m.value === current && typeof m.label === "string" && m.label !== text);
  const valueText = ownValueText ?? (named ? `${text}, ${named.label}` : format ? text : undefined);
  const bad = invalid || (ariaInvalid !== undefined && ariaInvalid !== false && ariaInvalid !== "false");
  const fill = { ...style, "--s1-slider-fill": (current - min) / span } as CSSProperties;

  return (
    <div className={cn("s1-slider", disabled && "s1-slider--disabled", className)} style={fill} data-invalid={bad ? "" : undefined}>
      {(label != null || !hideValue) && (
        <div className="s1-slider__top">
          {label != null && (
            <label className="s1-slider__label" htmlFor={inputId}>
              {label}
            </label>
          )}
          {!hideValue && (
            <output className="s1-slider__value" htmlFor={inputId} aria-hidden="true">
              {text}
            </output>
          )}
        </div>
      )}
      <div className="s1-slider__rail">
        <input
          {...rest}
          ref={ref}
          type="range"
          id={inputId}
          className="s1-slider__input"
          min={min}
          max={max}
          step={step}
          value={current}
          disabled={disabled}
          aria-valuetext={valueText}
          aria-invalid={bad || undefined}
          aria-describedby={[hintId, described].filter(Boolean).join(" ") || undefined}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (value === undefined) setOwn(next);
            onValueChange?.(next);
            onChange?.(e);
          }}
        />
        {ticks.length > 0 && (
          <div className={cn("s1-slider__marks", ticks.some((m) => m.label != null) && "s1-slider__marks--labelled")} aria-hidden="true">
            {ticks.map((m) => {
              const at = (m.value - min) / span;
              return (
                <span
                  key={m.value}
                  className="s1-slider__mark"
                  style={{ "--s1-slider-at": at } as CSSProperties}
                  data-edge={at === 0 ? "start" : at === 1 ? "end" : undefined}
                  data-on={m.value === current ? "" : undefined}
                >
                  {m.label != null && <span className="s1-slider__tick-label">{m.label}</span>}
                </span>
              );
            })}
          </div>
        )}
      </div>
      {hint && (
        <p className="s1-slider__hint" id={hintId}>
          {hint}
        </p>
      )}
    </div>
  );
}
