import type { ReactNode } from "react";
import { bayes } from "./bayes";
import { bigAndSmall } from "./big-and-small";
import { moonLanding } from "./moon-landing";
import { whyExploreSpace } from "./why-explore-space";
import { withoutNightCity } from "./without-night-city";

/** One post on the blog. Each needs its HTML shell at blog/<slug>/index.html, with its own title and meta tags. */
export type Post = {
  slug: string;
  no: string;
  title: string;
  /** The language it was written in; the title and text are set for it. */
  lang: "zh-Hans" | "en";
  /** A UUID, fixed for good, shown as the post's barcode in place of a date. */
  id: string;
  /** One English line under the title, here and on the blog's index. */
  dek: string;
  epigraph?: { text: ReactNode; by: ReactNode };
  /** The spec sheet beside the text. */
  spec: [string, ReactNode][];
  body: ReactNode;
  signed: ReactNode;
  /** Sources, numbered from 1; the text points at them with <Ref n={…} />. */
  refs?: ReactNode[];
  /** Where it ran first, and anything changed since, under the text. */
  note?: ReactNode;
};

/** Newest first. */
export const POSTS: Post[] = [withoutNightCity, moonLanding, whyExploreSpace, bigAndSmall, bayes];
