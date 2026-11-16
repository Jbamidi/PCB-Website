// The process panel of the edge-detection triptych: three line buffers and the 3×3 window.

export function LineWindow() {
  const cols = 10, rows = 6, c = 26, ox = 12, oy = 34;
  const cells = [];
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++) {
      const inBuf = r >= 1 && r <= 3;
      cells.push(
        <rect
          key={`${r}-${k}`}
          x={ox + k * c}
          y={oy + r * c}
          width={c}
          height={c}
          fill={inBuf ? "color-mix(in srgb, var(--accent) 8%, var(--paper))" : "var(--paper)"}
          stroke="var(--rule)"
        />,
      );
    }
  const wx = ox + 4 * c, wy = oy + 1 * c;
  return (
    <svg viewBox="0 0 350 300" role="img" aria-label="A grid of pixels. Three rows are held in line buffers, and a three by three window over them feeds the Sobel step." style={{ display: "block", width: "100%", height: "auto" }}>
      <text x={ox} y={20} fontSize={13} fill="var(--muted)" fontFamily="var(--sans)">raster order →</text>
      {cells}
      <rect x={wx} y={wy} width={3 * c} height={3 * c} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
      {[0, 1, 2].map((i) => (
        <text key={i} x={ox + cols * c + 8} y={oy + (i + 1) * c + 18} fontSize={12} fill="var(--ink)" fontFamily="var(--mono)">
          row {["n−2", "n−1", "n"][i]}
        </text>
      ))}
      <line x1={wx + 1.5 * c} y1={wy + 3 * c} x2={wx + 1.5 * c} y2={250} stroke="var(--accent)" strokeWidth={1.5} markerEnd="url(#lw-arrow)" />
      <defs>
        <marker id="lw-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,1 L9,5 L0,9" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
        </marker>
      </defs>
      <text x={wx + 1.5 * c} y={272} textAnchor="middle" fontSize={14} fill="var(--ink)" fontFamily="var(--sans)">|Gx| + |Gy| ≥ threshold</text>
    </svg>
  );
}
