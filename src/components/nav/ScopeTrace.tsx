"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import s from "./nav.module.css";

type Marker = { id: string; label: string; at: number };

const H = 1000; // viewBox height; the trace is drawn top to bottom
const W = 24;

/**
 * A scope trace down the right edge: the waveform draws in as you scroll (it is the
 * progress bar), with a marker for each section that has data-trace. Markers name their
 * section on hover or focus and jump to it on click. Shown on wide screens only, and only
 * on pages with at least three sections.
 */
export function ScopeTrace() {
  const pathname = usePathname();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const path = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(1);

  // find the page's sections once it has rendered (and again when it changes size)
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const found = Array.from(document.querySelectorAll<HTMLElement>("[data-trace]")).map((el, i) => {
        if (!el.id) el.id = `trace-${i}`;
        const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3;
        return { id: el.id, label: el.dataset.trace!, at: Math.min(1, Math.max(0, top / max)) };
      });
      setMarkers(found);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        setProgress(Math.min(1, window.scrollY / max));
      });
    };
    const t = window.setTimeout(measure, 400);
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(t);
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  // a few cycles of a damped ring between each pair of markers, flat at the markers: the
  // signal settles at each stop
  const d = useMemo(() => {
    const pts: string[] = [`M ${W / 2} 0`];
    const stops = [0, ...markers.map((m) => m.at * H), H];
    for (let k = 0; k < stops.length - 1; k++) {
      const y0 = stops[k], y1 = stops[k + 1], span = y1 - y0;
      const n = Math.max(2, Math.round(span / 16));
      for (let j = 1; j <= n; j++) {
        const t = j / n;
        const amp = Math.sin(Math.PI * t) * Math.min(9, span / 14) * Math.exp(-2.2 * t);
        pts.push(`L ${(W / 2 + amp * Math.sin(j * 1.9)).toFixed(1)} ${(y0 + span * t).toFixed(1)}`);
      }
    }
    return pts.join(" ");
  }, [markers]);

  useEffect(() => {
    if (path.current) setLength(path.current.getTotalLength());
  }, [d]);

  useEffect(() => {
    let current: string | null = null;
    for (const m of markers) if (progress + 0.001 >= m.at) current = m.id;
    setActive(current);
  }, [progress, markers]);

  if (markers.length < 3) return null;
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <nav className={s.trace} aria-label="Sections on this page">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={d} className={s.traceGhost} vectorEffect="non-scaling-stroke" />
        <path
          ref={path}
          d={d}
          className={s.traceLive}
          vectorEffect="non-scaling-stroke"
          style={{ strokeDasharray: length, strokeDashoffset: length * (1 - progress) }}
        />
      </svg>
      <ol>
        {markers.map((m) => (
          <li key={m.id} style={{ top: `${m.at * 100}%` }}>
            <button type="button" onClick={() => jump(m.id)} aria-current={active === m.id ? "true" : undefined}>
              <span className={s.traceLabel}>{m.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
