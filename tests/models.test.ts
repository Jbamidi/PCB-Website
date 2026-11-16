import { describe, expect, it } from "vitest";
import { bandpassMagnitude, crossoverFrequency, tunerDecision, TUNER_MODEL } from "@/lib/demo-models/tuner";
import { applyEvent, emptyBook, replay, SYNTHETIC_EVENTS, topOfBook } from "@/lib/demo-models/orderbook";
import { decideOutput, FIXTURES, FULL_DUTY, hazardLevel } from "@/lib/demo-models/visionvest";
import { relativeBearing, wrapDeg } from "@/lib/demo-models/spatial";
import { grayscale, sobelMagnitude, threshold, toGray } from "@/lib/demo-models/sobel";
import { buildTrace, PROGRAMS } from "@/lib/demo-models/pipeline";
import { coordsFromShd, DIMS, hsdIndex, permute, unpermute } from "@/lib/demo-models/tensor";
import { filterItems, parseFilter, resultSentence } from "@/lib/demo-models/filters";
import { groupOffset, PART_GROUPS } from "@/lib/demo-models/assembly";

describe("tuner response model", () => {
  it("peaks at unity at each centre frequency", () => {
    expect(bandpassMagnitude(630, 630, 12)).toBeCloseTo(1, 10);
    expect(bandpassMagnitude(690, 690, 12)).toBeCloseTo(1, 10);
  });
  it("crosses at the geometric mean, not at the 660 Hz target", () => {
    const fc = crossoverFrequency();
    expect(fc).toBeCloseTo(Math.sqrt(630 * 690), 6);
    expect(Math.abs(fc - TUNER_MODEL.target)).toBeGreaterThan(0.5);
  });
  it("points the comparator the right way on each side", () => {
    expect(tunerDecision(640)).toBe("below");
    expect(tunerDecision(680)).toBe("above");
  });
});

describe("orderbook reducer", () => {
  it("replays the synthetic sequence without errors and keeps quantities positive", () => {
    let s = emptyBook;
    for (const ev of SYNTHETIC_EVENTS) {
      s = applyEvent(s, ev);
      expect(s.error).toBeNull();
      for (const o of s.orders) expect(o.qty).toBeGreaterThan(0);
    }
  });
  it("aggregates quantity at the best bid", () => {
    const s = replay(SYNTHETIC_EVENTS, 5);
    expect(topOfBook(s.orders)).toEqual({ bid: 99, bidQty: 400, ask: 101, askQty: 200 });
  });
  it("removes an order executed to zero and moves the best ask", () => {
    const s = replay(SYNTHETIC_EVENTS, 8);
    expect(s.orders.find((o) => o.id === 2)).toBeUndefined();
    expect(topOfBook(s.orders).ask).toBe(102);
  });
  it("replace preserves side and reprices the book", () => {
    const s = replay(SYNTHETIC_EVENTS, 9);
    const o = s.orders.find((x) => x.id === 6)!;
    expect(o.side).toBe("B");
    expect(topOfBook(s.orders)).toMatchObject({ bid: 100, bidQty: 180 });
  });
  it("partial cancel reduces quantity, final state is consistent", () => {
    const s = replay(SYNTHETIC_EVENTS, SYNTHETIC_EVENTS.length);
    expect(s.orders.find((o) => o.id === 1)!.qty).toBe(200);
    expect(topOfBook(s.orders)).toEqual({ bid: 100, bidQty: 180, ask: 101, askQty: 120 });
  });
  it("rejects an unknown reference without changing the book", () => {
    const s = replay(SYNTHETIC_EVENTS, 2);
    const t = applyEvent(s, { type: "X", id: 99, qty: 10 });
    expect(t.error).toMatch(/unknown/);
    expect(t.orders).toBe(s.orders);
  });
});

