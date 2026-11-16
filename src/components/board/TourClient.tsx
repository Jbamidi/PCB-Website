"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { focus } from "./focus";
import { useBoard } from "./store";
import type { Side } from "./stops";
import s from "./tour.module.css";

/** a readout card: slides in from its edge while the camera is at its part */
export function TourCard({ id, side, children }: { id: string; side: Side; children: ReactNode }) {
  const active = useBoard((st) => st.stop === id);
  return (
    <article className={s.card} data-side={side} data-active={active || undefined} data-card={id}>
      {children}
    </article>
  );
}

/**
 * A thin cobalt leader from the active card's inner edge to its part on the board, the way
 * a datasheet callout points at a pin. Drawn every frame from where the camera rig says the
 * part is, and faded out while the camera travels between stops.
 */
export function LeaderLine() {
  const path = useRef<SVGPathElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const card = document.querySelector<HTMLElement>(`[data-card="${focus.id}"]`);
      const show = card && focus.visible && focus.hold > 0.05;
      if (!svg.current || !path.current || !dot.current) return;
      svg.current.style.opacity = show ? String(Math.min(1, focus.hold * 1.6)) : "0";
      if (!show) return;
      const r = card.getBoundingClientRect();
      const left = card.dataset.side === "left";
      // leave the card at its inner edge, a third of the way down, run out level, then angle to the part
      const x0 = left ? r.right : r.left;
      const y0 = r.top + Math.min(r.height / 3, 120);
      const x1 = x0 + (left ? 36 : -36);
      path.current.setAttribute("d", `M ${x0} ${y0} H ${x1} L ${focus.x} ${focus.y}`);
      dot.current.setAttribute("cx", String(focus.x));
      dot.current.setAttribute("cy", String(focus.y));
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <svg ref={svg} className={s.leader} aria-hidden="true">
      <path ref={path} />
      <circle ref={dot} r={4} />
    </svg>
  );
}
