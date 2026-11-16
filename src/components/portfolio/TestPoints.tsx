"use client";

import { useEffect } from "react";

/**
 * Runs the test points down the margin. The section being read (the last whose top has
 * passed a line a third of the way down the screen) gets data-active, the ones above it
 * data-passed, and a copper trace joining the markers draws down to the active one: the
 * article gets --tp-x, --tp-top, --tp-height (the whole run) and --tp-fill (drawn so far).
 */
export function TestPoints() {
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-tp]"));
    const article = sections[0]?.closest("article");
    if (!sections.length || !article) return;
    let frame = 0;
    const marker = (s: HTMLElement) => s.querySelector<HTMLElement>("h2 > a");
    const update = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      let active = -1;
      sections.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= line) active = i;
      });
      sections.forEach((s, i) => {
        s.toggleAttribute("data-active", i === active);
        s.toggleAttribute("data-passed", i < active);
      });
      // the trace runs between marker centres (each marker's dot is its first 12 px)
      const first = marker(sections[0]), last = marker(sections[sections.length - 1]);
      if (!first || !last) return;
      const box = article.getBoundingClientRect();
      const centre = (m: HTMLElement) => {
        const r = m.getBoundingClientRect();
        return { x: r.left - box.left + 6, y: r.top - box.top + r.height / 2 };
      };
      const a = centre(first), b = centre(last);
      const upTo = active >= 0 ? centre(marker(sections[active])!).y : a.y;
      article.style.setProperty("--tp-x", `${a.x - 1}px`);
      article.style.setProperty("--tp-top", `${a.y}px`);
      article.style.setProperty("--tp-height", `${Math.max(0, b.y - a.y)}px`);
      article.style.setProperty("--tp-fill", `${Math.max(0, upTo - a.y)}px`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    const ro = new ResizeObserver(onScroll);
    ro.observe(article);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return null;
}
