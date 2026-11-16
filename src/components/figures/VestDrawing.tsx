// Line drawing of VisionVest's documented layout: four motors, three rangefinders
// (back, left, right) and one controller. Fallback for the visionvest-system-portrait slot.

type Zone = "front" | "back" | "left" | "right";

function vest(cx: number, front: boolean) {
  const neck = front ? `Q${cx},92 ${cx + 30},60` : `Q${cx},70 ${cx + 30},60`;
  return `M${cx - 30},60 ${neck} L${cx + 58},64 L${cx + 64},124 Q${cx + 50},156 ${cx + 66},182 L${cx + 70},360 L${cx - 70},360 L${cx - 66},182 Q${cx - 50},156 ${cx - 64},124 L${cx - 58},64 Z`;
}

export function VestDrawing({ active }: { active?: Partial<Record<Zone, boolean>> }) {
  const ink = "var(--ink)";
  const F = 95, B = 285; // front and back centre lines
  const motor = (x: number, y: number, on?: boolean) => (
    <circle cx={x} cy={y} r={10} fill={on ? "var(--accent)" : "var(--paper)"} stroke={on ? "var(--accent)" : ink} strokeWidth={1.5} />
  );
  const sensor = (x: number, y: number) => (
    <g>
      <rect x={x - 15} y={y - 8} width={30} height={16} rx={2} fill="var(--paper)" stroke="var(--accent-2)" strokeWidth={1.4} />
      <circle cx={x - 7} cy={y} r={4} fill="none" stroke="var(--accent-2)" />
      <circle cx={x + 7} cy={y} r={4} fill="none" stroke="var(--accent-2)" />
    </g>
  );
  const leader = (pts: string, tx: number, ty: number, text: string, anchor: "start" | "middle" | "end" = "start") => (
    <g>
      <polyline points={pts} fill="none" stroke={ink} strokeWidth={0.8} />
      <text x={tx} y={ty} textAnchor={anchor} fontSize={15} fill={ink} fontFamily="var(--sans)">
        {text}
      </text>
    </g>
  );
  return (
    <svg
      viewBox="0 0 500 490"
      role="img"
      aria-label="Line drawing of the vest from the front and from behind: one front motor; back, left and right motors; back, left and right ultrasonic rangefinders; an ESP32-S3 controller at the lower back."
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <text x={F} y={36} textAnchor="middle" fontFamily="var(--serif)" fontStyle="italic" fontSize={16} fill="var(--muted)">front</text>
      <text x={B} y={36} textAnchor="middle" fontFamily="var(--serif)" fontStyle="italic" fontSize={16} fill="var(--muted)">from behind</text>
      <path d={vest(F, true)} fill="none" stroke={ink} strokeWidth={1.4} strokeLinejoin="round" />
      <line x1={F} y1={92} x2={F} y2={360} stroke={ink} strokeWidth={0.8} strokeDasharray="3 3" />
      <path d={vest(B, false)} fill="none" stroke={ink} strokeWidth={1.4} strokeLinejoin="round" />

      {motor(F + 30, 170, active?.front)}
      {motor(B, 160, active?.back)}
      {motor(B - 62, 225, active?.left)}
      {motor(B + 62, 225, active?.right)}
      {sensor(B, 292)}
      {sensor(B - 52, 268)}
      {sensor(B + 52, 268)}
      <rect x={B - 23} y={318} width={46} height={26} rx={2} fill="var(--paper)" stroke={ink} strokeWidth={1.2} />

      {leader(`${F + 30},180 ${F + 30},400`, F + 30, 416, "Front motor", "middle")}
      {leader(`${B + 10},160 ${B + 94},140 ${B + 98},140`, B + 102, 145, "Back motor")}
      {leader(`${B + 72},225 ${B + 98},210`, B + 102, 215, "Right motor")}
      {leader(`${B + 67},268 ${B + 98},280`, B + 102, 285, "Rangefinders")}
      {leader(`${B + 23},334 ${B + 98},350`, B + 102, 355, "ESP32-S3")}
      {leader(`${B - 62},235 ${B - 62},400`, B - 62, 416, "Left motor", "middle")}
      <text x={B + 102} y={302} fontSize={13} fill="var(--muted)" fontFamily="var(--sans)">back, left, right</text>
      <text x={20} y={470} fontSize={15} fill="var(--muted)" fontFamily="var(--sans)">Left and right are the wearer&apos;s.</text>
    </svg>
  );
}
