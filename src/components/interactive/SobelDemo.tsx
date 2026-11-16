"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SOBEL_H, SOBEL_W, grayscale, makeTestImage, sobelMagnitude, threshold } from "@/lib/demo-models/sobel";
import styles from "./demos.module.css";

export function SobelDemo() {
  const [split, setSplit] = useState(50);
  const [t, setT] = useState(40);
  const inRef = useRef<HTMLCanvasElement>(null);
  const outRef = useRef<HTMLCanvasElement>(null);

  const { rgba, mag } = useMemo(() => {
    const rgba = makeTestImage();
    return { rgba, mag: sobelMagnitude(grayscale(rgba, SOBEL_W, SOBEL_H), SOBEL_W, SOBEL_H) };
  }, []);

  useEffect(() => {
    const ctx = inRef.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(SOBEL_W, SOBEL_H);
    img.data.set(rgba);
    ctx.putImageData(img, 0, 0);
  }, [rgba]);

  const edges = useMemo(() => threshold(mag, t), [mag, t]);
  const edgeCount = useMemo(() => edges.reduce((a, v) => a + (v ? 1 : 0), 0), [edges]);

  useEffect(() => {
    const ctx = outRef.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(SOBEL_W, SOBEL_H);
    for (let p = 0; p < edges.length; p++) img.data.set(edges[p] ? [245, 245, 238, 255] : [25, 35, 45, 255], p * 4);
    ctx.putImageData(img, 0, 0);
  }, [edges]);

  return (
    <div className={styles.sobel}>
      <div className={styles.compare}>
        <canvas ref={outRef} width={SOBEL_W} height={SOBEL_H} className={styles.cv} role="img" aria-label="Sobel output: light outlines of each shape on a dark field." />
        <canvas
          ref={inRef}
          width={SOBEL_W}
          height={SOBEL_H}
          className={`${styles.cv} ${styles.cvTop}`}
          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
          role="img"
          aria-label="Input: a test scene with a blue disc, a rust rectangle, a dark triangle and a row of vertical bars."
        />
        <div className={styles.divider} style={{ left: `${split}%` }} aria-hidden="true" />
        <span className={`${styles.tag} ${styles.tagL}`}>Input</span>
        <span className={`${styles.tag} ${styles.tagR}`}>Sobel output</span>
      </div>
      <div className={styles.controlsGrid}>
        <label>
          <span>Divider position: {split}% input</span>
          <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(Number(e.target.value))} />
        </label>
        <label>
          <span>
            Threshold: <span className="mono">{t}</span> of 255
          </span>
          <input type="range" min={8} max={160} value={t} onChange={(e) => setT(Number(e.target.value))} />
        </label>
      </div>
      <p className={styles.readout} aria-live="polite">
        {edgeCount.toLocaleString()} of {(SOBEL_W * SOBEL_H).toLocaleString()} pixels marked as edges at threshold {t}.
      </p>
      <details className={styles.method}>
        <summary>How the browser version computes it</summary>
        <dl>
          <dt>Image</dt>
          <dd>An original 240 × 180 geometric scene generated in code. No camera, no hardware.</dd>
          <dt>Grayscale</dt>
          <dd><span className="mono">g = (R + 2G + B) / 4</span>, the add-and-shift approximation the RTL uses.</dd>
          <dt>Kernels</dt>
          <dd><span className="mono">Gx = [−1 0 1; −2 0 2; −1 0 1]</span>, <span className="mono">Gy = [−1 −2 −1; 0 0 0; 1 2 1]</span>.</dd>
          <dt>Magnitude</dt>
          <dd><span className="mono">|Gx| + |Gy|</span>, divided by 8 so the 0–2040 range fits 0–255, then compared with the threshold.</dd>
          <dt>Edges of the frame</dt>
          <dd>The outer one-pixel ring is set to zero, because the 3×3 window is not complete there.</dd>
        </dl>
      </details>
    </div>
  );
}
