import { TUNER_MODEL, crossoverFrequency, responsePath, sampleResponses } from "@/lib/demo-models/tuner";
import styles from "./figures.module.css";

// Server-rendered version of the analytical response chart for the homepage spread.
// Two drawings of the same data: a wide one and a compact one with fewer ticks for phones.
export function StaticTunerChart() {
  return (
    <>
      <div className={styles.wideOnly}>
        <Chart W={760} H={360} ticks={[500, 550, 600, 650, 700, 750, 800]} />
      </div>
      <div className={styles.narrowOnly}>
        <Chart W={380} H={320} ticks={[500, 600, 700, 800]} compact />
      </div>
    </>
  );
}

function Chart({ W, H, ticks, compact = false }: { W: number; H: number; ticks: number[]; compact?: boolean }) {
  const ml = compact ? 36 : 52, mr = 12, mt = 24, mb = 48;
  const pw = W - ml - mr, ph = H - mt - mb;
  const m = TUNER_MODEL;
  const x = (f: number) => ml + ((f - m.fMin) / (m.fMax - m.fMin)) * pw;
  const y = (v: number) => mt + ph - v * ph;
  const samples = sampleResponses(2);
  const fc = crossoverFrequency();
  const atFc = samples.reduce((a, s) => (Math.abs(s.f - fc) < Math.abs(a.f - fc) ? s : a)).low;
  const font = { fontSize: 13, fontFamily: "var(--sans)" } as const;
  const mono = { fontSize: 12.5, fontFamily: "var(--mono)", fill: "var(--muted)" } as const;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Two idealised band-pass responses peaking at 630 and 690 hertz with Q of 12. They cross near ${fc.toFixed(1)} hertz, slightly below the 660 hertz target.`}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <line x1={ml} x2={W - mr} y1={y(v)} y2={y(v)} stroke="var(--rule)" />
          <text x={ml - 8} y={y(v) + 4} textAnchor="end" {...mono}>{v.toFixed(1)}</text>
        </g>
      ))}
      {ticks.map((f) => (
        <text key={f} x={x(f)} y={H - mb + 20} textAnchor="middle" {...mono}>{f}</text>
      ))}
      <text x={W - mr} y={H - 6} textAnchor="end" fill="var(--muted)" {...font}>frequency, Hz</text>
      <text x={ml} y={mt - 10} fill="var(--muted)" {...font}>normalised magnitude</text>

      <line x1={x(m.target)} x2={x(m.target)} y1={mt} y2={mt + ph} stroke="var(--ink)" strokeDasharray="2 4" />
      <text x={x(m.target) + 6} y={mt + ph - 10} fill="var(--ink)" {...font}>660 Hz target</text>

      <g transform={`translate(${ml},${mt})`}>
        <path d={responsePath("low", pw, ph, samples)} fill="none" stroke="var(--accent)" strokeWidth={2} />
        <path d={responsePath("high", pw, ph, samples)} fill="none" stroke="var(--accent-2)" strokeWidth={2} strokeDasharray="7 4" />
      </g>
      <circle cx={x(fc)} cy={y(atFc)} r={4.5} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />
      <line x1={x(fc) - 4} y1={y(atFc) + 4} x2={x(fc) - 24} y2={y(0.32)} stroke="var(--ink)" strokeWidth={0.8} />
      <text x={x(fc) - 28} y={y(0.32) + 12} textAnchor="end" fill="var(--ink)" {...font}>
        {compact ? `cross ${fc.toFixed(1)}` : `crossover ${fc.toFixed(1)} Hz`}
      </text>

      <text x={x(m.lowF0) - 26} y={y(0.95)} textAnchor="end" fill="var(--ink)" {...font}>{compact ? "630 Hz" : "630 Hz filter"}</text>
      <text x={x(m.highF0) + 26} y={y(0.95)} fill="var(--ink)" {...font}>{compact ? "690, dashed" : "690 Hz filter, dashed"}</text>
    </svg>
  );
}
