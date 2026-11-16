// Tiny, explicitly illustrative layout change: [S][H][D] -> [H][S][D].
// It shows why a permute kernel is mostly index arithmetic and memory traffic.
// Not the source-exact project kernel.

export type Dims = { S: number; H: number; D: number };
export const DIMS: Dims = { S: 4, H: 2, D: 3 };

export function shdIndex(s: number, h: number, d: number, dims: Dims = DIMS): number {
  return (s * dims.H + h) * dims.D + d;
}
export function hsdIndex(s: number, h: number, d: number, dims: Dims = DIMS): number {
  return (h * dims.S + s) * dims.D + d;
}

export function permute<T>(src: T[], dims: Dims = DIMS): T[] {
  const out = new Array<T>(src.length);
  for (let s = 0; s < dims.S; s++)
    for (let h = 0; h < dims.H; h++)
      for (let d = 0; d < dims.D; d++) out[hsdIndex(s, h, d, dims)] = src[shdIndex(s, h, d, dims)];
  return out;
}

export function unpermute<T>(src: T[], dims: Dims = DIMS): T[] {
  const out = new Array<T>(src.length);
  for (let s = 0; s < dims.S; s++)
    for (let h = 0; h < dims.H; h++)
      for (let d = 0; d < dims.D; d++) out[shdIndex(s, h, d, dims)] = src[hsdIndex(s, h, d, dims)];
  return out;
}

export function coordsFromShd(i: number, dims: Dims = DIMS) {
  const d = i % dims.D;
  const h = Math.floor(i / dims.D) % dims.H;
  const s = Math.floor(i / (dims.D * dims.H));
  return { s, h, d };
}
