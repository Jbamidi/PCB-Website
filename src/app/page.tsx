import Link from "next/link";
import { profile } from "@/content/profile";
import { experiences } from "@/content/experiences";
import { projects, featured } from "@/content/projects";
import { asset } from "@/content/publicAssets";
import { PduPlate } from "@/components/interactive/PduPlate";
import { FigCaption } from "@/components/figures/Figure";
import { Plate } from "@/components/figures/Plate";
import { VestDrawing } from "@/components/figures/VestDrawing";
import { PlannedBoard } from "@/components/figures/PlannedBoard";
import { StaticTunerChart } from "@/components/figures/StaticTunerChart";
import { WorkIndex } from "@/components/portfolio/WorkIndex";
import { PowerOn } from "@/components/motion/PowerOn";
import { LiveBoard } from "@/components/board/LiveBoard";
import { PartList } from "@/components/board/PartList";
import { boardItems } from "@/components/board/boardData";
import { stopAttrs } from "@/components/board/stops";
import { Tour } from "@/components/board/Tour";
import { ledFor, refFor } from "@/lib/board";
import s from "./home.module.css";

// Runs while the page is still parsing: dims the hero for the power-on, and switches the
// page to the scroll-story layout when the live board will run (the same test as
// LiveBoard's canGoLive), so the layout never jumps after hydration.
const BEFORE_PAINT = [
  "var h=document.currentScript.parentElement,d=document.documentElement;",
  "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)h.setAttribute('data-po-pending','');",
  "try{var off=localStorage.getItem('jb-board-3d')==='off',sd=navigator.connection&&navigator.connection.saveData;",
  "if(matchMedia('(min-width: 901px)').matches&&!off&&!sd&&document.createElement('canvas').getContext('webgl2'))d.setAttribute('data-board-live','')}catch(e){}",
].join("");

const registerDates: Record<string, string> = {
  "archer-aviation": "May – Aug 2026",
  "eco-illini": "Aug 2025 – now",
  "spatial-audio-research": "Aug 2025 – now",
};

