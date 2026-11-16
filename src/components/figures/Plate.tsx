import Image from "next/image";
import type { ReactNode } from "react";
import { asset } from "@/content/publicAssets";
import styles from "./figures.module.css";

/**
 * An image slot from the asset manifest. While the generated image has not been
 * supplied, the finished fallback drawing renders in its place at the same ratio.
 */
export function Plate({
  slot,
  fallback,
  sizes = "(max-width: 1023px) 100vw, 1180px",
  priority = false,
  keepRatioForFallback = true,
}: {
  slot: string;
  fallback: ReactNode;
  sizes?: string;
  priority?: boolean;
  keepRatioForFallback?: boolean;
}) {
  const a = asset(slot);
  if (!a.src) {
    return (
      <div
        className={styles.plateFallback}
        style={keepRatioForFallback ? { aspectRatio: `${a.width} / ${a.height}` } : undefined}
      >
        {fallback}
      </div>
    );
  }
  return (
    <picture className={styles.plate}>
      {a.mobileSrc ? <source media="(max-width: 639px)" srcSet={a.mobileSrc} /> : null}
      <Image
        src={a.src}
        alt={a.alt}
        width={a.width}
        height={a.height}
        sizes={sizes}
        priority={priority}
        style={{ objectPosition: a.focal }}
      />
    </picture>
  );
}
