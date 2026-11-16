// Idealised five-stage pipeline trace: IF ID EX MEM WB, single-cycle memory, register
// file written in the first half of WB and read in the second half of ID, forwarding
// from EX/MEM and MEM/WB, one bubble when a load is followed by a dependent use.
// An explanatory model, not a cycle-accurate emulation of the final RTL.

export type Instr = { text: string; rd: number | null; rs: number[]; load?: boolean };
export type Cell = "IF" | "ID" | "EX" | "MEM" | "WB" | "stall" | "";
export type Forward = { from: number; to: number; reg: number; path: "EX/MEM" | "MEM/WB"; cycle: number };
export type TraceRow = { label: string; cells: Cell[]; bubble?: boolean; instr?: number };
export type Trace = { rows: TraceRow[]; cycles: number; forwards: Forward[]; stalls: number };

export function buildTrace(prog: Instr[]): Trace {
  const exCycle: number[] = [];
  const rows: TraceRow[] = [];
  const forwards: Forward[] = [];
  let stalls = 0;
  prog.forEach((ins, i) => {
    // fetch proceeds one instruction per cycle; a stall holds it in place
    const ifCycle = i;
    let ex = ifCycle + 2;
    if (i > 0) ex = Math.max(ex, exCycle[i - 1] + 1);
    const prev = prog[i - 1];
    let stalled = false;
    if (prev?.load && prev.rd && ins.rs.includes(prev.rd)) {
      // loaded data is ready only after MEM: hold one cycle in decode
      ex = Math.max(ex, exCycle[i - 1] + 2);
      stalled = true;
    }
    exCycle.push(ex);
    const cells: Cell[] = [];
    cells[ifCycle] = "IF";
    if (stalled) {
      // the consumer waits in decode
      cells[ifCycle + 1] = "ID";
      for (let c = ifCycle + 2; c < ex; c++) cells[c] = "stall";
    } else {
      // anything behind a stalled instruction waits in fetch
      for (let c = ifCycle + 1; c < ex - 1; c++) cells[c] = "stall";
      cells[ex - 1] = "ID";
    }
    cells[ex] = "EX";
    cells[ex + 1] = "MEM";
    cells[ex + 2] = "WB";
    if (stalled) {
      stalls++;
      const b: Cell[] = [];
      b[ex - 1] = "EX";
      b[ex] = "MEM";
      b[ex + 1] = "WB";
      rows.push({ label: "bubble", cells: b, bubble: true });
    }
    rows.push({ label: ins.text, cells, instr: i });
    for (const r of ins.rs) {
      if (!r) continue;
      for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
        if (prog[j].rd !== r) continue;
        const gap = ex - exCycle[j];
        if (gap === 1 && !prog[j].load) forwards.push({ from: j, to: i, reg: r, path: "EX/MEM", cycle: ex });
        else if (gap === 2) forwards.push({ from: j, to: i, reg: r, path: "MEM/WB", cycle: ex });
        break; // the newest writer wins
      }
    }
  });
  const cycles = Math.max(...exCycle) + 3;
  for (const row of rows) for (let c = 0; c < cycles; c++) row.cells[c] = row.cells[c] ?? "";
  return { rows, cycles, forwards, stalls };
}

export const PROGRAMS: { id: string; label: string; note: string; prog: Instr[] }[] = [
  {
    id: "independent",
    label: "Independent arithmetic",
    note: "No dependencies, so one instruction finishes every cycle once the pipe fills.",
    prog: [
      { text: "add x1, x2, x3", rd: 1, rs: [2, 3] },
      { text: "sub x4, x5, x6", rd: 4, rs: [5, 6] },
      { text: "and x7, x8, x9", rd: 7, rs: [8, 9] },
      { text: "or  x10, x11, x12", rd: 10, rs: [11, 12] },
    ],
  },
  {
    id: "forwarding",
    label: "Forwarded dependency",
    note: "sub gets x3 from EX/MEM; and takes x4 from EX/MEM and x3 from MEM/WB.",
    prog: [
      { text: "add x3, x1, x2", rd: 3, rs: [1, 2] },
      { text: "sub x4, x3, x5", rd: 4, rs: [3, 5] },
      { text: "and x6, x3, x4", rd: 6, rs: [3, 4] },
    ],
  },
  {
    id: "load-use",
    label: "Load-use bubble",
    note: "Loaded data is ready only after MEM, so add waits one cycle and gets x3 through MEM/WB.",
    prog: [
      { text: "lw  x3, 0(x1)", rd: 3, rs: [1], load: true },
      { text: "add x4, x3, x2", rd: 4, rs: [3, 2] },
      { text: "sub x5, x4, x6", rd: 5, rs: [4, 6] },
    ],
  },
];
