// The homepage tour: where the camera sits as you scroll. The first stop is the whole
// board; after that the camera visits every part in turn, in a path around the board,
// while a readout card for that part docks at the screen edge opposite it. Stops are
// generated from the board items, so a new project becomes a stop on its own (it joins
// the path after the listed ones). Sections opt in with stopAttrs(id).
import { boardItems, BOARD_SIZE, type BoardItem } from "./boardData";

export type Side = "left" | "right";

export type Stop = {
  id: string;
  /** label on the scope trace */
  label: string;
  /** which side the readout card docks on; the part is framed on the other */
  side: Side;
  /** what the camera looks at, in board mm (origin top-left) */
  at: [number, number];
  /** distance from the target in mm, elevation and azimuth in degrees (azimuth 0 = from the front edge, negative = from the left) */
  orbit: [number, number, number];
  /** lens shift as fractions of the frame width (x) and height (y); defaults to keeping the part clear of the card */
  shift?: [number, number];
  /** parts outlined on the board while this stop is in view */
  spot: string[];
  /** the part this stop is about (none for the overview) */
  item?: BoardItem;
};

/** the tour order: the edge connectors (roles), then the projects in the order Jashwanth chose, then the debug header */
const PATH = [
  "archer-aviation",
  "eco-illini",
  "spatial-audio-research",
  "high-speed-fpga-pcb",
  "visionvest",
  "hardware-guitar-tuner",
  "fpga-edge-detection",
  "risc-v-cpu",
  "fpga-orderbook",
  "cuda-attention-kernels",
  "contact",
];

const ordered = [
  ...PATH.map((slug) => boardItems.find((i) => i.slug === slug)).filter(Boolean),
  ...boardItems.filter((i) => !PATH.includes(i.slug)).sort((a, b) => a.x - b.x),
] as BoardItem[];
// the debug header always ends the tour
const tour = [...ordered.filter((i) => i.slug !== "contact"), ...ordered.filter((i) => i.slug === "contact")];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function partStop(item: BoardItem): Stop {
  const size = Math.max(item.w, item.h);
  // the card goes on the side away from the part, so parts on the left half get cards on the right
  const side: Side = item.x < BOARD_SIZE.w / 2 ? "right" : "left";
  // swing the camera a little toward the part's side of the board, so the tour has some sway
  const az = clamp(((item.x - BOARD_SIZE.w / 2) / (BOARD_SIZE.w / 2)) * 26, -26, 26);
  return { id: item.slug, label: item.ref, side, at: [item.x, item.y], orbit: [clamp(size * 4.4 + 24, 58, 135), 50, az], spot: [item.slug], item };
}

export const STOPS: Stop[] = [
  // the whole board, centred and filling the screen below the name
  { id: "hero", label: "Board", side: "left", at: [80, 50], orbit: [300, 58, 0], shift: [0, 0.085], spot: [] },
  ...tour.map(partStop),
];

/** attributes that make a section a tour stop (the camera stop, its card side, its scope-trace label) */
export function stopAttrs(id: string) {
  const stop = STOPS.find((s) => s.id === id);
  if (!stop) throw new Error(`no tour stop "${id}"`);
  return { "data-stop": stop.id, "data-side": stop.side, "data-trace": stop.label };
}

/** lens shift that frames the part in the free part of the screen: a card on the left pushes the part right */
export const shiftFor = (side: Side) => (side === "left" ? -0.17 : 0.17);
