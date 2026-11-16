// Converts the Phase 0 Blender renders into web-sized WebP files for the look-dev page.
// Usage: npm run lookdev:web   (reads renders/phase0/*.png, writes public/lookdev/*.webp)
import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const SRC = "renders/phase0";
const OUT = "public/lookdev";
await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => f.endsWith(".png"));
for (const f of files) {
  const name = f.replace(/\.png$/, "");
  for (const w of [960, 1920]) {
    const out = path.join(OUT, `${name}-${w}.webp`);
    const info = await sharp(path.join(SRC, f)).resize({ width: w, withoutEnlargement: true }).webp({ quality: 86 }).toFile(out);
    console.log(out, info.width, "x", info.height, Math.round(info.size / 1024), "KB");
  }
}
