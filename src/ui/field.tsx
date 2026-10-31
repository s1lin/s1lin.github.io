"use client";

import { createContext, useContext, useId, type FieldsetHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";
import { Glyph } from "./glyph";
import "./tokens.css";
import "./field.css";

interface FieldState {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required?: boolean;
  disabled?: boolean;
}

const FieldContext = createContext<FieldState | null>(null);

/** Ids joined for aria-describedby; undefined when there are none. */
const join = (...ids: (string | false | null | undefined)[]) => ids.filter(Boolean).join(" ") || undefined;

/** What a control may say for itself; the Field around it fills in the rest. */
export interface FieldControlProps {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
  required?: boolean;
  disabled?: boolean;
  /** Mark the control as in error without a Field around it. */
  invalid?: boolean;
}

/**
 * The attributes a control needs to belong to the Field around it: the id the
 * label points at, aria-describedby (the error, then the hint, then the
 * control's own), aria-invalid, required and disabled. The control's own props
 * win; outside a Field they come back as they are. Input, Textarea and Select
 * call it; call it in a control of your own and spread the result on it.
 */
export function useField(own: FieldControlProps = {}) {
  const field = useContext(FieldContext);
  const invalid = own.invalid ?? field?.invalid;
  return {
    id: own.id ?? field?.id,
    "aria-describedby": join(field?.describedBy, own["aria-describedby"]),
    "aria-invalid": own["aria-invalid"] ?? (invalid ? true : undefined),
    required: own.required ?? field?.required,
    disabled: own.disabled ?? field?.disabled,
  };
}

/** The error under a control, with a cross before it; read with the control, through aria-describedby. */
function Message({ id, error, children }: { id?: string; error?: boolean; children: ReactNode }) {
  return (
    <p id={id} className={error ? "s1-field__error" : "s1-field__hint"}>
      {error && <Glyph status="bad" />}
      <span>{children}</span>
    </p>
  );
}

export type FieldProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "id"> & {
  /** What the control is, as its label. */
  label: ReactNode;
  /** One control: Input, Textarea, Select, or your own that calls useField. */
  children: ReactNode;
  /** Help under the control. */
  hint?: ReactNode;
  /** What is wrong. The control is marked invalid while it is set. */
  error?: ReactNode;
  /** Passed to the control; the label shows a "*". */
  required?: boolean;
  /** Passed to the control; the label greys. */
  disabled?: boolean;
  /** The control's id, which the label points at. Set it here, not on the control. */
  id?: string;
  /** Words at the other end of the label's line: a count, a link. */
  aside?: ReactNode;
};

/**
 * A label, one control, a hint and an error, wired together: the label's `for`
 * is the control's id, and the control is described by the error and the hint
 * and marked invalid while there is an error.
 */
export function Field({ label, hint, error, required, disabled, id, aside, className, children, ...rest }: FieldProps) {
  const auto = useId();
  const base = id ?? auto;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const state: FieldState = { id: base, describedBy: join(errorId, hintId), invalid: Boolean(error), required, disabled };
  return (
    <div className={cn("s1-field", disabled && "s1-field--disabled", className)} {...rest}>
      <div className="s1-field__top">
        <label className="s1-field__label" htmlFor={base}>
          {label}
          {required && (
            <span className="s1-field__req" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {aside && <span className="s1-field__aside">{aside}</span>}
      </div>
      <FieldContext.Provider value={state}>{children}</FieldContext.Provider>
      {error && (
        <Message id={errorId} error>
          {error}
        </Message>
      )}
      {hint && <Message id={hintId}>{hint}</Message>}
    </div>
  );
}

export type FieldsetProps = Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "children"> & {
  /** What the group is, as its legend. */
  legend: ReactNode;
  /** The checkboxes, switches or radios. */
  children: ReactNode;
  /** Help under the legend, read when the group is entered. */
  hint?: ReactNode;
  /** What is wrong with the group, under it; read when the group is entered. */
  error?: ReactNode;
  /** The legend shows a "*"; say what is required in the hint. */
  required?: boolean;
};

/**
 * A group of controls under one legend, with a hint and an error read as the
 * group's description: a key's scopes as checkboxes, a set of switches.
 * `disabled` disables every control inside, as a fieldset does.
 */
export function Fieldset({ legend, hint, error, required, className, children, id, "aria-describedby": described, ...rest }: FieldsetProps) {
  const auto = useId();
  const base = id ?? auto;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  return (
    <fieldset id={id} className={cn("s1-fieldset", className)} aria-describedby={join(errorId, hintId, described)} {...rest}>
      <legend className="s1-field__label">
        {legend}
        {required && (
          <span className="s1-field__req" aria-hidden="true">
            *
          </span>
        )}
      </legend>
      {hint && <Message id={hintId}>{hint}</Message>}
      <div className="s1-fieldset__body">{children}</div>
      {error && (
        <Message id={errorId} error>
          {error}
        </Message>
      )}
    </fieldset>
  );
}
