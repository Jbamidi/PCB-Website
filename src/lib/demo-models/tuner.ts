// Idealised second-order band-pass magnitude used for the tuner illustration.
// Q is an assumed illustration parameter, not a measured project value.

export const TUNER_MODEL = {
  lowF0: 630,
  highF0: 690,
  q: 12,
  target: 660,
  fMin: 500,
  fMax: 820,
} as const;

export type TunerModel = { lowF0: number; highF0: number; q: number; target: number; fMin: number; fMax: number };

export function bandpassMagnitude(f: number, f0: number, q: number): number {
  const r = f / f0;
  const num = r / q;
  return num / Math.sqrt((1 - r * r) ** 2 + num * num);
}

export type ResponseSample = { f: number; low: number; high: number };

export function sampleResponses(step = 2, m: TunerModel = TUNER_MODEL): ResponseSample[] {
  const out: ResponseSample[] = [];
  for (let f = m.fMin; f <= m.fMax + 1e-9; f += step) {
    out.push({ f, low: bandpassMagnitude(f, m.lowF0, m.q), high: bandpassMagnitude(f, m.highF0, m.q) });
  }
  return out;
}

/** Frequency between the two centres where the two magnitudes are equal (bisection). */
export function crossoverFrequency(m: TunerModel = TUNER_MODEL): number {
  let lo = m.lowF0;
  let hi = m.highF0;
  const d = (f: number) => bandpassMagnitude(f, m.lowF0, m.q) - bandpassMagnitude(f, m.highF0, m.q);
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (d(lo) * d(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Which way an ideal matched comparator would point for a pure tone at f. */
export function tunerDecision(f: number, m: TunerModel = TUNER_MODEL): "below" | "above" | "equal" {
  const d = bandpassMagnitude(f, m.lowF0, m.q) - bandpassMagnitude(f, m.highF0, m.q);
  if (Math.abs(d) < 1e-6) return "equal";
  return d > 0 ? "below" : "above";
}

/** SVG path for the static, server-rendered version of the response chart. */
export function responsePath(
  key: "low" | "high",
  width: number,
  height: number,
  samples = sampleResponses(2),
  m: TunerModel = TUNER_MODEL,
): string {
  const x = (f: number) => ((f - m.fMin) / (m.fMax - m.fMin)) * width;
  const y = (v: number) => height - v * height;
  return samples
    .map((s, i) => `${i ? "L" : "M"}${x(s.f).toFixed(1)},${y(s[key]).toFixed(1)}`)
    .join(" ");
}
