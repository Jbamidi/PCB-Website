"use client";

import { useState } from "react";
import { describeBearing, relativeBearing } from "@/lib/demo-models/spatial";
import styles from "./demos.module.css";

const SOURCE = 40; // world bearing of the fixed source, degrees clockwise from north

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const sweep = to > from ? 1 : 0;
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large} ${sweep} ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

export function SpatialCoordinates() {
  const [yaw, setYaw] = useState(0);
  const rel = relativeBearing(SOURCE, yaw);
  const [sx, sy] = polar(160, 170, 128, SOURCE);
  const [nx, ny] = polar(160, 170, 46, yaw);
  // second dial: the head frame, nose always up
  const [rx, ry] = polar(160, 170, 118, rel);

  return (
    <div className={styles.spatial}>
      <div className={styles.spatialGrid}>
        <figure className={styles.dial}>
          <svg viewBox="0 0 320 330" role="img" aria-label={`World view from above. The source is fixed at ${SOURCE} degrees. The head faces ${yaw} degrees.`}>
            <circle cx={160} cy={170} r={128} fill="none" stroke="var(--rule)" />
            <text x={160} y={28} textAnchor="middle" fontSize={13} fill="var(--muted)" fontFamily="var(--sans)">north, 0°</text>
            <line x1={160} y1={42} x2={160} y2={56} stroke="var(--muted)" />
            <line x1={160} y1={170} x2={sx} y2={sy} stroke="var(--accent-2)" strokeWidth={1.5} strokeDasharray="6 4" />
            <circle cx={sx} cy={sy} r={9} fill="var(--accent-2)" />
            <text x={sx + 14} y={sy + 4} fontSize={14} fill="var(--ink)" fontFamily="var(--sans)">source</text>
            {/* head */}
            <circle cx={160} cy={170} r={26} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />
            <g transform={`rotate(${yaw} 160 170)`}>
              <path d="M152,146 L160,132 L168,146" fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />
              <rect x={130} y={164} width={6} height={14} rx={2} fill="var(--ink)" />
              <rect x={184} y={164} width={6} height={14} rx={2} fill="var(--ink)" />
            </g>
            <line x1={160} y1={170} x2={nx} y2={ny} stroke="var(--accent)" strokeWidth={2} />
            {Math.abs(rel) > 2 ? <path d={arc(160, 170, 70, yaw, yaw + rel)} fill="none" stroke="var(--accent)" strokeWidth={1.5} /> : null}
          </svg>
          <figcaption>World frame, from above</figcaption>
        </figure>
        <figure className={styles.dial}>
          <svg viewBox="0 0 320 330" role="img" aria-label={`Head frame. The source appears ${describeBearing(rel)}, at ${rel} degrees.`}>
            <circle cx={160} cy={170} r={118} fill="none" stroke="var(--rule)" />
            {[-90, 90, 180].map((d) => {
              const [tx, ty] = polar(160, 170, 136, d);
              return (
                <text key={d} x={tx} y={ty + 4} textAnchor="middle" fontSize={12} fill="var(--muted)" fontFamily="var(--mono)">
                  {d === 180 ? "±180" : d > 0 ? "+90" : "−90"}
                </text>
              );
            })}
            <text x={160} y={38} textAnchor="middle" fontSize={13} fill="var(--muted)" fontFamily="var(--sans)">nose, 0°</text>
            <circle cx={160} cy={170} r={26} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />
            <path d="M152,146 L160,132 L168,146" fill="var(--paper)" stroke="var(--ink)" strokeWidth={1.5} />
            <line x1={160} y1={170} x2={rx} y2={ry} stroke="var(--accent-2)" strokeWidth={1.5} strokeDasharray="6 4" />
            <circle cx={rx} cy={ry} r={9} fill="var(--accent-2)" />
          </svg>
          <figcaption>Head frame, what the renderer needs</figcaption>
        </figure>
      </div>
      <label className={styles.toneSlider}>
        <span>
          Head yaw: <span className="mono">{yaw > 0 ? "+" : ""}{yaw}°</span> (positive turns right)
        </span>
        <input type="range" min={-180} max={180} step={1} value={yaw} onChange={(e) => setYaw(Number(e.target.value))} aria-valuetext={`${yaw} degrees`} />
      </label>
      <dl className={styles.readings} aria-live="polite">
        <div><dt>Source, world</dt><dd className="mono">{SOURCE}°</dd></div>
        <div><dt>Head yaw</dt><dd className="mono">{yaw}°</dd></div>
        <div><dt>Source, head-relative</dt><dd className="mono">{rel > 0 ? "+" : ""}{rel}°</dd></div>
        <div><dt>Heard</dt><dd>{describeBearing(rel)}</dd></div>
      </dl>
      <p className={styles.hint}>
        Degrees clockwise, positive to the right. Relative bearing = wrap(source − yaw).
      </p>
    </div>
  );
}
