"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { gsap } from "gsap";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  BOARD_SIZE,
  PART_GROUPS,
  boxFaces,
  groupOffset,
  iso,
  type PartGroup,
  type PartId,
  type Vec3,
} from "@/lib/demo-models/assembly";
import styles from "./assembly.module.css";

const Assembly3D = dynamic(() => import("./Assembly3D"), {
  ssr: false,
  loading: () => <p className={styles.loading}>Loading 3D view…</p>,
});

const SCALE = 30;

// Fixed viewBox covering the assembled and fully exploded states.
const VIEW = (() => {
  const pts: [number, number][] = [];
  const corners = (at: Vec3, s: Vec3, off: Vec3 = [0, 0, 0]) => {
    for (const dx of [0, s[0]]) for (const dy of [0, s[1]]) for (const dz of [0, s[2]])
      pts.push(iso([at[0] + dx + off[0], at[1] + dy + off[1], at[2] + dz + off[2]], SCALE));
  };
  corners([0, -BOARD_SIZE[1], 0], BOARD_SIZE);
  for (const g of PART_GROUPS) for (const b of g.blocks) { corners(b.at, b.size); corners(b.at, b.size, g.offset); }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const pad = 56;
  const x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
  return { x, y, w: Math.max(...xs) - x + pad, h: Math.max(...ys) - y + pad / 2 };
})();

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function AssemblyExplorer({ idPrefix = "pdu" }: { idPrefix?: string }) {
  const [sep, setSep] = useState(0);
  const [selected, setSelected] = useState<PartId | null>(null);
  const [view3d, setView3d] = useState(false);
  const [canWebgl, setCanWebgl] = useState(false);
  const anim = useRef<gsap.core.Tween | null>(null);

  useEffect(() => setCanWebgl(webglAvailable()), []);
  useEffect(() => () => void anim.current?.kill(), []);

  const goTo = (target: number) => {
    anim.current?.kill();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSep(target);
      return;
    }
    const v = { sep };
    anim.current = gsap.to(v, { sep: target, duration: 0.6, ease: "none", onUpdate: () => setSep(v.sep) });
  };

  const reset = () => {
    goTo(0);
    setSelected(null);
  };

  const exploded = sep > 0.5;
  const current = PART_GROUPS.find((g) => g.id === selected) ?? null;

  // Painter's order: back to front by displaced depth.
  const drawList = useMemo(() => {
    const items = PART_GROUPS.flatMap((g) => {
      const off = groupOffset(g, sep);
      return g.blocks.map((b) => ({ g, b, off, depth: b.at[0] + off[0] + b.at[2] + off[2] + (b.at[1] + off[1]) * 0.01 }));
    });
    return items.sort((a, b) => a.depth - b.depth);
  }, [sep]);

  const board = boxFaces([0, -BOARD_SIZE[1], 0], BOARD_SIZE, [0, 0, 0], SCALE);

  const onKey = (e: KeyboardEvent, id: PartId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelected(id);
    }
  };

  return (
    <div className={styles.explorer}>
      <div className={styles.stage} style={{ aspectRatio: `${VIEW.w.toFixed(0)} / ${VIEW.h.toFixed(0)}` }}>
        {view3d ? (
          <Assembly3D separation={sep} selected={selected} onSelect={setSelected} onFail={() => setView3d(false)} />
        ) : (
          <svg
            className={styles.svg}
            viewBox={`${VIEW.x.toFixed(0)} ${VIEW.y.toFixed(0)} ${VIEW.w.toFixed(0)} ${VIEW.h.toFixed(0)}`}
            role="group"
            aria-label="Conceptual exploded drawing of the power distribution unit with four selectable groups"
          >
            <g className={styles.board} aria-hidden="true">
              <polygon points={board.left} className={styles.faceLeft} />
              <polygon points={board.right} className={styles.faceRight} />
              <polygon points={board.top} className={styles.boardTop} />
            </g>

            {/* leaders from each displaced block back to its seat on the board */}
            {sep > 0.02 &&
              PART_GROUPS.map((g) => {
                const off = groupOffset(g, sep);
                return g.blocks.map((b) => {
                  const c: Vec3 = [b.at[0] + b.size[0] / 2, 0, b.at[2] + b.size[2] / 2];
                  const [x1, y1] = iso(c, SCALE);
                  const [x2, y2] = iso([c[0] + off[0], off[1], c[2] + off[2]], SCALE);
                  return (
                    <g key={`lead-${b.id}`} aria-hidden="true">
                      <polygon
                        className={styles.seat}
                        points={[
                          iso([b.at[0], 0, b.at[2]], SCALE),
                          iso([b.at[0] + b.size[0], 0, b.at[2]], SCALE),
                          iso([b.at[0] + b.size[0], 0, b.at[2] + b.size[2]], SCALE),
                          iso([b.at[0], 0, b.at[2] + b.size[2]], SCALE),
                        ].map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ")}
                      />
                      <line className={styles.leader} x1={x1} y1={y1} x2={x2} y2={y2} />
                    </g>
                  );
                });
              })}

            {drawList.map(({ g, b, off }) => {
              const f = boxFaces(b.at, b.size, off, SCALE);
              const cls = [styles.block, selected === g.id ? styles.selected : "", selected && selected !== g.id ? styles.dim : ""].join(" ");
              return (
                <g key={b.id} className={cls} onClick={() => setSelected(g.id)} aria-hidden="true">
                  <polygon points={f.left} className={styles.faceLeft} />
                  <polygon points={f.right} className={styles.faceRight} />
                  <polygon points={f.top} className={styles.faceTop} />
                </g>
              );
            })}

            {PART_GROUPS.map((g) => (
              <GroupLabel key={g.id} g={g} sep={sep} selected={selected === g.id} onSelect={() => setSelected(g.id)} onKey={(e) => onKey(e, g.id)} />
            ))}
          </svg>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <div role="group" aria-label="Assembly state" className={styles.segment}>
            <button type="button" className="btn" aria-pressed={!exploded} onClick={() => goTo(0)}>
              Assembled
            </button>
            <button type="button" className="btn" aria-pressed={exploded} onClick={() => goTo(1)}>
              Exploded
            </button>
          </div>
          <label className={styles.slider}>
            <span>Separation</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(sep * 100)}
              aria-valuetext={`${Math.round(sep * 100)} percent separated`}
              onChange={(e) => {
                anim.current?.kill();
                setSep(Number(e.target.value) / 100);
              }}
            />
          </label>
          <button type="button" className="btn" onClick={reset}>
            Reset
          </button>
          {canWebgl ? (
            <button type="button" className={`text-btn ${styles.toggle3d}`} aria-pressed={view3d} onClick={() => setView3d((v) => !v)}>
              {view3d ? "Back to drawing" : "Rotate in 3D"}
            </button>
          ) : null}
        </div>

        <div role="group" aria-label="Part groups" className={styles.parts}>
          {PART_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              id={`${idPrefix}-part-${g.id}`}
              className="text-btn"
              aria-pressed={selected === g.id}
              onClick={() => setSelected((s) => (s === g.id ? null : g.id))}
            >
              {g.name}
            </button>
          ))}
        </div>
        <p className={styles.partDetail} aria-live="polite">
          {current ? (
            <>
              <strong>{current.name}.</strong> {current.sentence}{" "}
              <Link href={current.related.href}>{current.related.label}</Link>
            </>
          ) : (
            <span className="muted">Choose a group to see what it does on the board.</span>
          )}
        </p>
      </div>
    </div>
  );
}

