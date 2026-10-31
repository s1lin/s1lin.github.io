import { Fragment, useState, type ReactNode } from "react";
import type { ExampleKind, Note, PropDoc } from "@/components/uidocs/registry";

/** Words from the registry: `code` in backticks, nothing else read as markup. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 2 ? <code key={i}>{part.slice(1, -1)}</code> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}

/** A block of code, scrolling sideways inside its own frame when a line is wider than the column. */
export function Code({ children, label }: { children: string; label?: string }) {
  return (
    <figure className="ud-code">
      {label && <figcaption className="ud-code__label">{label}</figcaption>}
      <pre tabIndex={0}>
        <code>{children}</code>
      </pre>
    </figure>
  );
}

const KIND: Record<Exclude<ExampleKind, "none">, string> = {
  live: "Live",
  specimen: "Specimen · mock data, sends nothing",
  "on-click": "Loads when asked",
};

/** The plate a live example stands on: a hairline box with registration marks, labelled with what kind of example it is. */
export function Plate({ kind, children, wide }: { kind: Exclude<ExampleKind, "none">; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "ud-plate ud-plate--wide" : "ud-plate"} data-kind={kind}>
      <p className="ud-plate__kind mono">{KIND[kind]}</p>
      <div className="ud-plate__body">{children}</div>
    </div>
  );
}

/**
 * Something heavy, mounted only when the reader asks for it: a button, then the
 * thing. `label` says what pressing it will load and what it costs.
 */
export function OnClick({ label, cost, children }: { label: string; cost: string; children: () => ReactNode }) {
  const [on, setOn] = useState(false);
  return (
    <div className="ud-onclick">
      <p className="ud-onclick__bar">
        <button type="button" className="ud-btn" aria-pressed={on} onClick={() => setOn((v) => !v)}>
          {on ? "Unload" : label}
        </button>
        <span className="ud-onclick__cost">{cost}</span>
      </p>
      {on && children()}
    </div>
  );
}

/** Props as a table on a desktop; on a phone each prop stacks into a small block. */
export function PropsTable({ title, props }: { title: string; props: PropDoc[] }) {
  const defaults = props.some((p) => p.default !== undefined || p.required);
  return (
    <div className="ud-props">
      <h4 className="ud-h4 mono">{title}</h4>
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            {defaults && <th scope="col">Default</th>}
            <th scope="col">What it does</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p) => (
            <tr key={p.name}>
              <th scope="row">
                <code>{p.name}</code>
              </th>
              <td className="ud-props__type">
                <code>{p.type}</code>
              </td>
              {defaults && <td className="ud-props__def">{p.required ? <em>required</em> : p.default ? <code>{p.default}</code> : "—"}</td>}
              <td>
                <Inline text={p.desc} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Accessibility, motion, phone, dark mode, cost: what to know before using it. */
export function Notes({ notes }: { notes: Note[] }) {
  return (
    <dl className="ud-notes">
      {notes.map((n, i) => (
        <Fragment key={i}>
          <dt>{n.label}</dt>
          <dd>
            <Inline text={n.text} />
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}
