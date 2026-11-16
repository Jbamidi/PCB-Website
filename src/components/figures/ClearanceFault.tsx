// Not-to-scale drawing of the Archer bring-up fault: a pour-to-pad clearance rule
// entered in the wrong units lets the ground pour reach a 24 V through-hole pad.

function Panel({ x, gap, title, note, fault }: { x: number; gap: number; title: string; note: string; fault?: boolean }) {
  const cx = x + 150, cy = 130, pad = 34, drill = 14;
  return (
    <g>
      <text x={x + 10} y={26} fontFamily="var(--serif)" fontSize={18} fill="var(--ink)">{title}</text>
      {/* ground pour with a relief hole around the pad */}
      <defs>
        <mask id={`m-${x}`}>
          <rect x={x} y={44} width={300} height={170} fill="white" />
          <circle cx={cx} cy={cy} r={pad + gap} fill="black" />
        </mask>
      </defs>
      <rect x={x + 10} y={50} width={280} height={160} fill="color-mix(in srgb, var(--ink) 10%, var(--paper))" mask={`url(#m-${x})`} stroke="none" />
      <text x={x + 20} y={200} fontSize={13} fill="var(--muted)" fontFamily="var(--sans)">ground pour</text>
      <circle cx={cx} cy={cy} r={pad} fill="none" stroke={fault ? "var(--accent-2)" : "var(--ink)"} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={drill} fill="var(--paper)" stroke="var(--ink)" strokeWidth={1} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12} fill="var(--ink)" fontFamily="var(--mono)">24 V</text>
      {gap > 4 ? (
        <g>
          <line x1={cx + pad} y1={cy - 60} x2={cx + pad} y2={cy - 40} stroke="var(--ink)" strokeWidth={0.8} />
          <line x1={cx + pad + gap} y1={cy - 60} x2={cx + pad + gap} y2={cy - 40} stroke="var(--ink)" strokeWidth={0.8} />
          <text x={cx + pad + gap / 2} y={cy - 64} textAnchor="middle" fontSize={12} fill="var(--ink)" fontFamily="var(--mono)">gap</text>
        </g>
      ) : (
        <g>
          <text x={cx} y={cy - pad - 14} textAnchor="middle" fontSize={13} fill="var(--accent-2)" fontFamily="var(--sans)">pour touches pad</text>
        </g>
      )}
      <text x={x + 10} y={240} fontSize={14} fill="var(--ink)" fontFamily="var(--sans)">{note}</text>
    </g>
  );
}

export function ClearanceFault() {
  return (
    <svg viewBox="0 0 660 260" role="img" aria-label="Two drawings of the same through-hole pad. On the left, the intended clearance leaves a ring of bare board between the ground pour and the 24 volt pad. On the right, the clearance entered in the wrong units is roughly fifty times smaller, so the pour reaches the pad and shorts 24 volts to ground." style={{ display: "block", width: "100%", height: "auto" }}>
      <Panel x={0} gap={22} title="Intended rule" note="10 mil (0.254 mm) to the pour" />
      <Panel x={350} gap={0.4} title="Rule as entered" note="about 0.18 mil: the pour reaches the pad" fault />
    </svg>
  );
}
