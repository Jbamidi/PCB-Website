"use client";

import { useState, type KeyboardEvent } from "react";
import type { Diagram, DiagramEdge, DiagramNode } from "@/content/diagrams";
import styles from "./figures.module.css";

/**
 * Data-driven architecture drawing. Wide screens get the SVG; narrow screens get an
 * ordered list of the same nodes so labels stay readable. Nodes with `detail` are
 * selectable with pointer or keyboard; the explanation appears in a live region.
 */
export function BlockDiagram({ diagram, label }: { diagram: Diagram; label: string }) {
  const selectable = diagram.nodes.some((n) => n.detail);
  const [selected, setSelected] = useState<string | null>(diagram.initial ?? null);
  const [mode, setMode] = useState<string | null>(diagram.modes?.[0]?.id ?? null);

  const activeSet = mode ? new Set(diagram.modes!.find((m) => m.id === mode)!.nodes) : null;
  const dimNode = (id: string) => (activeSet ? !activeSet.has(id) : false);
  const byId = Object.fromEntries(diagram.nodes.map((n) => [n.id, n])) as Record<string, DiagramNode>;
  const current = selected ? byId[selected] : null;

  const choose = (id: string) => setSelected((s) => (s === id ? s : id));
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(id);
    }
  };

  return (
    <div className={styles.diagram} data-mobile={diagram.mobile ?? "list"}>
      {diagram.modes ? (
        <div className={styles.modes} role="group" aria-label="Highlight">
          {diagram.modes.map((m) => (
            <button key={m.id} type="button" className="text-btn" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      ) : null}

      <svg
        className={styles.diagramSvg}
        viewBox={`0 0 ${diagram.width} ${diagram.height}`}
        role="group"
        aria-label={label}
      >
        <defs>
          {(["ink", "primary", "secondary", "muted"] as const).map((t) => (
            <marker key={t} id={`arrow-${diagram.id}-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,1 L9,5 L0,9" fill="none" stroke={t === "ink" ? "var(--ink)" : t === "primary" ? "var(--accent)" : t === "secondary" ? "var(--accent-2)" : "var(--muted)"} strokeWidth="1.5" />
            </marker>
          ))}
        </defs>
        {diagram.regions?.map((r) => (
          <g key={r.label}>
            <rect className={styles.region} x={r.x} y={r.y} width={r.w} height={r.h} />
            <text className={styles.regionLabel} x={r.x + 10} y={r.y + 20}>{r.label}</text>
          </g>
        ))}
        {diagram.edges.map((e, i) => (
          <Edge key={i} e={e} nodes={byId} diagramId={diagram.id} dim={activeSet ? !(activeSet.has(e.from) && activeSet.has(e.to)) : false} />
        ))}
        {diagram.nodes.map((n) => {
          const canSelect = !!n.detail;
          const cls = [styles.node, n.tone ? styles[n.tone] : "", canSelect ? styles.selectable : "", selected === n.id ? styles.selected : "", dimNode(n.id) ? styles.dim : ""].join(" ");
          const lines = n.label.split("\n");
          const cy = n.y + n.h / 2 - ((lines.length - 1) * 18) / 2 - (n.sub ? 8 : 0);
          return (
            <g
              key={n.id}
              className={cls}
              {...(canSelect
                ? {
                    role: "button",
                    tabIndex: 0,
                    "aria-pressed": selected === n.id,
                    "aria-label": `${n.label.replace("\n", " ")}${n.sub ? `, ${n.sub}` : ""}`,
                    onClick: () => choose(n.id),
                    onKeyDown: (e: KeyboardEvent) => onKey(e, n.id),
                  }
                : {})}
            >
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={2} />
              {lines.map((l, i) => (
                <text key={i} x={n.x + n.w / 2} y={cy + i * 18} textAnchor="middle" dominantBaseline="middle">
                  {l}
                </text>
              ))}
              {n.sub ? (
                <text className={styles.sub} x={n.x + n.w / 2} y={cy + lines.length * 18 + 2} textAnchor="middle" dominantBaseline="middle">
                  {n.sub}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <ol className={styles.diagramList} aria-label={`${label}, as a list`}>
        {diagram.nodes.map((n) => (
          <li key={n.id} className={styles.listItem} data-tone={n.tone ?? "ink"} style={dimNode(n.id) ? { opacity: 0.4 } : undefined}>
            {n.detail ? (
              <button type="button" className={styles.listButton} aria-pressed={selected === n.id} onClick={() => choose(n.id)}>
                <span className={styles.listTitle}>{n.label.replace("\n", " ")}</span>
                {n.sub ? <span className={styles.listSub}>{n.sub}</span> : null}
              </button>
            ) : (
              <>
                <span className={styles.listTitle}>{n.label.replace("\n", " ")}</span>
                {n.sub ? <span className={styles.listSub}>{n.sub}</span> : null}
              </>
            )}
          </li>
        ))}
      </ol>

      {selectable ? (
        <div className={styles.detail} aria-live="polite">
          {current ? (
            <>
              <strong>{current.label.replace("\n", " ")}.</strong> {current.detail}
            </>
          ) : (
            <span className="muted">Select a block to see what it does.</span>
          )}
        </div>
      ) : null}
    </div>
  );
}

function anchor(n: DiagramNode, side: "l" | "r" | "t" | "b"): [number, number] {
  if (side === "l") return [n.x, n.y + n.h / 2];
  if (side === "r") return [n.x + n.w, n.y + n.h / 2];
  if (side === "t") return [n.x + n.w / 2, n.y];
  return [n.x + n.w / 2, n.y + n.h];
}

function Edge({ e, nodes, diagramId, dim }: { e: DiagramEdge; nodes: Record<string, DiagramNode>; diagramId: string; dim: boolean }) {
  const a = nodes[e.from];
  const b = nodes[e.to];
  let d: string;
  let lx: number, ly: number;
  if (e.path) {
    d = e.path;
    [lx, ly] = e.labelAt ?? [0, 0];
  } else {
    const horizontal = e.dir ? e.dir === "h" : b.x >= a.x + a.w || b.x + b.w <= a.x;
    if (horizontal) {
      const fwd = b.x >= a.x + a.w;
      const [x1, y1] = anchor(a, fwd ? "r" : "l");
      const [x2, y2] = anchor(b, fwd ? "l" : "r");
      const mx = (x1 + x2) / 2;
      d = y1 === y2 ? `M${x1},${y1} H${x2}` : `M${x1},${y1} H${mx} V${y2} H${x2}`;
      lx = mx; ly = Math.min(y1, y2) - 8;
    } else {
      const down = b.y >= a.y + a.h;
      const [x1, y1] = anchor(a, down ? "b" : "t");
      const [x2, y2] = anchor(b, down ? "t" : "b");
      const my = (y1 + y2) / 2;
      d = x1 === x2 ? `M${x1},${y1} V${y2}` : `M${x1},${y1} V${my} H${x2} V${y2}`;
      lx = x1 + 8; ly = my;
    }
    if (e.labelAt) [lx, ly] = e.labelAt;
  }
  const tone = e.tone ?? "ink";
  const marker = tone === "primary" ? "primary" : tone === "secondary" ? "secondary" : tone === "side" ? "muted" : "ink";
  return (
    <g>
      <path
        d={d}
        className={`${styles.edge} ${e.tone ? styles[e.tone] : ""} ${dim ? styles.dim : ""}`}
        markerEnd={e.noArrow ? undefined : `url(#arrow-${diagramId}-${marker})`}
        markerStart={e.both ? `url(#arrow-${diagramId}-${marker})` : undefined}
      />
      {e.label ? (
        <text className={styles.edgeLabel} x={lx} y={ly} textAnchor={e.labelAnchor ?? "middle"}>
          {e.label}
        </text>
      ) : null}
    </g>
  );
}
