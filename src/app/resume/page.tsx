import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/content/profile";
import s from "../pages.module.css";

export const metadata: Metadata = {
  title: "Résumé",
  description: "One-page résumé of Jashwanth Bamidi, Computer Engineering at UIUC.",
};

export default function ResumePage() {
  return (
    <div className={`container ${s.page}`}>
      <header className={s.head}>
        <p className={`silk ${s.kicker}`}>Fab drawing · rev 2026</p>
        <h1 className={s.title}>Résumé</h1>
        <p className={s.lede}>
          The one-page version of this site.
        </p>
        <p className={s.resumeLinks}>
          <a href={profile.resumePdf} download>
            Download the PDF
          </a>
          <a href={profile.resumePdf} target="_blank" rel="noopener">
            Open in a new tab
          </a>
        </p>
      </header>
      <div className={s.pdfFrame}>
        <object data={`${profile.resumePdf}#view=FitH`} type="application/pdf" aria-label="Résumé PDF">
          <p className={s.pdfFallback}>
            Your browser cannot show the PDF here. <a href={profile.resumePdf}>Download it instead</a>, or read the{" "}
            <Link href="/experience">experience</Link> and <Link href="/projects">projects</Link> pages.
          </p>
        </object>
      </div>
    </div>
  );
}
