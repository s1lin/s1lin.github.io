import type { ReactNode } from "react";
import { GlitchTitle } from "@/components/effects";
import { WorkshopSlider } from "@/components/WorkshopSlider";
import { Folio } from "@/ui/folio";
import { Kicker } from "@/ui/kicker";

type Item = {
  id?: string;
  no: string;
  title: string;
  meta: string;
  text: ReactNode;
  link?: { href: string; label: string };
};

const ITEMS: Item[] = [
  {
    id: "brick-locator",
    no: "01",
    title: "Brick Locator",
    meta: "2025.12 · PyMuPDF · PDF.js · AGPL 3.0",
    text: "A leftover LEGO piece, traced back to every step that adds it and marked on the page. The site ships an index of the booklet and a two-page sample. You bring the PDF from LEGO, and your browser draws every other page from your copy. One booklet so far: the Vespa.",
    link: { href: "#cover", label: "Play it on the cover ↑" },
  },
  {
    no: "02",
    title: "Parallel Babai",
    meta: "2019–2022 · M.Sc. thesis, McGill · C++ · OpenMP",
    text: (
      <>
        <em>Some Parallel Algorithms for Linear Model Based Integer Parameter Estimation</em>, supervised by Prof.
        Xiao-Wen Chang. Asynchronous parallel solvers for integer least squares, plus parallel LLL reduction.
      </>
    ),
    link: { href: "https://github.com/s1lin/babai_asyn_release", label: "github.com/s1lin/babai_asyn_release" },
  },
  {
    no: "03",
    title: "deal.II × Trilinos",
    meta: "2016–2017 · Honors thesis, Saint John's · C++",
    text: (
      <>
        <em>High Performance Techniques Applied in Partial Differential Equations Library.</em> I moved the deal.II
        finite-element library onto a newer Trilinos and benchmarked data representations, advised by Dr. Mike Heroux
        and Dr. Michael Tangredi.
      </>
    ),
    link: { href: "https://digitalcommons.csbsju.edu/honors_thesis/40/", label: "Read the thesis" },
  },
  {
    no: "04",
    title: "Pioneer Network",
    meta: "2015–2019 · Spring Boot · Vue · ~1,250 commits",
    text: "Began as a bidding system for a databases course and grew into the administration system for an education company in Chengdu, where I was project manager and engineer, then a consultant from 2018 to 2019.",
  },
  {
    no: "05",
    title: "Mindstorms",
    meta: "2015–2017 · Robotics team lead, Saint John's",
    text: "The first things I built that moved on their own. LEGO Mindstorms robots for a contest at the University of Northern Iowa in 2015, then two years leading the team.",
  },
  {
    no: "06",
    title: "Game theory, out loud",
    meta: "2020 · Bilibili · in Chinese",
    text: "A free game theory course recorded during the pandemic, and a blog called All AND Nothing with friends. Teaching is building too, just slower.",
    link: { href: "https://www.bilibili.com/video/BV15v411i7Mj", label: "Watch on Bilibili" },
  },
];

function ItemText({ item }: { item: Item }) {
  return (
    <>
      <span className="item__no">No. {item.no}</span>
      <h3>{item.title}</h3>
      <p className="item__meta">{item.meta}</p>
      <p>{item.text}</p>
      {item.link && (
        <p className="item__link">
          <a href={item.link.href}>{item.link.label}</a>
        </p>
      )}
    </>
  );
}

export function Workshop() {
  return (
    <section className="spread" id="workshop" data-run="工房 · Workshop">
      <div className="wrap grid figs">
        <div className="workshop__intro">
          <Kicker ja="工房">The workshop · pp. 36–43</Kicker>
          <GlitchTitle className="display">
            Side builds <em>&amp; old foundations.</em>
          </GlitchTitle>
        </div>
        <p className="workshop__aside">
          The studies behind the big lines: weekend builds, two theses, a robot team and a course. Some shipped and
          some stayed on paper, but each settled a question the big lines no longer have to ask.
        </p>

        <WorkshopSlider />

        <div className="bench">
          {ITEMS.map((item) => (
            <article className="item" id={item.id} key={item.no}>
              <ItemText item={item} />
            </article>
          ))}
        </div>
      </div>
      <Folio page="36" />
    </section>
  );
}
