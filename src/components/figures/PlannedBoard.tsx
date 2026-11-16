// Proposed architecture of the High Speed FPGA PCB: functional blocks inside a dashed
// board edge. No routing, stackup or part placement is implied. Two drawings of the
// same blocks: wide for desktop, stacked for phones.
import styles from "./figures.module.css";

type B = { x: number; y: number; w: number; h: number; label: string; sub?: string; tone?: "power" | "mem" | "opt" | "debug" | "fpga" };

function Block({ b }: { b: B }) {
  const stroke = b.tone === "power" ? "var(--accent)" : b.tone === "mem" ? "var(--accent-2)" : "var(--ink)";
  const dash = b.tone === "opt" ? "6 4" : undefined;
  const big = b.tone === "fpga";
  const cy = b.y + b.h / 2 - (b.sub ? 9 : 0);
  return (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3} fill="var(--paper)" stroke={stroke} strokeWidth={big ? 2 : 1.5} strokeDasharray={dash} />
      <text x={b.x + b.w / 2} y={cy} textAnchor="middle" dominantBaseline="middle" fontFamily={big ? "var(--serif)" : "var(--sans)"} fontSize={big ? 30 : 16} fill="var(--ink)">
        {b.label}
      </text>
      {b.sub ? (
        <text x={b.x + b.w / 2} y={cy + (big ? 28 : 21)} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--sans)" fontSize={13.5} fill="var(--muted)">
          {b.sub}
        </text>
      ) : null}
    </g>
  );
}

const P = (d: string, tone: "power" | "mem" | "ink" | "opt") => (
  <path
    d={d}
    fill="none"
    stroke={tone === "power" ? "var(--accent)" : tone === "mem" ? "var(--accent-2)" : "var(--ink)"}
    strokeWidth={tone === "mem" ? 3 : 1.5}
    strokeDasharray={tone === "opt" ? "6 4" : undefined}
  />
);

function Wide() {
  const blocks: B[] = [
    { x: 44, y: 62, w: 156, h: 62, label: "5 V input", sub: "USB-C or external", tone: "power" },
    { x: 236, y: 62, w: 150, h: 62, label: "Source select", tone: "power" },
    { x: 424, y: 54, w: 290, h: 78, label: "Four buck rails", sub: "core, auxiliary, memory, I/O", tone: "power" },
    { x: 196, y: 200, w: 210, h: 170, label: "FPGA", sub: "logic and memory controller", tone: "fpga" },
    { x: 504, y: 216, w: 180, h: 138, label: "DDR memory", sub: "external, x16", tone: "mem" },
    { x: 104, y: 424, w: 150, h: 54, label: "Config flash", tone: "debug" },
    { x: 274, y: 424, w: 160, h: 54, label: "JTAG and UART", tone: "debug" },
    { x: 454, y: 424, w: 130, h: 54, label: "Test points", tone: "debug" },
    { x: 604, y: 424, w: 120, h: 54, label: "Ethernet", sub: "optional", tone: "opt" },
  ];
  return (
    <svg viewBox="0 0 760 510" role="img" aria-label="Proposed architecture: a 5 volt input passes through source selection to four buck rails. The rails power an FPGA and external DDR memory, which are joined by a memory bus. Configuration flash, JTAG and UART, test points and an optional Ethernet interface connect to the FPGA." style={{ display: "block", width: "100%", height: "auto" }}>
      <rect x={16} y={28} width={728} height={474} rx={6} fill="none" stroke="var(--muted)" strokeDasharray="3 5" />
      <text x={28} y={20} fontFamily="var(--serif)" fontStyle="italic" fontSize={15} fill="var(--muted)">proposed board edge</text>
      {P("M200,93 H236", "power")}
      {P("M386,93 H424", "power")}
      {P("M480,132 V166 H300 V200", "power")}
      {P("M594,132 V216", "power")}
      <text x={608} y={180} fontFamily="var(--sans)" fontSize={13} fill="var(--muted)">memory rail</text>
      <text x={310} y={186} fontFamily="var(--sans)" fontSize={13} fill="var(--muted)">core, aux, I/O</text>
      {P("M406,285 H504", "mem")}
      <text x={455} y={274} textAnchor="middle" fontFamily="var(--sans)" fontSize={13} fill="var(--ink)">memory bus</text>
      {P("M301,370 V400 M179,400 H529 M179,400 V424 M354,400 V424 M519,400 V424", "ink")}
      {P("M529,400 H664 V424", "opt")}
      {blocks.map((b) => <Block key={b.label} b={b} />)}
    </svg>
  );
}

function Narrow() {
  const blocks: B[] = [
    { x: 20, y: 40, w: 155, h: 60, label: "5 V input", sub: "USB-C or external", tone: "power" },
    { x: 195, y: 40, w: 145, h: 60, label: "Source select", tone: "power" },
    { x: 20, y: 130, w: 320, h: 64, label: "Four buck rails", sub: "core, auxiliary, memory, I/O", tone: "power" },
    { x: 20, y: 236, w: 190, h: 150, label: "FPGA", tone: "fpga" },
    { x: 236, y: 252, w: 104, h: 118, label: "DDR", sub: "external, x16", tone: "mem" },
    { x: 20, y: 446, w: 150, h: 52, label: "Config flash", tone: "debug" },
    { x: 190, y: 446, w: 150, h: 52, label: "JTAG and UART", tone: "debug" },
    { x: 20, y: 526, w: 150, h: 52, label: "Test points", tone: "debug" },
    { x: 190, y: 526, w: 150, h: 60, label: "Ethernet", sub: "optional", tone: "opt" },
  ];
  return (
    <svg viewBox="0 0 360 610" role="img" aria-label="Proposed architecture, stacked: 5 volt input and source selection feed four buck rails, which power the FPGA and external DDR memory joined by a memory bus; configuration flash, JTAG and UART, test points and optional Ethernet connect to the FPGA." style={{ display: "block", width: "100%", height: "auto" }}>
      <rect x={6} y={26} width={348} height={576} rx={6} fill="none" stroke="var(--muted)" strokeDasharray="3 5" />
      <text x={12} y={18} fontFamily="var(--serif)" fontStyle="italic" fontSize={15} fill="var(--muted)">proposed board edge</text>
      {P("M175,70 H195", "power")}
      {P("M268,100 V130", "power")}
      {P("M115,194 V236", "power")}
      {P("M288,194 V252", "power")}
      {P("M210,311 H236", "mem")}
      {P("M115,386 V422 M95,422 H265 M95,422 V446 M265,422 V446 M180,422 V508 M95,508 H180 M95,508 V526", "ink")}
      {P("M180,508 H265 V526", "opt")}
      {blocks.map((b) => <Block key={b.label} b={b} />)}
    </svg>
  );
}

export function PlannedBoard() {
  return (
    <>
      <div className={styles.wideOnly}>
        <Wide />
      </div>
      <div className={styles.narrowOnly}>
        <Narrow />
      </div>
    </>
  );
}
