import { clsx, type ClassValue } from "clsx";

/** Class names joined, the falsy ones dropped: clsx, under the name shadcn's parts use. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
