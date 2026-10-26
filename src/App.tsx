import { Cities } from "@/components/Cities";
import { Colophon } from "@/components/Colophon";
import { Contents } from "@/components/Contents";
import { Cover } from "@/components/Cover";
import { Departures } from "@/components/Departures";
import { FrostPane, SandPane } from "@/components/effects";
import { FeatureOpener } from "@/components/FeatureOpener";
import { Features } from "@/components/Features";
import { Runhead } from "@/components/Runhead";
import { Workshop } from "@/components/Workshop";

/** S1LIN, Vol. 30 "Architecture": a personal site set like a magazine issue. */
export default function App() {
  return (
    <>
      <a className="skip" href="#contents">
        Skip to contents
      </a>
      <Runhead />
      <main>
        <Cover />
        <Contents />
        <FeatureOpener />
        <Features />
        <Cities />
        <Workshop />
        <Departures />
        <Colophon />
      </main>
      <SandPane />
      <FrostPane />
    </>
  );
}
