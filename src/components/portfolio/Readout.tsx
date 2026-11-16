"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import s from "./case.module.css";

// a measured quantity in a result: a number not glued to a word (so "INA228", "ESP32",
// "Spartan-7" and "0x0800" stay as they are); four-digit years are left alone too
const NUMBER = /(?<![A-Za-z0-9\-.×x])(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?![A-Za-z0-9])/g;
const isYear = (n: string) => /^(19|20)\d\d$/.test(n);

function Count({ value }: { value: string }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = Number(value.replace(/,/g, ""));
    const decimals = value.includes(".") ? value.split(".")[1].length : 0;
    const grouped = value.includes(",");
    const fmt = (v: number) => {
      const fixed = v.toFixed(decimals);
      return grouped ? Number(fixed).toLocaleString("en-US", { minimumFractionDigits: decimals }) : fixed;
    };
    let tween: gsap.core.Tween | null = null;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const o = { v: 0 };
        // the reading settles like a meter: fast, then easing into the final value
        tween = gsap.to(o, { v: target, duration: 1.1, ease: "power3.out", onUpdate: () => void (node.textContent = fmt(o.v)), onComplete: () => void (node.textContent = value) });
      },
      { threshold: 0.6 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [value]);
  return (
    <span ref={el} className={s.num}>
      {value}
    </span>
  );
}

/**
 * A result sentence with its measured numbers set as meter readings that count up when
 * they come into view. The text is complete and correct without scripts (and for screen
 * readers, which get the final values).
 */
export function Readout({ text }: { text: string }) {
  const parts: (string | { n: string })[] = [];
  let last = 0;
  for (const m of text.matchAll(NUMBER)) {
    if (isYear(m[0])) continue;
    parts.push(text.slice(last, m.index), { n: m[0] });
    last = m.index! + m[0].length;
  }
  parts.push(text.slice(last));
  return (
    <span>
      {parts.map((p, i) => (typeof p === "string" ? p : <Count key={i} value={p.n} />))}
    </span>
  );
}
