import Image from "next/image";
import Link from "next/link";
import { experiences } from "@/content/experiences";
import { projects } from "@/content/projects";
import { profile } from "@/content/profile";
import { asset } from "@/content/publicAssets";
import { evidenceLabel, flaggedOutcomeKinds } from "@/lib/types";
import { STOPS, stopAttrs } from "./stops";
import { TourCard, LeaderLine } from "./TourClient";
import s from "./tour.module.css";

/** pictures of the real thing, shown on the cards that have one */
const MEDIA: Record<string, string> = {
  "eco-illini": "eco-illini-pdu-render",
  visionvest: "visionvest-system-portrait",
  "hardware-guitar-tuner": "tuner-analog-detail",
};

/**
 * The desktop homepage tour: one section per part, each at least a screen and a half
 * tall, holding a readout card that docks at the screen edge while the camera holds on
 * its part. Only shown with the live board; phones and 3D-off keep the full homepage.
 */
export function Tour() {
  const parts = STOPS.filter((st) => st.item);
  return (
    <div className={s.tour}>
      {parts.map((st, n) => {
        const item = st.item!;
        const study = [...experiences, ...projects].find((w) => w.slug === item.slug);
        const media = MEDIA[item.slug] ? asset(MEDIA[item.slug]) : null;
        return (
          <section key={st.id} className={s.stop} aria-labelledby={`tour-${st.id}`} {...stopAttrs(st.id)}>
            <TourCard id={st.id} side={st.side}>
              <p className={s.cardHead}>
                <span className="ref">{item.ref}</span>
                <span className="led" data-state={item.led}>
                  {item.status}
                </span>
                <span className={s.count}>
                  {String(n + 1).padStart(2, "0")} / {String(parts.length).padStart(2, "0")}
                </span>
              </p>
              <h2 id={`tour-${st.id}`} className={s.title}>
                {item.kind === "contact" ? "Get in touch" : study?.title ?? item.title}
              </h2>
              {study ? (
                <>
                  <p className={s.summary}>{study.summary}</p>
                  {media?.src ? (
                    <div className={s.media}>
                      <Image src={media.src} alt={media.alt} width={media.width} height={media.height} sizes="380px" />
                    </div>
                  ) : null}
                  <ul className={s.outcomes}>
                    {study.outcomes.slice(0, 2).map((o) => (
                      <li key={o.text}>
                        {o.text}
                        {flaggedOutcomeKinds.includes(o.kind) ? <span className={s.kind}> {evidenceLabel[o.kind]}</span> : null}
                      </li>
                    ))}
                  </ul>
                  <p className={s.open}>
                    <Link href={item.href}>Open {item.ref} →</Link>
                  </p>
                </>
              ) : (
                <>
                  <p className={s.summary}>{profile.closing}</p>
                  <ul className={s.contact}>
                    <li>
                      <a href={`mailto:${profile.email}`}>{profile.email}</a>
                    </li>
                    <li>
                      <a href={profile.github} rel="me noopener">GitHub</a>
                    </li>
                    <li>
                      <a href={profile.linkedin} rel="me noopener">LinkedIn</a>
                    </li>
                    <li>
                      <Link href="/resume">Résumé</Link>
                    </li>
                  </ul>
                </>
              )}
            </TourCard>
          </section>
        );
      })}
      <LeaderLine />
    </div>
  );
}
