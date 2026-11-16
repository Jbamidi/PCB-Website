"use client";

import { useState } from "react";
import { FIXTURES, decideOutput, isLive, type Zone } from "@/lib/demo-models/visionvest";
import { VestDrawing } from "@/components/figures/VestDrawing";
import styles from "./demos.module.css";

const ZONES: Zone[] = ["front", "back", "left", "right"];
const SOURCE_TEXT = {
  danger: "Local danger alert",
  phone: "Live phone command",
  caution: "Local caution alert",
  idle: "Nothing; all motors off",
} as const;

export function HapticFlow() {
  const [fx, setFx] = useState(FIXTURES[0].id);
  const [now, setNow] = useState(120);
  const f = FIXTURES.find((x) => x.id === fx)!;
  const out = decideOutput({ mode: f.mode, command: f.command, hazards: f.hazards, now });
  const live = isLive(f.command, now);
  const active = Object.fromEntries(ZONES.map((z) => [z, out.duty[z] > 0])) as Record<Zone, boolean>;
  const max = 600;

  return (
    <div className={styles.haptic}>
      <div role="group" aria-label="Documented case" className={styles.fixtures}>
        {FIXTURES.map((x) => (
          <button key={x.id} type="button" className="text-btn" aria-pressed={fx === x.id} onClick={() => setFx(x.id)}>
            {x.label}
          </button>
        ))}
      </div>
      <p className={styles.fixtureNote}>{f.note}</p>

      <div className={styles.hapticGrid}>
        <div className={styles.hapticVest}>
          <VestDrawing active={active} />
        </div>
        <div>
          <label className={styles.toneSlider}>
            <span>
              Time since the command arrived: <span className="mono">{now} ms</span>
            </span>
            <input type="range" min={0} max={max} step={10} value={now} onChange={(e) => setNow(Number(e.target.value))} aria-valuetext={`${now} milliseconds`} />
          </label>
          <div className={styles.ttlBar} aria-hidden="true">
            <div className={styles.ttlLive} style={{ width: `${(f.command.ttlMs / max) * 100}%` }}>
              <span>live for {f.command.ttlMs} ms</span>
            </div>
            <div className={styles.ttlNow} style={{ left: `${(now / max) * 100}%` }} />
          </div>

          <ol className={styles.chain} aria-live="polite">
            <li>
              <span className={styles.chainK}>Phone sent</span>
              <span>
                <span className="mono">{f.command.direction}</span>, intensity <span className="mono">{f.command.intensity}</span>, lifetime{" "}
                <span className="mono">{f.command.ttlMs} ms</span>, mode <span className="mono">{f.mode}</span>
              </span>
            </li>
            <li>
              <span className={styles.chainK}>Command state</span>
              <span>{live ? "live" : "expired, removed"}</span>
            </li>
            <li>
              <span className={styles.chainK}>Local sensors</span>
              <span>
                {f.mode !== "awareness"
                  ? "ignored in this mode"
                  : f.hazards.map((h) => `${h.sensor} ${h.distanceCm} cm (${h.level})`).join(", ")}
              </span>
            </li>
            <li>
              <span className={styles.chainK}>Output owned by</span>
              <span>
                <strong>{SOURCE_TEXT[out.source]}</strong>
                {out.pattern !== "none" ? `, ${out.pattern}` : ""}
              </span>
            </li>
          </ol>

          <table className="data">
            <caption className="visually-hidden">Requested intensity and applied motor duty</caption>
            <thead>
              <tr><th>Motor</th><th className="num">Requested</th><th className="num">Applied duty</th></tr>
            </thead>
            <tbody>
              {ZONES.map((z) => (
                <tr key={z}>
                  <td>{z}</td>
                  <td className="num">{live && f.command.direction === z ? f.command.intensity : "—"}</td>
                  <td className="num">{out.duty[z] ? `${out.duty[z]} (on)` : "0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.hint}>Active motors run at full duty, 255, whatever intensity is requested.</p>
        </div>
      </div>
    </div>
  );
}
