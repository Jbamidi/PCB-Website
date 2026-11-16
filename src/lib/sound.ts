// Optional bench sounds, off by default: a soft relay click (power-on, pressing a part)
// and a faint 50 Hz mains hum that swells in as the board powers up and fades away.
// Synthesised with the Web Audio API, so there are no files to download. Nothing plays
// until the visitor turns sound on with the PWR switch in the header.

const KEY = "jb-sound";
let ctx: AudioContext | null = null;
const listeners = new Set<(on: boolean) => void>();

export function soundOn(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function setSound(on: boolean) {
  try {
    if (on) localStorage.setItem(KEY, "on");
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l(on));
  if (on) playClick();
}

export function onSoundChange(l: (on: boolean) => void) {
  listeners.add(l);
  return () => void listeners.delete(l);
}

function audio(): AudioContext | null {
  if (!soundOn() || typeof window === "undefined") return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** a relay: a 4 ms band-passed noise burst with a short ring */
export function playClick(gain = 0.18) {
  const a = audio();
  if (!a) return;
  const len = Math.floor(a.sampleRate * 0.03);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (a.sampleRate * 0.004));
  const src = a.createBufferSource();
  src.buffer = buf;
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2400;
  bp.Q.value = 1.4;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(bp).connect(g).connect(a.destination);
  src.start();
}

/** mains hum with its odd harmonics: swells over rise seconds, holds, then fades */
export function playHum(rise = 0.8, hold = 0.6, fall = 1.4) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const out = a.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(0.05, t + rise);
  out.gain.setValueAtTime(0.05, t + rise + hold);
  out.gain.linearRampToValueAtTime(0, t + rise + hold + fall);
  out.connect(a.destination);
  for (const [f, level] of [[50, 1], [150, 0.35], [250, 0.15]] as const) {
    const o = a.createOscillator();
    o.frequency.value = f;
    const g = a.createGain();
    g.gain.value = level;
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + rise + hold + fall + 0.05);
  }
}
