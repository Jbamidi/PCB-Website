import type { Metadata } from "next";
import Link from "next/link";
import { experiences } from "@/content/experiences";
import { ledFor, refFor } from "@/lib/board";
import { ExpTrace } from "@/components/portfolio/ExpTrace";
import s from "../pages.module.css";

export const metadata: Metadata = {
  title: "Experience",
  description: "Archer Aviation, Eco Illini and spatial-audio research: what Jashwanth Bamidi owned and what came of it.",
};

export default function ExperienceIndex() {
  return (
    <div className={`container ${s.page}`}>
      <header className={s.head}>
        <p className={`silk ${s.kicker}`}>Revision history · edge connectors J1–J3</p>
        <h1 className={s.title}>Experience</h1>
        <p className={s.lede}>
          Test-stand hardware, a car power board, and spatial-audio research.
        </p>
      </header>
      <ExpTrace />
      <ol className={s.expList} data-exp-trace>
        {experiences.map((e) => (
          <li key={e.slug} className={`row ${s.expItem}`} data-reveal>
            <div className={`margin ${s.expWhen}`}>
              <p className="ref">{refFor(e.slug)}</p>
              <p>{e.timeframe}</p>
              <p className="led" data-state={ledFor(e.status)}>{e.status.split(" · ")[0]}</p>
            </div>
            <div className="main">
              <h2 className={s.expOrg}>
                <Link href={`/experience/${e.slug}`}>{e.title}</Link>
              </h2>
              <p className={s.expRole}>{e.role}</p>
              <p className={s.expSummary}>{e.summary}</p>
              <p className={s.more}>
                <Link href={`/experience/${e.slug}`}>Read about {e.shortTitle ?? e.title}</Link>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
