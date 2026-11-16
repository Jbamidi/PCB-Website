import { profile } from "@/content/profile";
import { experiences } from "@/content/experiences";
import { projects } from "@/content/projects";
import board from "../../../board/parts.json";
import { MaskCompare } from "./MaskCompare";
import type { Metadata } from "next";
import s from "./lookdev.module.css";

export const metadata: Metadata = { title: "Look development", robots: { index: false, follow: false } };

// Phase 0 look-development review. Replaced by the real homepage in Phase 1.

type Part = { ref: string; populated: boolean };
const parts = board.parts as Record<string, Part>;

export default function LookDev() {
  const work = [...experiences, ...projects].map((w) => ({ w, part: parts[w.slug] }));

  return (
    <main>
      <section className={s.hero} aria-labelledby="name">
        <picture className={s.heroImg}>
          <source media="(max-width: 900px)" srcSet="/lookdev/hero-green-960.webp" />
          <img
            src="/lookdev/hero-green-1920.webp"
            alt="The portfolio board: Ethernet, CAN and audio connectors on the left edge, buck converters along the top, BGA packages with DDR memory and decoupling capacitors in the core, an ESP32 module at the right, glowing status LEDs."
            width={1920}
            height={1080}
          />
        </picture>
        <div className={`container ${s.heroText}`}>
          <p className="silk">
            <span className="led">PWR</span>
          </p>
          <h1 id="name" className={s.name}>
            {profile.first} <span>{profile.last}</span>
          </h1>
          <p className={s.intro}>{profile.intro}</p>
        </div>
      </section>

      <section className="container" aria-labelledby="about-h">
        <div className={s.note}>
          <p className="silk">Phase 0 · look development</p>
          <h2 id="about-h">Review the look before any site code is built on it</h2>
          <p>
            Renders of a production-style KiCad board generated for the portfolio, lit and shaded in Blender: real power stages, DDR routing with
            length tuning, decoupling, test points and a serial label. The main parts are your projects and roles, and the hero above shows how the
            name and intro sit over the board on the homepage.
          </p>
        </div>
      </section>

      <MaskCompare />

      <section className="container" aria-labelledby="stills-h">
        <h2 id="stills-h" className={s.h2}>Close-ups for project pages</h2>
        <div className={s.stills}>
          <figure>
            <img src="/lookdev/closeup-green-1920.webp" alt="Close-up of the ESP32-S3 module with its metal shield, antenna and gold castellated pads, a lit status LED beside it." width={1600} height={1200} />
            <figcaption>
              <span className="silk">U3 · VisionVest</span> The camera flies to this view when a visitor opens VisionVest.
            </figcaption>
          </figure>
          <figure>
            <img src="/lookdev/case-green-1920.webp" alt="Close-up of the analog front end: two SOIC op-amps and an MSOP ADC among 0603 passives, a green status LED, vias and traces showing through the mask, DDR packages above." width={1920} height={800} />
            <figcaption>
              <span className="silk">U4 · Guitar tuner</span> A wide case-study header: the project&apos;s part, framed from above.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="container" aria-labelledby="map-h">
        <h2 id="map-h" className={s.h2}>What each part is</h2>
        <table className={s.map}>
          <thead>
            <tr>
              <th scope="col">Ref</th>
              <th scope="col">Work</th>
              <th scope="col">On the board</th>
            </tr>
          </thead>
          <tbody>
            {work.map(({ w, part }) => (
              <tr key={w.slug}>
                <td className={s.ref}>{part?.ref ?? "—"}</td>
                <td>{w.title}</td>
                <td>
                  <span className="led" data-state={part?.populated ? "on" : "planned"}>
                    {part?.populated ? (w.kind === "experience" ? "Edge connector" : "Populated part") : "Empty footprint, planned"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={s.small}>Two spare QFN footprints at the lower right are already routed to the board controller, waiting for the next project.</p>
      </section>

      <section className="container" aria-labelledby="decide-h">
        <h2 id="decide-h" className={s.h2}>Decide before Phase 1</h2>
        <ol className={s.decide}>
          <li>Mask colour: green-black, matte black or deep blue.</li>
          <li>Light: neutral studio light as shown, or warmer and moodier.</li>
          <li>Hero framing: board to the right with the name on the left, as above, or straight-on and centred.</li>
          <li>Board content: anything to add, move or relabel on the board itself.</li>
        </ol>
      </section>
    </main>
  );
}
