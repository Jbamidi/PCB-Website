import Link from "next/link";
import type { CaseStudy } from "@/lib/types";
import { ledFor, refFor } from "@/lib/board";
import { HoverRow } from "./HoverRow";
import styles from "./portfolio.module.css";

/** The bill of materials: one row per project, led by its reference designator. Titles are the links; hover only adds the board highlight. */
export function WorkIndex({ items, headingLevel = 3, bomHeader = false }: { items: CaseStudy[]; headingLevel?: 2 | 3; bomHeader?: boolean }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <>
      {bomHeader ? (
        <p className={styles.bomHead} aria-hidden="true">
          <span>Ref</span>
          <span>Part</span>
          <span>Description</span>
          <span>Net class · status</span>
        </p>
      ) : null}
      <ul className={styles.index}>
      {items.map((p) => (
        <HoverRow key={p.slug} slug={p.slug} className={styles.indexItem}>
          <span className={`ref ${styles.indexRef}`}>{refFor(p.slug) ?? "—"}</span>
          <H className={styles.indexTitle}>
            <Link href={`/projects/${p.slug}`}>{p.title}</Link>
          </H>
          <p className={styles.indexLine}>{p.line}</p>
          <p className={styles.indexMeta}>
            <span>{p.domain}</span>
            <span className="led" data-state={ledFor(p.status)}>
              <span className={p.status.startsWith("In progress") ? styles.planned : undefined}>{p.status}</span>
            </span>
          </p>
        </HoverRow>
      ))}
    </ul>
    </>
  );
}
