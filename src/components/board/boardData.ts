// What the live board needs to know about each interactive part, assembled from the
// content records and the board map. Plain data, so the server can render the part list.
import { experiences } from "@/content/experiences";
import { projects } from "@/content/projects";
import { partFor, ledFor, type LedState } from "@/lib/board";
import board from "../../../board/parts.json";

export type BoardItem = {
  slug: string;
  ref: string;
  title: string;
  line: string;
  status: string;
  led: LedState;
  href: string;
  kind: "experience" | "project" | "contact";
  /** footprint centre and size in board mm, origin at the board's top-left corner */
  x: number;
  y: number;
  w: number;
  h: number;
  populated: boolean;
};

export type BoardLed = { ref: string; x: number; y: number; color: "on" | "planned"; breathe: boolean };

export const BOARD_SIZE = board.board as { w: number; h: number };

const fromStudy = (s: (typeof projects)[number] | (typeof experiences)[number], kind: BoardItem["kind"]): BoardItem | null => {
  const p = partFor(s.slug);
  if (!p) return null;
  return {
    slug: s.slug,
    ref: p.ref,
    title: s.shortTitle ?? s.title,
    line: s.line,
    status: s.status,
    led: ledFor(s.status),
    href: `/${kind === "experience" ? "experience" : "projects"}/${s.slug}`,
    kind,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    populated: p.populated,
  };
};

const contactPart = partFor("contact")!;

/** Connectors first (left edge, top to bottom), then the projects by reference designator, then the debug header */
export const boardItems: BoardItem[] = [
  ...(experiences.map((e) => fromStudy(e, "experience")).filter(Boolean) as BoardItem[]),
  ...(projects.map((p) => fromStudy(p, "project")).filter(Boolean) as BoardItem[]).sort((a, b) => a.ref.localeCompare(b.ref, "en", { numeric: true })),
  {
    ...contactPart,
    slug: "contact",
    title: "Contact",
    line: "Email, GitHub, LinkedIn and the résumé.",
    status: "Debug header",
    led: "on",
    href: "/#contact",
    kind: "contact",
  },
];

/** Status LEDs: D1–D7 beside the projects they report on, D9 for power, D10–D12 for the rails */
export const boardLeds: BoardLed[] = Object.entries(board.parts)
  .filter(([id]) => id.startsWith("led-"))
  .map(([id, p]) => {
    const project = id.match(/^led-u(\d)$/) ? boardItems.find((i) => i.ref === `U${id.slice(5)}`) : undefined;
    const planned = project?.led === "planned";
    return { ref: p.ref, x: p.x, y: p.y, color: planned ? "planned" : "on", breathe: planned };
  });
