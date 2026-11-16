// Where the tour's current part is on screen, written by the camera rig every frame and
// read by the leader line that joins the readout card to the part. Mutable, not state,
// for the same reason as power.ts: it changes every frame.

export const focus = {
  /** the stop the camera is at or nearest to */
  id: "hero",
  /** the part's centre in viewport pixels */
  x: 0,
  y: 0,
  /** 1 while the camera holds on the stop, falling to 0 midway to the next one */
  hold: 0,
  /** false when the part is behind the camera or off screen */
  visible: false,
};
