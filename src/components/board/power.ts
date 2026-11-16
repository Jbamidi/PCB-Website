// The power-on sequence's progress, shared by the page (PowerOn drives it with a GSAP
// timeline) and the 3D board (which reads it every frame). A plain mutable object rather
// than store state, so a 2-second animation doesn't re-render React 60 times a second.
// Every value runs 0 → 1; at rest everything is 1, so a board with no intro is fully on.

export const power = {
  /** the PWR LED (D9); the intro flickers it */
  pwr: 1,
  /** the 5 V trace drawing from the USB-C input to the regulators */
  trace: 1,
  /** the three rail LEDs, lit in turn (0, 1/3, 2/3, 1) */
  rails: 1,
  /** light spreading across the board from the power section outward */
  reveal: 1,
  /** the camera easing from a low angle into the hero view */
  settle: 1,
  /** the trace glow fading once the board is lit */
  traceFade: 1,
};

export type Power = typeof power;

/** set everything dark before the intro */
export function powerDown() {
  Object.assign(power, { pwr: 0, trace: 0, rails: 0, reveal: 0, settle: 0, traceFade: 0 });
}

export function powerUp() {
  Object.assign(power, { pwr: 1, trace: 1, rails: 1, reveal: 1, settle: 1, traceFade: 1 });
}

/** event LiveBoard fires once the 3D board has drawn, so the page intro can start with it */
export const BOARD_READY_EVENT = "jb-board-ready";
