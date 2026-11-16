import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { projects } from "@/content/projects";
import { ProjectIndex } from "@/components/portfolio/ProjectIndex";
import { WorkIndex } from "@/components/portfolio/WorkIndex";
import { SobelCanvas } from "@/components/interactive/SobelThumbs";
import { FigCaption } from "@/components/figures/Figure";
import { BoardView } from "@/components/board/BoardView";
import s from "../pages.module.css";

export const metadata: Metadata = {
  title: "Projects",
  description: "PCB and analog, FPGA and digital, embedded, and DSP/GPU projects by Jashwanth Bamidi.",
};

const pcbExperience = [
  {
    slug: "archer-aviation",
    title: "Archer Aviation",
    sentence: "I designed the Ethernet flow-controller board in Altium and took it through assembly, firmware and bring-up for inverter test stands.",
  },
  {
    slug: "eco-illini",
    title: "Eco Illini",
    sentence: "I designed and laid out the four-layer power distribution board in KiCad, then assembled and validated it in the car.",
  },
];

export default function ProjectsPage() {
  return (
    <div className={`container ${s.page}`}>
      <header className={s.head}>
        <p className={`silk ${s.kicker}`}>Bill of materials · U1–U7</p>
        <h1 className={s.title}>Projects</h1>
        <p className={s.lede}>
          Seven projects, from analog filters to FPGA logic. Internship and team boards are under{" "}
          <Link href="/experience">Experience</Link>.
        </p>
      </header>

      {/* the whole board from above: hover a row or a part to light the other, click a part to open it */}
      <figure className={s.boardMap} aria-label="Every project as a part on the board">
        <BoardView mode="map" className={s.boardMapCanvas} />
        <figcaption className="silk">JB-PB01 · hover a part or a row · click to open</figcaption>
      </figure>

      <figure className={s.featured}>
        <div className={s.featuredPair}>
          <SobelCanvas which="input" label="Test scene used by the edge-detection demonstration." />
          <SobelCanvas which="output" label="Its Sobel edges." />
        </div>
        <div className={s.featuredText}>
          <h2 className={s.featuredTitle}>
            <Link href="/projects/fpga-edge-detection">FPGA Edge Detection</Link>
          </h2>
          <p>{projects.find((p) => p.slug === "fpga-edge-detection")!.line}</p>
          <FigCaption title="Input and edges" kind="browser">
            Computed in your browser on a generated image, not FPGA footage.
          </FigCaption>
        </div>
      </figure>

      <Suspense fallback={<WorkIndex items={projects} headingLevel={2} />}>
        <ProjectIndex items={projects} pcbExperience={pcbExperience} />
      </Suspense>
    </div>
  );
}
