import Link from "next/link";
import type { ReactNode } from "react";
import type { CaseStudy as Study } from "@/lib/types";
import { evidenceLabel, flaggedOutcomeKinds } from "@/lib/types";
import { findStudy } from "@/content/index";
import { instruments, ledFor, refFor } from "@/lib/board";
import { RevealOnHash } from "./RevealOnHash";
import { TestPoints } from "./TestPoints";
import { Readout } from "./Readout";
import { BoardView } from "@/components/board/BoardView";
import { STOPS } from "@/components/board/stops";
import styles from "./case.module.css";

export type CaseFigures = {
  /** Dominant figure. Placement depends on composition. */
  hero?: ReactNode;
  /** System drawing, shown after the key decision */
  architecture?: ReactNode;
  /** Focused demo or chart */
  demo?: ReactNode;
  /** Figure that belongs with the key decision or debugging story */
  validationFigure?: ReactNode;
  /** The hero is a live demo, so it sits in an instrument bezel rather than as a plate */
  heroIsDemo?: boolean;
};

/** A numbered section. Its title sits in the margin beside a test point, which lights while you read it. */
function Section({ id, title, children, wide = false }: { id: string; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section id={id} className={`row ${styles.section}`} aria-labelledby={`${id}-h`} data-tp data-reveal data-trace={title}>
      <h2 id={`${id}-h`} className={`margin ${styles.sectionTitle}`}>
        <a href={`#${id}`} className={styles.tp} aria-hidden="true" tabIndex={-1} />
        {title}
      </h2>
      <div className={`main ${wide ? "" : "reading"}`}>{children}</div>
    </section>
  );
}

/**
 * A detail page: a short visible core (what it does, what I did, result, one key
 * decision, the demo) followed by named expandable sections for deeper notes.
 * Section ids are stable anchors; RevealOnHash opens a collapsed one when linked.
 */
