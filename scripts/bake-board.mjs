// Bakes the top of the board into textures for the live 3D board, so the browser draws one
// textured plane instead of ~1.2M triangles of tracks, pours and silkscreen.
// Inputs: board/web/layers/*.svg (kicad-cli pcb export svg, one layer each, board area only).
// Outputs in public/board/: surface-color.webp (sRGB, alpha = board outline and holes),
// surface-orm.webp (glTF packing: G roughness, B metallic) and surface-normal.webp.
// Run: npm run board:web (exports the layers, bakes, and builds the parts model).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const W = 3072; // 19.2 px/mm across the 160 mm board: a 0.1 mm trace is ~2 px
const BOARD = { w: 160, h: 100, r: 3 };
const H = Math.round((W * BOARD.h) / BOARD.w);
const PX = W / BOARD.w;
const HOLES = [[4.5, 4.5], [155.5, 4.5], [4.5, 95.5], [155.5, 95.5]].map(([x, y]) => ({ x, y, r: 1.6 }));
const OUT = "public/board";

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
// colours match the Blender look-dev (green mask), seen from above in daylight
const C = {
  laminate: hex("#0F3F27"), // mask over bare FR-4
  copper: hex("#886335"), // copper seen through the mask: copper with a quarter of the mask green mixed in (a look, not physics)
  gold: hex("#D4AE62"), // ENIG pads in mask openings
  bare: hex("#3A3424"), // mask opening with no copper
  silk: hex("#E8E6DC"),
  hole: hex("#050605"),
};

/** coverage 0..1 of a black-and-white layer plot */
async function layer(name) {
  const density = (W / (BOARD.w / 25.4)); // dpi that maps the board width to W pixels
  const { data, info } = await sharp(`board/web/layers/${name}.svg`, { density, limitInputPixels: false })
    .resize(W, H, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cov = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const o = i * info.channels;
    const lum = (data[o] + data[o + 1] + data[o + 2]) / 765;
    cov[i] = (data[o + 3] / 255) * (1 - lum);
  }
  return cov;
}

/** 1 inside the rounded outline and outside the mounting holes, antialiased */
function outlineAlpha(x, y) {
  const mx = x / PX, my = y / PX;
  const dx = Math.max(BOARD.r - mx, mx - (BOARD.w - BOARD.r), 0);
  const dy = Math.max(BOARD.r - my, my - (BOARD.h - BOARD.r), 0);
  let d = BOARD.r - Math.hypot(dx, dy); // >0 inside
  d = Math.min(d, mx, my, BOARD.w - mx, BOARD.h - my);
  for (const h of HOLES) d = Math.min(d, Math.hypot(mx - h.x, my - h.y) - h.r);
  return Math.max(0, Math.min(1, d * PX + 0.5));
}

const mix = (a, b, t) => a + (b - a) * t;

const [cu, mask, silk] = await Promise.all([layer("F.Cu"), layer("F.Mask"), layer("F.Silkscreen")]);
// drill holes plot as white inside copper; find them as gaps fully surrounded by copper is
// overkill here, so vias and through holes simply read as mask-over-laminate dots

const color = Buffer.alloc(W * H * 4);
const orm = Buffer.alloc(W * H * 3);
const height = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) {
  const x = i % W, y = (i / W) | 0;
  const c = cu[i], open = mask[i], s = silk[i] * (1 - open);
  const covered = [0, 1, 2].map((k) => mix(C.laminate[k], C.copper[k], c));
  const exposed = [0, 1, 2].map((k) => mix(C.bare[k], C.gold[k], c));
  const base = [0, 1, 2].map((k) => mix(covered[k], exposed[k], open));
  const px = [0, 1, 2].map((k) => Math.round(mix(base[k], C.silk[k], s)));
  color[i * 4] = px[0]; color[i * 4 + 1] = px[1]; color[i * 4 + 2] = px[2];
  color[i * 4 + 3] = Math.round(outlineAlpha(x, y) * 255);
  // roughness: satin mask 0.38, gold 0.24, silk ink 0.8; metallic only on gold
  const metal = c * open;
  const rough = mix(mix(0.38, 0.24, metal), 0.8, s);
  orm[i * 3] = 255; orm[i * 3 + 1] = Math.round(rough * 255); orm[i * 3 + 2] = Math.round(metal * 255);
  // copper is 35 µm proud of the laminate and the mask follows it; silk sits on top
  height[i] = c * 0.7 + s * 0.4;
}

// normal map from the height field (small box blur first, so edges read as soft mask shoulders)
async function normalMap(size) {
  const blurred = await sharp(Buffer.from(Uint8Array.from(height, (v) => Math.round(Math.min(1, v) * 255))), { raw: { width: W, height: H, channels: 1 } })
    .blur(1.2)
    .resize(size, Math.round((size * H) / W))
    .raw()
    .toBuffer({ resolveWithObject: true });
  // sharp may hand back more than one channel for a one-channel input; read the first
  // channel at the real stride, or every row is sampled at the wrong place (striped normals)
  const { width: w, height: h, channels: ch } = blurred.info;
  const hv = blurred.data;
  const out = Buffer.alloc(w * h * 3);
  const strength = 2.2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const at = (xx, yy) => hv[(Math.min(h - 1, Math.max(0, yy)) * w + Math.min(w - 1, Math.max(0, xx))) * ch] / 255;
      const nx = (at(x - 1, y) - at(x + 1, y)) * strength;
      const ny = (at(x, y - 1) - at(x, y + 1)) * strength;
      const len = Math.hypot(nx, ny, 1);
      const o = (y * w + x) * 3;
      out[o] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      out[o + 1] = Math.round(((-ny / len) * 0.5 + 0.5) * 255); // glTF/three: +Y up in tangent space
      out[o + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
    }
  return sharp(out, { raw: { width: w, height: h, channels: 3 } });
}

await mkdir(OUT, { recursive: true });
await sharp(color, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 88, alphaQuality: 90, effort: 5 }).toFile(`${OUT}/surface-color.webp`);
await sharp(orm, { raw: { width: W, height: H, channels: 3 } }).resize(2048).webp({ quality: 80, effort: 5 }).toFile(`${OUT}/surface-orm.webp`);
await (await normalMap(2048)).webp({ quality: 85, effort: 5 }).toFile(`${OUT}/surface-normal.webp`);
// a small flat preview, also handy as the texture while the full one streams in
await sharp(color, { raw: { width: W, height: H, channels: 4 } }).resize(768).webp({ quality: 80 }).toFile(`${OUT}/surface-color-768.webp`);
console.log(`bake-board: ${W}x${H} surface written to ${OUT}`);
