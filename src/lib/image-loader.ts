// next/image loader for the static export. Maps a requested width to the nearest
// pre-generated WebP from scripts/optimize-images.mjs (keep WIDTHS in sync).
const WIDTHS = [640, 960, 1280, 1920];
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (!src.startsWith("/images/")) return `${BASE}${src}`;
  const name = src.slice("/images/".length).replace(/\.[^.]+$/, "");
  const w = WIDTHS.find((x) => x >= width) ?? WIDTHS[WIDTHS.length - 1];
  return `${BASE}/images/opt/${name}-${w}.webp`;
}
