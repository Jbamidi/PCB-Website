import type { EvidenceKind } from "@/lib/types";

// Every image slot on the site. While `src` is null the slot renders its finished
// line-drawing fallback at the same aspect ratio, so the layout never shows an empty box.
// To add an image: put the file in /public/images, set `src`, `width`, `height`,
// `provenance`, and check that `kind` and `caption` still describe it honestly.

export type AssetSlot = {
  id: string;
  src: string | null;
  mobileSrc?: string | null;
  width: number;
  height: number;
  /** CSS object-position, e.g. "50% 40%" */
  focal: string;
  alt: string;
  kind: EvidenceKind;
  caption: string;
  provenance: "chatgpt-images" | "photograph" | "cad-render" | "blender-render" | null;
  /** Public build/reference label, never a private path */
  reference?: string;
};

export const assets: Record<string, AssetSlot> = {
  "eco-illini-pdu-render": {
    id: "eco-illini-pdu-render",
    src: "/images/eco-illini-pdu-blender-v2.png",
    width: 2400,
    height: 2400,
    focal: "50% 50%",
    alt: "Three-quarter Blender render of the assembled Eco Illini power distribution board with yellow XT60 connectors, a labeled black relay, microcontroller, regulator circuitry, inductors and a labeled metal DC/DC module on a green PCB.",
    kind: "cad",
    caption: "Blender render from the e7 PDU rev. 0 geometry, with recreated component labels. L1 and F1 use representative models.",
    provenance: "blender-render",
    reference: "e7 PDU rev. 0",
  },
  "hspcb-architecture-plate": {
    id: "hspcb-architecture-plate",
    src: null,
    width: 1800,
    height: 1200,
    focal: "50% 50%",
    alt: "A bare, unpopulated circuit board outline on a warm paper surface with a few loose candidate parts beside it, suggesting a board still being planned.",
    kind: "conceptual",
    caption: "Conceptual illustration of a board in planning; not a design or a fabricated board.",
    provenance: null,
  },
  "pdu-editorial-plate": {
    id: "pdu-editorial-plate",
    src: null,
    mobileSrc: null,
    width: 1800,
    height: 1200,
    focal: "50% 50%",
    alt: "An assembled power distribution board on a warm off-white surface, with input connectors on the left and regulator inductors towards the centre.",
    kind: "conceptual",
    caption: "Eco Illini power distribution unit. Generated from a description; component placement is not the real board.",
    provenance: null,
  },
  "visionvest-system-portrait": {
    id: "visionvest-system-portrait",
    src: "/images/visionvest-render-blender-v3.png",
    width: 1600,
    height: 2000,
    focal: "50% 35%",
    alt: "Three-quarter VisionVest render with a front-mounted camera phone, ultrasonic sensors, yellow tactile motors, an ESP32 powered by a USB power bank, and a separate 9 V battery connected to the motor driver.",
    kind: "conceptual",
    caption: "Illustrative reconstruction with a front-mounted phone, USB power bank for the ESP32 and a separate 9 V motor-driver battery; mounting positions are approximated.",
    provenance: "blender-render",
    reference: "VisionVest demo and user-confirmed phone and power configuration",
  },
  "tuner-analog-detail": {
    id: "tuner-analog-detail",
    src: "/images/tuner-screen-gpt-v2.png",
    width: 1672,
    height: 941,
    focal: "45% 55%",
    alt: "Illustrative oscilloscope screen: yellow CH1 is the 630 Hz filter and cyan CH2 is the 690 Hz filter, with a 660 Hz input, 500 microseconds per division and 500 millivolts per division on both channels.",
    kind: "conceptual",
    caption: "Generated oscilloscope-style illustration of the two filter outputs; displayed scales and traces are illustrative, not measured results.",
    provenance: "chatgpt-images",
  },
  "fpga-camera-system": {
    id: "fpga-camera-system",
    src: null,
    width: 1500,
    height: 1000,
    focal: "50% 50%",
    alt: "A small camera module on jumper wires connected to an FPGA development board, with an HDMI cable leading out of frame.",
    kind: "conceptual",
    caption: "Camera module, FPGA board and HDMI output.",
    provenance: null,
  },
  "spatial-audio-concept": {
    id: "spatial-audio-concept",
    src: null,
    width: 1500,
    height: 1000,
    focal: "50% 45%",
    alt: "Over-ear headphones with a small motion-sensor board fixed to the headband, resting on a warm off-white surface.",
    kind: "conceptual",
    caption: "Head-mounted motion sensor and headphones.",
    provenance: null,
  },
};

export function asset(id: string): AssetSlot {
  const a = assets[id];
  if (!a) throw new Error(`Unknown asset slot ${id}`);
  return a;
}
