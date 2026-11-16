import type { ReactNode } from "react";
import { evidenceLabel, type EvidenceKind } from "@/lib/types";
import styles from "./figures.module.css";

type Props = {
  id?: string;
  title: string;
  kind: EvidenceKind;
  caption: ReactNode;
  /** Plain-language summary of what the figure shows, read by assistive tech */
  summary: string;
  /** "margin": caption sits in the left margin column on wide screens */
  captionPlacement?: "margin" | "below";
  className?: string;
  children: ReactNode;
};

/** Shared figure contract: title, evidence classification, caption, accessible summary. */
export function Figure({ id, title, kind, caption, summary, captionPlacement = "below", className, children }: Props) {
  const capId = id ? `${id}-cap` : undefined;
  return (
    <figure
      id={id}
      className={`${styles.figure} ${captionPlacement === "margin" ? styles.captionMargin : ""} ${className ?? ""}`}
      aria-labelledby={capId}
    >
      <div className={styles.body}>{children}</div>
      <FigCaption id={capId} title={title} kind={kind} summary={summary}>
        {caption}
      </FigCaption>
    </figure>
  );
}

export function FigCaption({
  id,
  title,
  kind,
  summary,
  children,
}: {
  id?: string;
  title: string;
  kind: EvidenceKind;
  summary?: string;
  children?: ReactNode;
}) {
  return (
    <figcaption id={id} className={styles.caption}>
      <span className={styles.kind}>{evidenceLabel[kind]}.</span> <strong className={styles.capTitle}>{title}.</strong>{" "}
      {children}
      {summary ? <span className="visually-hidden"> {summary}</span> : null}
    </figcaption>
  );
}
