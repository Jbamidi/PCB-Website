"use client";

import { useEffect, useRef } from "react";
import { SOBEL_H, SOBEL_W, grayscale, makeTestImage, sobelMagnitude, threshold } from "@/lib/demo-models/sobel";

/** Draws either the test image or its thresholded Sobel output into a canvas. */
export function SobelCanvas({ which, t = 40, label }: { which: "input" | "output"; t?: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const rgba = makeTestImage();
    const img = ctx.createImageData(SOBEL_W, SOBEL_H);
    if (which === "input") img.data.set(rgba);
    else {
      const edges = threshold(sobelMagnitude(grayscale(rgba, SOBEL_W, SOBEL_H), SOBEL_W, SOBEL_H), t);
      for (let p = 0; p < edges.length; p++) {
        const v = edges[p] ? 245 : 25;
        img.data.set([v, v, edges[p] ? 238 : 35, 255], p * 4);
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [which, t]);
  return (
    <canvas
      ref={ref}
      width={SOBEL_W}
      height={SOBEL_H}
      role="img"
      aria-label={label}
      style={{ width: "100%", height: "auto", display: "block", imageRendering: "pixelated", aspectRatio: `${SOBEL_W} / ${SOBEL_H}` }}
    />
  );
}
