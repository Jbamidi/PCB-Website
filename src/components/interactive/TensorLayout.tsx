"use client";

import { useState } from "react";
import { DIMS, coordsFromShd, hsdIndex, shdIndex } from "@/lib/demo-models/tensor";
import styles from "./demos.module.css";

const N = DIMS.S * DIMS.H * DIMS.D;

export function TensorLayout() {
  const [sel, setSel] = useState(shdIndex(2, 1, 0));
  const { s, h, d } = coordsFromShd(sel);
  const outIdx = hsdIndex(s, h, d);
  const label = (i: number) => {
    const c = coordsFromShd(i);
    return `s${c.s} h${c.h} d${c.d}`;
  };
  // output memory position -> source element
  const outOrder = Array.from({ length: N }, (_, o) => {
    const dd = o % DIMS.D;
    const ss = Math.floor(o / DIMS.D) % DIMS.S;
    const hh = Math.floor(o / (DIMS.D * DIMS.S));
    return shdIndex(ss, hh, dd);
  });

  return (
    <div className={styles.tensor}>
      <p className={styles.fixtureNote}>
        4 tokens, 2 heads, 3 features each, in memory order.
      </p>
      <h3 className={styles.demoHead}>Before: [token][head][feature]</h3>
      <div className={styles.mem} role="group" aria-label="Input memory">
        {Array.from({ length: N }, (_, i) => (
          <button
            key={i}
            type="button"
            className={styles.cell}
            aria-pressed={sel === i}
            data-head={coordsFromShd(i).h}
            onClick={() => setSel(i)}
            aria-label={`Input address ${i}: token ${coordsFromShd(i).s}, head ${coordsFromShd(i).h}, feature ${coordsFromShd(i).d}`}
          >
            <span className={styles.addr}>{i}</span>
            <span>{label(i)}</span>
          </button>
        ))}
      </div>
      <h3 className={styles.demoHead}>After: [head][token][feature]</h3>
      <div className={styles.mem} role="group" aria-label="Output memory">
        {outOrder.map((src, o) => (
          <button
            key={o}
            type="button"
            className={styles.cell}
            aria-pressed={sel === src}
            data-head={coordsFromShd(src).h}
            onClick={() => setSel(src)}
            aria-label={`Output address ${o}: token ${coordsFromShd(src).s}, head ${coordsFromShd(src).h}, feature ${coordsFromShd(src).d}`}
          >
            <span className={styles.addr}>{o}</span>
            <span>{label(src)}</span>
          </button>
        ))}
      </div>
      <p className={styles.readout} aria-live="polite">
        Token {s}, head {h}, feature {d}: input address <span className="mono">({s}·{DIMS.H} + {h})·{DIMS.D} + {d} = {sel}</span>, output address{" "}
        <span className="mono">({h}·{DIMS.S} + {s})·{DIMS.D} + {d} = {outIdx}</span>.
      </p>
      <p className={styles.hint}>
        Head 1 is shaded. After the permutation each head&apos;s values sit together.
      </p>
    </div>
  );
}