export default function Home() {
  const bySlug = (slug: string) => projects.find((p) => p.slug === slug)!;
  const [board, vest, tuner] = featured.map(bySlug);
  const rest = projects.filter((p) => !(featured as readonly string[]).includes(p.slug));

  return (
    <>
      <section className={s.hero} aria-labelledby="name" data-po-root suppressHydrationWarning {...stopAttrs("hero")}>
        <script dangerouslySetInnerHTML={{ __html: BEFORE_PAINT }} />
        <PowerOn />
        <div className={s.heroImg} data-po="board">
          <picture>
          <source media="(max-width: 900px)" srcSet="/lookdev/hero-green-960.webp" />
          <img
            src="/lookdev/hero-green-1920.webp"
            alt="Jashwanth's portfolio board: Ethernet, CAN and audio connectors on the left edge, buck converters along the top, BGA packages with DDR memory in the core, an ESP32 module at the right, status LEDs lit."
            width={1920}
            height={1080}
            fetchPriority="high"
          />
          </picture>
        </div>
        <div className={`container ${s.heroText}`}>
          <h1 id="name" className={s.name} data-po="name">
            <span>{profile.first}</span> <span>{profile.last}</span>
          </h1>
          <p className={s.line} data-po="rest">{profile.line}</p>
        </div>
        <p className={s.scrollCue} aria-hidden="true">
          <span className="silk">Scroll to probe the board</span>
        </p>
      </section>

      <LiveBoard />
      <Tour />

      <section className={`container ${s.onBoard}`} aria-labelledby="parts-h">
        <h2 id="parts-h" className={`silk ${s.onBoardHead}`}>
          On this board · {boardItems.length} parts
        </h2>
        <PartList items={boardItems} />
      </section>

      {/* the full homepage; with the live board the tour above stands in for it */}
      <div className={s.full}>
      <section className={`container ${s.register}`} aria-labelledby="experience-h">
        <div className="row">
          <h2 id="experience-h" className={`margin ${s.sectionLabel}`}>
            <span className="silk">J1–J3 · edge connectors</span>
            Experience
          </h2>
          <div className="main">
            <ol className={s.regList}>
              {experiences.map((e) => (
                <li key={e.slug} className={s.regItem} data-reveal>
                  <div className={s.regHead}>
                    <p className={s.partTag}>
                      <span className="ref">{refFor(e.slug)}</span>
                      <span className="led" data-state={ledFor(e.status)}>{e.status}</span>
                    </p>
                    <h3 className={s.regOrg}>
                      <Link href={`/experience/${e.slug}`}>{e.shortTitle ?? e.title}</Link>
                    </h3>
                    <p className={s.regRole}>{e.role.split(",")[0]}</p>
                    <p className={s.regDates}>{registerDates[e.slug]}</p>
                  </div>
                  <p className={s.regText}>{e.summary}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className={`container ${s.plateSection}`} aria-labelledby="pdu-h" data-reveal>
        <div className={s.plateGrid}>
          <div className={s.plateNote}>
            <p className="silk">J2 · daughterboard</p>
            <h2 id="pdu-h" className={s.plateTitle}>
              The Eco Illini power distribution board
            </h2>
            <p>
              My design and layout: a four-layer board that turns the car&apos;s 36 V battery into protected 12 V and 3.3 V supplies. It was fabricated,
              assembled and validated in the vehicle.
            </p>
            <p>
              <Link href="/experience/eco-illini">Design and testing</Link>
            </p>
          </div>
          <div className={s.plateFig}>
            <PduPlate idPrefix="home" />
          </div>
        </div>
      </section>

      <section aria-labelledby="projects-h">
        <div className={`container ${s.projectsHead}`}>
          <div className="row">
            <h2 id="projects-h" className={`margin ${s.sectionLabel}`}>
              <span className="silk">U1 · U3 · U4</span>
              Selected projects
            </h2>
          </div>
        </div>

        {/* 1. High Speed FPGA PCB: text column beside a wide proposed-architecture drawing */}
        <article className={`container ${s.board}`} aria-labelledby="board-h" data-reveal>
          <div className={s.boardText}>
            <p className={s.partTag}>
                <span className="ref">{refFor(board.slug)}</span>
                <span className="led" data-state={ledFor(board.status)}>{board.status}</span>
              </p>
              <h3 id="board-h" className={s.featureTitle}>
              <Link href={`/projects/${board.slug}`}>{board.title}</Link>
            </h3>
            <p>{board.summary}</p>
            {board.questions ? (
              <>
                <p className={s.questionsHead}>Open questions</p>
                <ul className={s.questions}>
                  {board.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className={s.discreet}>
              <Link href={`/projects/${board.slug}`}>Planning notes</Link>
            </p>
          </div>
          <figure className={s.boardFig}>
            {asset("hspcb-architecture-plate").src ? (
              <div className={s.boardImage}>
                <Plate slot="hspcb-architecture-plate" fallback={null} sizes="(max-width: 1023px) 100vw, 760px" />
              </div>
            ) : null}
            <PlannedBoard />
            <FigCaption
              title="What the board is meant to hold"
              kind="proposed"
              summary="Power input and four rails feed an FPGA and external memory; configuration and debug access, and optional Ethernet, connect to the FPGA."
            >
              Functional blocks only; no layout, routing or stackup is fixed yet.
            </FigCaption>
          </figure>
        </article>

        {/* 2. VisionVest: tall portrait beside a short story */}
        <article className={`container ${s.vest}`} aria-labelledby="vest-h" data-reveal>
          <figure className={s.vestPortrait}>
            <Plate slot="visionvest-system-portrait" fallback={<VestDrawing />} sizes="(max-width: 767px) 100vw, 480px" keepRatioForFallback={false} />
            <FigCaption
              title="A vest that communicates by touch"
              kind={asset("visionvest-system-portrait").src ? "conceptual" : "illustrative"}
              summary="The vest render includes a front-mounted phone, a USB power bank supplying the ESP32, and a separate 9 V battery supplying the motor driver."
            >
              Phone on the front, USB power bank for the ESP32, separate 9 V motor battery; mounting approximated.{" "}
              <a href="https://www.youtube.com/watch?v=Fluu49cXkIo">Video of the real prototype</a>
            </FigCaption>
          </figure>
          <div className={s.vestText}>
            <p className={s.partTag}>
                <span className="ref">{refFor(vest.slug)}</span>
                <span className="led" data-state={ledFor(vest.status)}>{vest.status}</span>
              </p>
              <h3 id="vest-h" className={s.featureTitle}>
              <Link href={`/projects/${vest.slug}`}>{vest.title}</Link>
            </h3>
            <p className={s.status}>{vest.timeframe}</p>
            <p className={s.vestSummary}>{vest.summary}</p>
            <ol className={s.steps} aria-label="How a cue travels">
              <li><span>Phone</span> picks a direction</li>
              <li><span>Vest</span> drops stale commands</li>
              <li><span>Motor</span> on that side buzzes</li>
            </ol>
            <p className={s.discreet}>
              <Link href={`/projects/${vest.slug}`}>Command handling and demo</Link>
            </p>
          </div>
        </article>

        {/* 3. Guitar tuner: chart-led technical spread */}
        <article className={`container ${s.tuner}`} aria-labelledby="tuner-h" data-reveal>
          <div className="row">
            <aside className={`margin ${s.benchNote}`} aria-label="How it decides">
              <p className={s.benchHead}>How it decides</p>
              <p>
                Two filters listen just below and above the target note. The stronger one says which way to tune.
              </p>
            </aside>
            <div className="main">
              <p className={s.partTag}>
                <span className="ref">{refFor(tuner.slug)}</span>
                <span className="led" data-state={ledFor(tuner.status)}>{tuner.status}</span>
              </p>
              <h3 id="tuner-h" className={s.featureTitle}>
                <Link href={`/projects/${tuner.slug}`}>{tuner.title}</Link>
              </h3>
              <p className={s.tunerText}>{tuner.summary}</p>
              <figure className={s.tunerFigure}>
                <Plate slot="tuner-analog-detail" fallback={<StaticTunerChart />} sizes="(max-width: 1023px) 100vw, 940px" keepRatioForFallback={false} />
                <FigCaption
                  title="The two filter outputs, on a scope"
                  kind="conceptual"
                  summary="An illustrative scope display labels the 630 and 690 Hz filter channels for a 660 Hz input."
                >
                  Generated illustration; the traces are not measurements.{" "}
                  <Link href={`/projects/${tuner.slug}`}>Try the filter model</Link>
                </FigCaption>
              </figure>
            </div>
          </div>
        </article>
      </section>

      <section className={`container ${s.index}`} aria-labelledby="work-h" data-reveal>
        <div className="row">
          <h2 id="work-h" className={`margin ${s.sectionLabel}`}>
            <span className="silk">Bill of materials</span>
            More work
          </h2>
          <div className="main">
            <WorkIndex items={rest} />
            <p className={s.discreet}>
              <Link href="/projects">All projects</Link>
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className={`container ${s.colophon}`} aria-labelledby="contact-h" data-reveal>
        <div className="row">
          <h2 id="contact-h" className={`margin ${s.sectionLabel}`}>
            <span className="silk">P1 · debug header</span>
            About and contact
          </h2>
          <div className="main">
            <p className={s.closing}>{profile.closing}</p>
            <dl className={s.contactList} aria-label="Contact">
              <div className={s.pin}>
                <dt>Email</dt>
                <dd><a href={`mailto:${profile.email}`}>{profile.email}</a></dd>
              </div>
              <div className={s.pin}>
                <dt>GitHub</dt>
                <dd><a href={profile.github}>github.com/Jbamidi</a></dd>
              </div>
              <div className={s.pin}>
                <dt>LinkedIn</dt>
                <dd><a href={profile.linkedin}>linkedin.com/in/jashwanthbamidi</a></dd>
              </div>
              <div className={s.pin}>
                <dt>Résumé</dt>
                <dd><Link href="/resume">View or download</Link></dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