export function CaseStudy({ study, figures }: { study: Study; figures: CaseFigures }) {
  const base = study.kind === "experience" ? "/experience" : "/projects";
  const crumb = study.kind === "experience" ? "Experience" : "Projects";
  const resultTitle = study.resultTitle ?? "Result";
  const introTitle = study.introTitle ?? "What I did";

  // a demo inside the bench instrument that suits it, named in silkscreen on the bezel
  const instrument = (content: ReactNode) => (
    <div className={styles.bezel}>
      <div className={styles.bezelHead} aria-hidden="true">
        <span className="silk">{instruments[study.slug] ?? "Bench instrument"}</span>
        <span className={styles.bezelLed} />
      </div>
      <div className={styles.screen}>{content}</div>
    </div>
  );

  const header = (
    <header className={styles.header} data-trace="Top">
      <nav aria-label="Breadcrumb" className={styles.crumb}>
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href={base}>{crumb}</Link></li>
          <li aria-current="page">{study.shortTitle ?? study.title}</li>
        </ol>
      </nav>
      <p className={styles.status}>
        {refFor(study.slug) ? <span className="ref">{refFor(study.slug)}</span> : null}
        <span>{study.domain}</span>
        <span className="led" data-state={ledFor(study.status)}>
          <span className={study.status.startsWith("In progress") ? styles.planned : undefined}>{study.status}</span>
        </span>
      </p>
      <h1 className={styles.title}>{study.title}</h1>
      <p className={styles.problem}>{study.problem}</p>
    </header>
  );

  // the part this page is about, turning slowly on the board (desktop with 3D on)
  const ref = refFor(study.slug);
  const view = ref ? (
    <figure className={styles.partView} aria-label={`${ref} on the portfolio board`}>
      <BoardView mode="part" slug={study.slug} className={styles.partCanvas} />
      <figcaption className="silk">
        {ref} · on the board · JB-PB01
      </figcaption>
    </figure>
  ) : null;

  // a datasheet title block in place of the plain meta list
  const sheetNo = STOPS.findIndex((st) => st.id === study.slug);
  const sheet = (
    <dl className={styles.sheet}>
      <div className={styles.cellPart}>
        <dt>Part</dt>
        <dd className="ref">{ref ?? "—"}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>
          <span className="led" data-state={ledFor(study.status)}>{study.status}</span>
        </dd>
      </div>
      <div>
        <dt>Class</dt>
        <dd>{study.domain}</dd>
      </div>
      {study.timeframe ? (
        <div>
          <dt>When</dt>
          <dd>{study.timeframe}</dd>
        </div>
      ) : null}
      <div className={styles.cellWide}>
        <dt>Role</dt>
        <dd>{study.role}</dd>
      </div>
      <div className={styles.cellWide}>
        <dt>Tools</dt>
        <dd>{study.tools.join(" · ")}</dd>
      </div>
      <div className={styles.cellSheet}>
        <dt>Sheet</dt>
        <dd>{sheetNo > 0 ? `${String(sheetNo).padStart(2, "0")} of ${String(STOPS.length - 1).padStart(2, "0")}` : "—"}</dd>
      </div>
    </dl>
  );

  const contribution = (
    <Section id="contribution" title={introTitle}>
      {study.intro.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </Section>
  );

  const result = (
    <Section id="validation" title={resultTitle}>
      <ul className={styles.outcomes}>
        {study.outcomes.map((o) => (
          <li key={o.text}>
            <Readout text={o.text} />
            {flaggedOutcomeKinds.includes(o.kind) ? <span className={styles.kind}>{evidenceLabel[o.kind]}</span> : null}
          </li>
        ))}
      </ul>
      {study.limits.length ? (
        <ul className={styles.limits} aria-label="Limits">
          {study.limits.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ) : null}
      {study.links.length ? (
        <p className={styles.links}>
          {study.links.map((l) => (
            <a key={l.href} href={l.href} rel="noopener">
              {l.label}
            </a>
          ))}
        </p>
      ) : null}
    </Section>
  );

  const highlight = (
    <Section id="highlight" title={study.highlight.label} wide>
      <div className="reading">
        <h3 className={styles.highlightTitle}>{study.highlight.title}</h3>
        <p>{study.highlight.body}</p>
      </div>
      {figures.validationFigure ? <div className={styles.validationFigure}>{figures.validationFigure}</div> : null}
    </Section>
  );

  const demo = figures.demo ? (
    <Section id="demo" title="Try it" wide>
      {study.demoIntro ? <p className="reading">{study.demoIntro}</p> : null}
      {instrument(figures.demo)}
    </Section>
  ) : null;

  const system = figures.architecture ? <div className={`${styles.section} ${styles.systemFigure}`}>{figures.architecture}</div> : null;

  const more = (
    <section id="more" className={`row ${styles.section}`} aria-labelledby="more-h" data-tp data-reveal data-trace="More detail">
      <h2 id="more-h" className={`margin ${styles.sectionTitle}`}>
        <a href="#more" className={styles.tp} aria-hidden="true" tabIndex={-1} />
        More detail
      </h2>
      <div className="main reading">
        {study.details.map((d) => (
          <details key={d.id} id={d.id} className={styles.more}>
            <summary>{d.title}</summary>
            {d.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </details>
        ))}
        {study.decisions.length ? (
          <details id="decisions" className={styles.more}>
            <summary>Other design decisions</summary>
            <ul className={styles.decisions}>
              {study.decisions.map((d) => (
                <li key={d.title}>
                  <h3>{d.title}</h3>
                  <p>
                    {d.choice} <span className="muted">Instead of: {d.alternative}</span>
                  </p>
                  <p>{d.tradeoff}</p>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </section>
  );

  const related = study.related.map(findStudy).filter(Boolean) as Study[];

  // Shared reading order; the dominant figure's position is what differs.
  const core = (
    <>
      {contribution}
      {result}
      {highlight}
      {demo}
      {system}
      {more}
    </>
  );

  return (
    <article className={`container ${styles.page} ${styles[study.composition]}`}>
      <RevealOnHash />
      <TestPoints />
      <div className={styles.top}>
        {header}
        {view}
      </div>
      {sheet}
      {study.composition === "research" && figures.hero ? <div className={styles.plateHero}>{figures.hero}</div> : null}
      {study.composition === "plate" && figures.hero ? (
        <div className={styles.plateHero}>{figures.heroIsDemo ? instrument(figures.hero) : figures.hero}</div>
      ) : null}
      {study.composition === "signal" && figures.hero ? (
        <div className={styles.signalHero}>{instrument(figures.hero)}</div>
      ) : null}

      {core}

      <section className={`row ${styles.section} ${styles.after}`} aria-labelledby="related-h">
        <h2 id="related-h" className={`margin ${styles.sectionTitle}`}>
          Related work
        </h2>
        <div className="main">
          <ul className={styles.related}>
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`${r.kind === "experience" ? "/experience" : "/projects"}/${r.slug}`} className={styles.relatedTitle}>
                  {r.title}
                </Link>
                <span>{r.line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}
