"use client";

import Link from "next/link";
import { useEffect } from "react";
import { boardStore } from "@/components/board/store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CaseStudy } from "@/lib/types";
import { FILTERS, filterItems, parseFilter, resultSentence, type FilterValue } from "@/lib/demo-models/filters";
import { WorkIndex } from "./WorkIndex";
import styles from "./portfolio.module.css";

export type RelatedExperience = { slug: string; title: string; sentence: string };

/**
 * Single-select category filter whose state lives in the URL (?category=fpga).
 * Under PCB & analog, completed board work from Experience is linked separately and
 * is not counted as a project.
 */
export function ProjectIndex({ items, pcbExperience = [] }: { items: CaseStudy[]; pcbExperience?: RelatedExperience[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const active = parseFilter(params.get("category"));
  const shown = filterItems(items, active);

  // a net class outlines its parts on the board map above the list; "All" outlines nothing
  const lit = active === "all" ? "" : shown.map((p) => p.slug).join();
  useEffect(() => {
    boardStore.set({ spot: lit ? lit.split(",") : [] });
    return () => boardStore.set({ spot: [] });
  }, [lit]);

  const choose = (v: FilterValue) => {
    const q = new URLSearchParams(params.toString());
    if (v === "all") q.delete("category");
    else q.set("category", v);
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <section aria-labelledby="index-h" className={styles.projectIndex}>
      <h2 id="index-h" className="visually-hidden">
        Project index
      </h2>
      <div role="group" aria-label="Filter by category" className={styles.filters}>
        {FILTERS.map((f) => (
          <button key={f.value} type="button" className="text-btn" aria-pressed={active === f.value} onClick={() => choose(f.value)}>
            {f.label}
          </button>
        ))}
      </div>
      <p className={styles.count} role="status" aria-live="polite">
        {resultSentence(shown.length, active)}
      </p>
      {shown.length ? (
        <WorkIndex items={shown} bomHeader />
      ) : (
        <p>
          Nothing in this category yet.{" "}
          <button type="button" className="text-btn" onClick={() => choose("all")}>
            Show all projects
          </button>
        </p>
      )}
      {active === "pcb" && pcbExperience.length ? (
        <aside className={styles.relatedExp} aria-labelledby="pcb-exp-h">
          <h3 id="pcb-exp-h" className={styles.relatedExpHead}>
            Related board-design experience
          </h3>
          <p className={styles.relatedExpNote}>Completed boards, listed under Experience.</p>
          <ul>
            {pcbExperience.map((e) => (
              <li key={e.slug}>
                <Link href={`/experience/${e.slug}`} className={styles.relatedExpTitle}>
                  {e.title}
                </Link>
                <span>{e.sentence}</span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </section>
  );
}
