// Pre-generates WebP copies of every image in public/images at the widths the site
// asks for, so the static export can serve responsive images without a server.
// Runs automatically before `npm run build`. Originals are left untouched.
import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

export const WIDTHS = [640, 960, 1280, 1920];
const SRC = "public/images";
const OUT = "public/images/opt";
const QUALITY = 86;

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));

let made = 0;
for (const file of files) {
  const input = path.join(SRC, file);
  const name = file.replace(/\.[^.]+$/, "");
  const srcTime = (await stat(input)).mtimeMs;
  for (const w of WIDTHS) {
    const output = path.join(OUT, `${name}-${w}.webp`);
    // skip work when the output is newer than its source
    const existing = await stat(output).catch(() => null);
    if (existing && existing.mtimeMs >= srcTime) continue;
    await sharp(input).resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY, alphaQuality: 90, effort: 5 }).toFile(output);
    made++;
  }
}
console.log(`optimize-images: ${files.length} sources, ${made} files written to ${OUT}`);