describe("VisionVest output decision", () => {
  const [expiry, caution, danger] = FIXTURES;
  const at = (f: (typeof FIXTURES)[number], now: number) =>
    decideOutput({ mode: f.mode, command: f.command, hazards: f.hazards, now });

  it("drives the commanded motor at full duty, not the requested intensity", () => {
    const out = at(expiry, 100);
    expect(out.source).toBe("phone");
    expect(out.requestedIntensity).toBe(150);
    expect(out.duty.front).toBe(FULL_DUTY);
  });
  it("expires a 300 ms command at 300 ms", () => {
    expect(at(expiry, 299).source).toBe("phone");
    expect(at(expiry, 300).source).toBe("idle");
    expect(at(expiry, 300).duty).toEqual({ front: 0, back: 0, left: 0, right: 0 });
  });
  it("hands over to a local caution after expiry in awareness mode", () => {
    expect(at(caution, 200).source).toBe("phone");
    const after = at(caution, 350);
    expect(after.source).toBe("caution");
    expect(after.duty.right).toBe(FULL_DUTY);
  });
  it("lets danger outrank a live command", () => {
    const out = at(danger, 50);
    expect(out.source).toBe("danger");
    expect(out.commandLive).toBe(true);
    expect(out.duty.back).toBe(FULL_DUTY);
    expect(out.duty.front).toBe(0);
  });
  it("ignores hazards outside awareness mode", () => {
    const out = decideOutput({ mode: "object_nav", command: null, hazards: danger.hazards, now: 0 });
    expect(out.source).toBe("idle");
  });
  it("classifies ranges at the configured thresholds", () => {
    expect(hazardLevel(80)).toBe("danger");
    expect(hazardLevel(81)).toBe("caution");
    expect(hazardLevel(131)).toBeNull();
  });
});

describe("spatial angle wrapping", () => {
  it("wraps into (-180, 180]", () => {
    expect(wrapDeg(190)).toBe(-170);
    expect(wrapDeg(-190)).toBe(170);
    expect(wrapDeg(180)).toBe(180);
    expect(wrapDeg(-180)).toBe(180);
    expect(wrapDeg(720)).toBe(0);
  });
  it("moves a world-fixed source opposite to head yaw", () => {
    expect(relativeBearing(30, 0)).toBe(30);
    expect(relativeBearing(30, 60)).toBe(-30);
    expect(relativeBearing(-170, 170)).toBe(20);
  });
});

describe("Sobel routine", () => {
  it("uses the add-and-shift grayscale", () => {
    expect(toGray(255, 255, 255)).toBe(255);
    expect(toGray(100, 0, 0)).toBe(25);
  });
  it("finds a vertical edge and nothing on flat regions or borders", () => {
    const w = 8, h = 6;
    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const v = x < 4 ? 0 : 255;
        rgba.set([v, v, v, 255], (y * w + x) * 4);
      }
    const mag = sobelMagnitude(grayscale(rgba, w, h), w, h);
    const edge = threshold(mag, 64);
    expect(edge[2 * w + 3]).toBe(255);
    expect(edge[2 * w + 4]).toBe(255);
    expect(edge[2 * w + 1]).toBe(0);
    expect(edge[2 * w + 6]).toBe(0);
    expect(mag[0]).toBe(0);
    expect(mag[2 * w + 3]).toBe(Math.min(255, (4 * 255) >> 3));
  });
});

describe("pipeline trace", () => {
  it("completes independent instructions one per cycle after fill", () => {
    const t = buildTrace(PROGRAMS[0].prog);
    expect(t.cycles).toBe(8);
    expect(t.stalls).toBe(0);
    expect(t.forwards).toHaveLength(0);
  });
  it("forwards from EX/MEM and MEM/WB in the dependency example", () => {
    const t = buildTrace(PROGRAMS[1].prog);
    expect(t.forwards.map((f) => `${f.to}:x${f.reg}:${f.path}`).sort()).toEqual(
      ["1:x3:EX/MEM", "2:x3:MEM/WB", "2:x4:EX/MEM"].sort(),
    );
  });
  it("inserts exactly one bubble for load-use and forwards the load through MEM/WB", () => {
    const t = buildTrace(PROGRAMS[2].prog);
    expect(t.stalls).toBe(1);
    expect(t.rows.filter((r) => r.bubble)).toHaveLength(1);
    expect(t.cycles).toBe(8);
    const add = t.rows.find((r) => r.instr === 1)!;
    expect(add.cells.slice(1, 5)).toEqual(["IF", "ID", "stall", "EX"]);
    const sub = t.rows.find((r) => r.instr === 2)!;
    expect(sub.cells.slice(2, 6)).toEqual(["IF", "stall", "ID", "EX"]);
    expect(t.forwards).toContainEqual(expect.objectContaining({ to: 1, reg: 3, path: "MEM/WB" }));
  });
});

