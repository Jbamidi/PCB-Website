// Deterministic browser Sobel demonstration. Not the FPGA RTL and not benchmark footage.
//   grayscale: g = (R + 2G + B) / 4  (the add-and-shift approximation the RTL uses)
//   kernels:   Gx = [-1 0 1; -2 0 2; -1 0 1],  Gy = [-1 -2 -1; 0 0 0; 1 2 1]
//   magnitude: |Gx| + |Gy| (L1, no square root), divided by 8 so 0..2040 maps to 0..255
//   threshold: a pixel is an edge when the scaled magnitude >= threshold
//   borders:   the outer one-pixel ring is 0; the window is not valid there

export const SOBEL_W = 240;
export const SOBEL_H = 180;

export function toGray(r: number, g: number, b: number): number {
  return (r + 2 * g + b) >> 2;
}

/** Original geometric test scene, RGBA. */
export function makeTestImage(w = SOBEL_W, h = SOBEL_H): Uint8ClampedArray {
  const px = new Uint8ClampedArray(w * h * 4);
  const cx = w * 0.3, cy = h * 0.52, rad = h * 0.27;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const t = x / w;
      let r = 236 - 20 * t, g = 230 - 18 * t, b = 218 - 10 * t;
      if (y > h * 0.8) { r = 180; g = 170; b = 156; }
      if ((x - cx) ** 2 + (y - cy) ** 2 < rad * rad) { r = 36; g = 85; b = 214; }
      if (x > w * 0.55 && x < w * 0.88 && y > h * 0.22 && y < h * 0.62) { r = 154; g = 69; b = 30; }
      const tx = w * 0.72, ty = h * 0.66, th = h * 0.3;
      if (y > ty && y < ty + th && Math.abs(x - tx) < (y - ty) * 0.55) { r = 25; g = 35; b = 45; }
      if (y > h * 0.08 && y < h * 0.2 && x > w * 0.06 && x < w * 0.46 && Math.floor(x / 6) % 2 === 0) { r = 25; g = 35; b = 45; }
      px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
    }
  }
  return px;
}

export function grayscale(rgba: Uint8ClampedArray, w: number, h: number): Uint8Array {
  const g = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) g[p] = toGray(rgba[p * 4], rgba[p * 4 + 1], rgba[p * 4 + 2]);
  return g;
}

export function sobelMagnitude(gray: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = (dx: number, dy: number) => gray[(y + dy) * w + (x + dx)];
      const gx = -p(-1, -1) + p(1, -1) - 2 * p(-1, 0) + 2 * p(1, 0) - p(-1, 1) + p(1, 1);
      const gy = -p(-1, -1) - 2 * p(0, -1) - p(1, -1) + p(-1, 1) + 2 * p(0, 1) + p(1, 1);
      out[y * w + x] = Math.min(255, (Math.abs(gx) + Math.abs(gy)) >> 3);
    }
  }
  return out;
}

export function threshold(mag: Uint8Array, t: number): Uint8Array {
  const out = new Uint8Array(mag.length);
  for (let i = 0; i < mag.length; i++) out[i] = mag[i] >= t ? 255 : 0;
  return out;
}
