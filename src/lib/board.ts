// The board map (board/parts.json, written by board/generate_board.py) seen from the
// site: which part each piece of work is, and which status LED it shows.
import board from "../../board/parts.json";

export type Part = { ref: string; x: number; y: number; w: number; h: number; populated: boolean };
export type LedState = "on" | "planned" | "off";

const parts = board.parts as Record<string, Part>;

export function partFor(slug: string): Part | undefined {
  return parts[slug];
}

/** Reference designator for a piece of work, e.g. "U3" or "J2" */
export function refFor(slug: string): string | undefined {
  return parts[slug]?.ref;
}

/** Green for built or demonstrated work, amber for anything still in progress */
export function ledFor(status: string): LedState {
  return status.startsWith("In progress") ? "planned" : "on";
}

/** The bench instrument each demo sits in, named in silkscreen above its bezel */
export const instruments: Record<string, string> = {
  "fpga-edge-detection": "Monitor · camera in, edges out",
  visionvest: "Motor driver readout",
  "hardware-guitar-tuner": "Oscilloscope · filter response",
  "fpga-orderbook": "Logic analyzer · packet replay",
  "risc-v-cpu": "Logic analyzer · pipeline capture",
  "cuda-attention-kernels": "Memory inspector",
  "spatial-audio-research": "IMU readout",
  "eco-illini": "Assembly bench",
  "archer-aviation": "Bench probe",
  "high-speed-fpga-pcb": "Planning sheet",
};
