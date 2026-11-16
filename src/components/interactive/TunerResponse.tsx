"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { TUNER_MODEL, bandpassMagnitude, crossoverFrequency, sampleResponses, tunerDecision } from "@/lib/demo-models/tuner";
import { chartColors } from "@/lib/themes";
import styles from "./demos.module.css";

const tick = { fontSize: 13, fill: chartColors.axis, fontFamily: "var(--font-mono), monospace" };

export function TunerResponse() {
  const m = TUNER_MODEL;
  const data = useMemo(() => sampleResponses(2), []);
  const fc = useMemo(() => crossoverFrequency(), []);
  const [f, setF] = useState(645);
  const low = bandpassMagnitude(f, m.lowF0, m.q);
  const high = bandpassMagnitude(f, m.highF0, m.q);
  const decision = tunerDecision(f);
  const verdict =
    decision === "below" ? "the 630 Hz path is larger, so the indicator reads below target" : decision === "above" ? "the 690 Hz path is larger, so the indicator reads above target" : "the two paths are equal";

  return (
    <div className={styles.tuner}>
      <div className={styles.legend} aria-hidden="true">
        <span><svg width="28" height="8"><line x1="0" y1="4" x2="28" y2="4" stroke={chartColors.series1} strokeWidth="2" /></svg> 630 Hz filter</span>
        <span><svg width="28" height="8"><line x1="0" y1="4" x2="28" y2="4" stroke={chartColors.series2} strokeWidth="2" strokeDasharray="7 4" /></svg> 690 Hz filter</span>
        <span><svg width="28" height="8"><line x1="0" y1="4" x2="28" y2="4" stroke={chartColors.ink} strokeWidth="1" strokeDasharray="2 4" /></svg> 660 Hz target</span>
      </div>
      <div className={styles.chartBox} role="img" aria-label={`Response chart. At ${f} hertz the 630 hertz filter magnitude is ${low.toFixed(2)} and the 690 hertz filter magnitude is ${high.toFixed(2)}. The curves cross at ${fc.toFixed(1)} hertz.`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 16, bottom: 28, left: 4 }}>
            <CartesianGrid stroke={chartColors.grid} vertical={false} />
            <XAxis
              dataKey="f"
              type="number"
              domain={[m.fMin, m.fMax]}
              ticks={[500, 550, 600, 650, 700, 750, 800]}
              tick={tick}
              stroke={chartColors.axis}
              label={{ value: "frequency, Hz", position: "insideBottomRight", offset: -18, fontSize: 13, fill: chartColors.axis }}
            />
            <YAxis domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tick={tick} stroke={chartColors.axis} width={44} />
            <ReferenceLine x={m.target} stroke={chartColors.ink} strokeDasharray="2 4" />
            <Line type="monotone" dataKey="low" stroke={chartColors.series1} strokeWidth={2} dot={false} isAnimationActive={false} name="630 Hz filter" />
            <Line type="monotone" dataKey="high" stroke={chartColors.series2} strokeWidth={2} strokeDasharray="7 4" dot={false} isAnimationActive={false} name="690 Hz filter" />
            <ReferenceLine x={f} stroke={chartColors.ink} strokeWidth={1.5} />
            <ReferenceDot x={f} y={low} r={5} fill={chartColors.series1} stroke="var(--paper)" strokeWidth={2} />
            <ReferenceDot x={f} y={high} r={5} fill={chartColors.series2} stroke="var(--paper)" strokeWidth={2} />
            <ReferenceDot x={fc} y={bandpassMagnitude(fc, m.lowF0, m.q)} r={4} fill="var(--paper)" stroke={chartColors.ink} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <label className={styles.toneSlider}>
        <span>
          Test tone: <span className="mono">{f} Hz</span>
        </span>
        <input type="range" min={560} max={760} step={1} value={f} onChange={(e) => setF(Number(e.target.value))} aria-valuetext={`${f} hertz`} />
      </label>
      <dl className={styles.readings} aria-live="polite">
        <div><dt>630 Hz filter</dt><dd className="mono">{low.toFixed(3)}</dd></div>
        <div><dt>690 Hz filter</dt><dd className="mono">{high.toFixed(3)}</dd></div>
        <div><dt>Calculated crossover</dt><dd className="mono">{fc.toFixed(1)} Hz</dd></div>
        <div><dt>Target</dt><dd className="mono">{m.target} Hz</dd></div>
      </dl>
      <p className={styles.readout}>At {f} Hz, {verdict}.</p>
      <details className={styles.method}>
        <summary>Model and sampled values</summary>
        <p>
          <span className="mono">H(f; f0, Q) = ((f/f0)/Q) / √((1 − (f/f0)²)² + ((f/f0)/Q)²)</span>, with f0 = 630 and 690 Hz and Q = 12 for both, sampled from 500 to 820 Hz.
        </p>
        <table className="data">
          <thead>
            <tr><th className="num">Hz</th><th className="num">630 Hz filter</th><th className="num">690 Hz filter</th></tr>
          </thead>
          <tbody>
            {[560, 600, 630, 645, 660, 675, 690, 720, 760].map((x) => (
              <tr key={x}>
                <td className="num">{x}</td>
                <td className="num">{bandpassMagnitude(x, m.lowF0, m.q).toFixed(3)}</td>
                <td className="num">{bandpassMagnitude(x, m.highF0, m.q).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
