// Sign convention: degrees, clockwise from the reference direction ("north" for the
// world, the nose for the head). Positive = to the listener's right.
// For a world-fixed source: head-relative bearing = wrap(sourceWorld - headYaw).

export function wrapDeg(a: number): number {
  let x = (((a + 180) % 360) + 360) % 360 - 180;
  if (x === -180) x = 180;
  return x;
}

export function relativeBearing(sourceWorldDeg: number, headYawDeg: number): number {
  return wrapDeg(sourceWorldDeg - headYawDeg);
}

export function describeBearing(rel: number): string {
  const a = Math.abs(rel);
  if (a < 5) return "straight ahead";
  if (a > 175) return "directly behind";
  const side = rel > 0 ? "right" : "left";
  if (a < 80) return `ahead and to the ${side}`;
  if (a <= 100) return `to the ${side}`;
  return `behind and to the ${side}`;
}
