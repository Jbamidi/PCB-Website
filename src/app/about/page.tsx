import type { Metadata } from "next";
import Link from "next/link";
import { profile, skillGroups } from "@/content/profile";
import s from "../pages.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "Jashwanth Bamidi: Computer Engineering at UIUC, graduating May 2028. PCB design, bring-up and test, embedded and FPGA work.",
};

export default function AboutPage() {
  return (
    <div className={`container ${s.page}`}>
      <header className={s.head}>
        <p className={`silk ${s.kicker}`}>Title block · board notes</p>
        <h1 className={s.title}>About</h1>
        <p className={s.lede}>{profile.closing}</p>
      </header>

      <section className={`row ${s.block}`} aria-labelledby="how-h">
        <h2 id="how-h" className={`margin ${s.blockTitle}`}>How I work</h2>
        <div className="main reading">
          <p>
            I treat a clean schematic or a passing check as a claim to test. That habit found{" "}
            <Link href="/experience/archer-aviation#highlight">a 0.9 Ω short</Link> caused by a rule in the wrong units, and{" "}
            <Link href="/projects/hardware-guitar-tuner#highlight">a comparator</Link> that failed only when connected.
          </p>
        </div>
      </section>

      <section className={`row ${s.block}`} aria-labelledby="edu-h">
        <h2 id="edu-h" className={`margin ${s.blockTitle}`}>Education</h2>
        <div className="main reading">
          <p>
            <strong>{profile.school}</strong>
            <br />
            {profile.degree}, {profile.graduation.toLowerCase()}. GPA {profile.gpa}.
          </p>
          <p className={s.small}>Coursework: {profile.coursework.join(", ")}.</p>
        </div>
      </section>

      <section className={`row ${s.block}`} aria-labelledby="skills-h">
        <h2 id="skills-h" className={`margin ${s.blockTitle}`}>Skills, with where to see them</h2>
        <div className="main">
          <dl className={s.skills}>
            {skillGroups.map((g) => (
              <div key={g.title}>
                <dt>{g.title}</dt>
                <dd>
                  <p>{g.items}.</p>
                  <p className={s.small}>
                    See:{" "}
                    {g.evidence.map((e, i) => (
                      <span key={e.href}>
                        {i ? ", " : ""}
                        <Link href={e.href}>{e.label}</Link>
                      </span>
                    ))}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={`row ${s.block}`} aria-labelledby="c-h">
        <h2 id="c-h" className={`margin ${s.blockTitle}`}>Contact</h2>
        <div className="main reading">
          <p className={s.resumeLinks}>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <a href={profile.github}>GitHub</a>
            <a href={profile.linkedin}>LinkedIn</a>
            <Link href="/resume">Résumé</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
