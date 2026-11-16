// Conceptual PDU assembly. Positions are in an abstract unit space (board 12 x 8),
// not CAD geometry. Each group has a stable assembled position and an explosion
// offset; the drawn position is always base + ease(separation) * offset.
// A real KiCad/Blender export can replace the blocks through the same group ids.

export type Vec3 = [number, number, number];
export type PartId = "power" | "protection" | "interfaces" | "verification";

export type Block = { id: string; at: Vec3; size: Vec3 };

export type PartGroup = {
  id: PartId;
  name: string;
  sentence: string;
  related: { label: string; href: string };
  offset: Vec3;
  blocks: Block[];
};

export const BOARD_SIZE: Vec3 = [12, 0.3, 8];

export const PART_GROUPS: PartGroup[] = [
  {
    id: "power",
    name: "Power",
    sentence: "Buck converters and LDO regulators step the 36 V battery bus down to regulated 12 V and 3.3 V rails.",
    related: { label: "Power tree", href: "/experience/eco-illini#architecture" },
    offset: [0, 2.6, 0],
    blocks: [
      { id: "buck-12", at: [4.4, 0, 0.8], size: [1.7, 0.9, 1.7] },
      { id: "ind-12", at: [6.5, 0, 0.9], size: [1.2, 0.8, 1.2] },
      { id: "reg-3v3", at: [4.6, 0, 3.4], size: [1.2, 0.55, 1.2] },
      { id: "cap-a", at: [8.1, 0, 0.9], size: [0.7, 1.1, 0.7] },
      { id: "cap-b", at: [8.1, 0, 2.0], size: [0.7, 1.1, 0.7] },
    ],
  },
  {
    id: "protection",
    name: "Protection",
    sentence: "Fusing, reverse-polarity protection and the E-STOP path decide whether the rails may energise at all.",
    related: { label: "Protection decisions", href: "/experience/eco-illini#decisions" },
    offset: [0, 1.8, -2.4],
    blocks: [
      { id: "fuse-a", at: [0.7, 0, 0.7], size: [2.1, 0.5, 0.7] },
      { id: "fuse-b", at: [0.7, 0, 1.8], size: [2.1, 0.5, 0.7] },
      { id: "rpp", at: [1.1, 0, 3.1], size: [1.3, 0.45, 1.0] },
    ],
  },
  {
    id: "interfaces",
    name: "Interfaces",
    sentence: "Battery input, the E-STOP loop, temperature sensing and the subsystem outputs leave the board through its connectors.",
    related: { label: "Vehicle integration", href: "/experience/eco-illini#contribution" },
    offset: [0, 1.3, 2.8],
    blocks: [
      { id: "conn-in", at: [0.4, 0, 5.8], size: [2.4, 1.0, 1.5] },
      { id: "conn-a", at: [4.4, 0, 6.2], size: [2.0, 0.9, 1.1] },
      { id: "conn-b", at: [7.2, 0, 6.2], size: [2.0, 0.9, 1.1] },
      { id: "temp", at: [10.2, 0, 4.6], size: [0.8, 0.4, 0.8] },
    ],
  },
  {
    id: "verification",
    name: "Verification",
    sentence: "Rails were checked for load regulation, transients, thermal behaviour and ripple; both rails held under 50 mV peak-to-peak.",
    related: { label: "Validation and limits", href: "/experience/eco-illini#validation" },
    offset: [2.4, 1.0, 0],
    blocks: [
      { id: "tp-1", at: [10.0, 0, 0.9], size: [0.45, 0.9, 0.45] },
      { id: "tp-2", at: [10.9, 0, 0.9], size: [0.45, 0.9, 0.45] },
      { id: "tp-3", at: [10.0, 0, 2.0], size: [0.45, 0.9, 0.45] },
      { id: "tp-4", at: [10.9, 0, 2.0], size: [0.45, 0.9, 0.45] },
    ],
  },
];

export function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/** Displacement of a group from its assembled pose. Pure: same input, same output. */
export function groupOffset(group: PartGroup, separation: number): Vec3 {
  const e = easeInOut(separation);
  return [group.offset[0] * e, group.offset[1] * e, group.offset[2] * e];
}

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

/** Isometric projection for the SVG plate (x right-down, z left-down, y up). */
export function iso([x, y, z]: Vec3, scale = 30): [number, number] {
  return [(x - z) * COS30 * scale, ((x + z) * SIN30 - y) * scale];
}

/** Polygons for the three visible faces of a box at `at` (+ offset). */
export function boxFaces(at: Vec3, size: Vec3, off: Vec3 = [0, 0, 0], scale = 30) {
  const [x, y, z] = [at[0] + off[0], at[1] + off[1], at[2] + off[2]];
  const [w, h, d] = size;
  const p = (a: number, b: number, c: number) => iso([a, b, c], scale).map((n) => n.toFixed(1)).join(",");
  const top = [p(x, y + h, z), p(x + w, y + h, z), p(x + w, y + h, z + d), p(x, y + h, z + d)].join(" ");
  const right = [p(x + w, y, z), p(x + w, y + h, z), p(x + w, y + h, z + d), p(x + w, y, z + d)].join(" ");
  const left = [p(x, y, z + d), p(x + w, y, z + d), p(x + w, y + h, z + d), p(x, y + h, z + d)].join(" ");
  return { top, right, left };
}