describe("tensor permutation", () => {
  it("round-trips and moves element (s=2,h=1,d=0) to its [H][S][D] slot", () => {
    const src = Array.from({ length: DIMS.S * DIMS.H * DIMS.D }, (_, i) => i);
    const p = permute(src);
    expect(unpermute(p)).toEqual(src);
    const i = 2 * DIMS.H * DIMS.D + 1 * DIMS.D + 0;
    expect(coordsFromShd(i)).toEqual({ s: 2, h: 1, d: 0 });
    expect(p[hsdIndex(2, 1, 0)]).toBe(i);
  });
});

describe("project filter", () => {
  const items = [
    { id: "a", categories: ["pcb" as const] },
    { id: "b", categories: ["fpga" as const, "dsp" as const] },
  ];
  it("parses unknown values to all", () => {
    expect(parseFilter("nope")).toBe("all");
    expect(parseFilter(["fpga"])).toBe("fpga");
    expect(parseFilter(undefined)).toBe("all");
  });
  it("keeps overlapping categories", () => {
    expect(filterItems(items, "dsp").map((i) => i.id)).toEqual(["b"]);
    expect(filterItems(items, "all")).toHaveLength(2);
  });
  it("announces counts", () => {
    expect(resultSentence(1, "pcb")).toBe("Showing 1 project in PCB & analog");
  });
});

describe("assembly interpolation", () => {
  it("is stable: same separation gives same offset, 0 is assembled", () => {
    const g = PART_GROUPS[0];
    expect(groupOffset(g, 0)).toEqual([0, 0, 0]);
    expect(groupOffset(g, 1)).toEqual(g.offset);
    expect(groupOffset(g, 0.4)).toEqual(groupOffset(g, 0.4));
  });
});

import { featured, projects } from "@/content/projects";

describe("homepage featured configuration", () => {
  it("features three distinct existing projects and leaves the rest for More work", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(featured).size).toBe(featured.length);
    featured.forEach((f) => expect(slugs).toContain(f));
    const rest = projects.filter((p) => !(featured as readonly string[]).includes(p.slug)).map((p) => p.slug);
    expect(rest).toContain("fpga-edge-detection");
    expect(rest).not.toContain("high-speed-fpga-pcb");
  });
  it("keeps the featured planning project marked as planning", () => {
    const board = projects.find((p) => p.slug === "high-speed-fpga-pcb")!;
    expect(board.status).toMatch(/Planning/);
    expect(board.outcomes.every((o) => o.kind === "planned")).toBe(true);
  });
});

import { experiences } from "@/content/experiences";

describe("detail-page anchors", () => {
  const visible = ["contribution", "validation", "highlight", "demo"];
  it.each([...experiences, ...projects].map((s) => [s.slug, s] as const))("%s keeps its section anchors unique and linkable", (_slug, s) => {
    const ids = [...visible, ...s.details.map((d) => d.id), ...(s.decisions.length ? ["decisions"] : [])];
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ["context", "architecture"]) expect(s.details.map((d) => d.id)).toContain(a);
  });
  it("covers every in-site deep link used by the assembly and skills", async () => {
    const { PART_GROUPS } = await import("@/lib/demo-models/assembly");
    const { skillGroups } = await import("@/content/profile");
    const links = [...PART_GROUPS.map((g) => g.related.href), ...skillGroups.flatMap((g) => g.evidence.map((e) => e.href))].filter((h) => h.includes("#"));
    for (const href of links) {
      const [path, id] = href.split("#");
      const slug = path.split("/").pop()!;
      const s = [...experiences, ...projects].find((x) => x.slug === slug)!;
      const ids = [...visible, ...s.details.map((d) => d.id), "decisions"];
      expect(ids, href).toContain(id);
    }
  });
});
