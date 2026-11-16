"use client";

import { useEffect } from "react";

/**
 * Draws the experience timeline's copper trace as you scroll: the list (marked
 * data-exp-trace) gets --drawn, how far down the trace has reached (the middle of the
 * screen), and each role it has reached gets data-lit, lighting its connector pad.
 */
export function ExpTrace() {
  useEffect(() => {
    const list = document.querySelector<HTMLElement>("[data-exp-trace]");
    if (!list) return;
    const items = Array.from(list.children) as HTMLElement[];
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = list.getBoundingClientRect();
      const reach = window.innerHeight * 0.55 - r.top;
      list.style.setProperty("--drawn", `${Math.max(0, Math.min(r.height, reach))}px`);
      for (const it of items) it.toggleAttribute("data-lit", it.getBoundingClientRect().top + 40 <= window.innerHeight * 0.55);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return null;
}
