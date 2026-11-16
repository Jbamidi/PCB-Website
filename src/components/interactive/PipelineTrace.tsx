"use client";

import { useMemo, useState } from "react";
import { PROGRAMS, buildTrace } from "@/lib/demo-models/pipeline";
import styles from "./demos.module.css";

export function PipelineTrace() {
  const [pid, setPid] = useState(PROGRAMS[1].id);
  const prog = PROGRAMS.find((p) => p.id === pid)!;
  const trace = useMemo(() => buildTrace(prog.prog), [prog]);
  const [cycle, setCycle] = useState(trace.cycles); // columns revealed
  const shown = Math.min(cycle, trace.cycles);
  const choose = (id: string) => {
    setPid(id);
    setCycle(buildTrace(PROGRAMS.find((p) => p.id === id)!.prog).cycles);
  };
  const fwdShown = trace.forwards.filter((f) => f.cycle < shown);
  const instrs = prog.prog.length;

  return (
    <div className={styles.trace}>
      <div role="group" aria-label="Program" className={styles.fixtures}>
        {PROGRAMS.map((p) => (
          <button key={p.id} type="button" className="text-btn" aria-pressed={pid === p.id} onClick={() => choose(p.id)}>
            {p.label}
          </button>
        ))}
      </div>
      <p className={styles.fixtureNote}>{prog.note}</p>
      <div className={styles.bookControls}>
        <button type="button" className="btn" onClick={() => setCycle(1)}>Reset to cycle 1</button>
        <button type="button" className="btn" onClick={() => setCycle((c) => Math.min(trace.cycles, c + 1))} disabled={shown >= trace.cycles}>
          Step clock
        </button>
        <button type="button" className="btn" onClick={() => setCycle(trace.cycles)} disabled={shown >= trace.cycles}>
          Show all
        </button>
        <p className={styles.bookStatus} aria-live="polite">
          Showing cycles 1 to {shown} of {trace.cycles}.
        </p>
      </div>
      <div className={styles.traceScroll} tabIndex={0} aria-label="Pipeline trace table, scrolls horizontally on small screens">
        <table className={`data ${styles.traceTable}`}>
          <thead>
            <tr>
              <th scope="col">Instruction</th>
              {Array.from({ length: trace.cycles }, (_, c) => (
                <th key={c} scope="col" className={styles.cc}>{c + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trace.rows.map((r, i) => (
              <tr key={i} className={r.bubble ? styles.bubble : undefined}>
                <th scope="row" className="mono">{r.bubble ? "bubble (nop)" : r.label}</th>
                {r.cells.map((cell, c) => (
                  <td key={c} className={`${styles.cc} ${c < shown && cell ? styles[`st_${cell}`] ?? "" : ""}`}>
                    {c < shown ? (cell === "stall" ? "hold" : cell) : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className={styles.fwdList} aria-live="polite">
        {fwdShown.length ? (
          fwdShown.map((f, i) => (
            <li key={i}>
              Cycle {f.cycle + 1}: <span className="mono">x{f.reg}</span> forwarded from {f.path} into EX for{" "}
              <span className="mono">{prog.prog[f.to].text}</span>
            </li>
          ))
        ) : (
          <li className="muted">{trace.forwards.length ? "Step further to see forwarding." : "No forwarding needed in this program."}</li>
        )}
      </ul>
      <p className={styles.hint}>
        {instrs} instructions finish in {trace.cycles} cycles under this model{trace.stalls ? `, including ${trace.stalls} bubble` : ""}. "hold" marks a stalled stage.
      </p>
    </div>
  );
}