function GroupLabel({
  g,
  sep,
  selected,
  onSelect,
  onKey,
}: {
  g: PartGroup;
  sep: number;
  selected: boolean;
  onSelect: () => void;
  onKey: (e: KeyboardEvent) => void;
}) {
  const off = groupOffset(g, sep);
  // anchor above the group's tallest block
  const top = g.blocks.reduce((a, b) => (b.size[1] > a.size[1] ? b : a));
  const [ax, ay] = iso([top.at[0] + top.size[0] / 2 + off[0], top.size[1] + off[1], top.at[2] + top.size[2] / 2 + off[2]], SCALE);
  const lx = ax + (g.id === "protection" || g.id === "interfaces" ? -64 : 64);
  const ly = ay - 34;
  const anchor = lx < ax ? "end" : "start";
  return (
    <g
      className={`${styles.label} ${selected ? styles.labelOn : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${g.name}: select group`}
      onClick={onSelect}
      onKeyDown={onKey}
    >
      <line x1={ax} y1={ay} x2={lx} y2={ly + 6} className={styles.labelLine} />
      <rect x={anchor === "end" ? lx - 110 : lx - 6} y={ly - 22} width={116} height={34} className={styles.labelHit} />
      <text x={lx} y={ly} textAnchor={anchor}>
        {g.name}
      </text>
    </g>
  );
}
