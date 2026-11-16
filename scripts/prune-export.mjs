// Post-processes out/ after `next build`:
// 1. Drops the full-size source images; pages only load the WebP copies in images/opt
//    (see src/lib/image-loader.ts). Sources stay in public/.
// 2. Writes flat copies of Next's prefetch segment files. The export nests them as
//    __next.experience/$d$slug/__PAGE__.txt, but the client router requests
//    __next.experience.$d$slug.__PAGE__.txt; a static host can't rewrite that, so
//    without the copies every client-side navigation 404s and falls back to a reload.
import { copyFile, readdir, rm } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "out");

let removed = 0;
const images = path.join(OUT, "images");
for (const entry of await readdir(images, { withFileTypes: true })) {
  if (entry.isFile() && /\.(png|jpe?g|webp)$/i.test(entry.name)) {
    await rm(path.join(images, entry.name));
    removed++;
  }
}
for (const empty of ["data", "models"]) await rm(path.join(OUT, empty), { recursive: true, force: true });
// full-size originals kept in public/images/source for re-exporting; no page uses them
await rm(path.join(images, "source"), { recursive: true, force: true });

let flattened = 0;
async function flatten(segDir, prefix, parent) {
  for (const entry of await readdir(segDir, { withFileTypes: true })) {
    const name = `${prefix}.${entry.name}`;
    const full = path.join(segDir, entry.name);
    if (entry.isDirectory()) await flatten(full, name, parent);
    else {
      await copyFile(full, path.join(parent, name));
      flattened++;
    }
  }
}
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith("__next.")) await flatten(full, entry.name, dir);
    else if (entry.name !== "_next") await walk(full);
  }
}
await walk(OUT);

console.log(`prune-export: removed ${removed} source images, wrote ${flattened} flat prefetch files`);
