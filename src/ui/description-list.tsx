import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import "./tokens.css";
import "./description-list.css";

export interface Description {
  /** The name: "Created", "Balance". */
  label: ReactNode;
  /** What it is. */
  value: ReactNode;
  /** A React key, when the label is not a string. */
  key?: string;
}

type Props = Omit<HTMLAttributes<HTMLDListElement>, "children"> & {
  items: Description[];
  /** "rows", names beside values, stacked in a narrow box; "stacked", always name over value. */
  layout?: "rows" | "stacked";
};

/**
 * Facts as names and values, in a description list: an order's details, an
 * account, a key. Names in mono caps on the left, values beside them, a
 * hairline between rows; name over value in a box under 26em wide.
 */
export function DescriptionList({ items, layout = "rows", className, ...rest }: Props) {
  return (
    <dl className={cn("s1-dl", layout === "stacked" && "s1-dl--stacked", className)} {...rest}>
      {items.map((it, i) => (
        <div className="s1-dl__row" key={it.key ?? (typeof it.label === "string" ? it.label : i)}>
          <dt>{it.label}</dt>
          <dd>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
