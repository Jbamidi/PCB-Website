import { describe, expect, it } from "vitest";
import board from "../board/parts.json";
import { experiences } from "@/content/experiences";
import { projects } from "@/content/projects";

type Part = { ref: string; x: number; y: number; w: number; h: number; populated: boolean };
const parts = board.parts as Record<string, Part>;

describe("portfolio board", () => {
  it("has a part for every experience and project", () => {
    for (const w of [...experiences, ...projects]) expect(parts[w.slug], w.slug).toBeDefined();
  });
  it("uses connectors for experience and parts for projects", () => {
    for (const e of experiences) expect(parts[e.slug].ref).toMatch(/^J\d+$/);
    for (const p of projects) expect(parts[p.slug].ref).toMatch(/^U\d+$/);
  });
  it("leaves planned work unpopulated and built work populated", () => {
    for (const p of projects) expect(parts[p.slug].populated, p.slug).toBe(!p.status.startsWith("In progress"));
  });
  it("keeps every part on the board and spare footprints free for new work", () => {
    for (const [id, p] of Object.entries(parts)) {
      expect(p.x, id).toBeGreaterThanOrEqual(0);
      expect(p.y, id).toBeGreaterThanOrEqual(0);
      expect(p.x, id).toBeLessThanOrEqual(board.board.w);
      expect(p.y, id).toBeLessThanOrEqual(board.board.h);
    }
    expect(Object.keys(parts).filter((k) => k.startsWith("spare-")).length).toBeGreaterThan(0);
  });
});

describe("live board", async () => {
  const { boardItems, boardLeds } = await import("@/components/board/boardData");
  it("puts every role, every project and the contact header on the board", () => {
    expect(boardItems.length).toBe(experiences.length + projects.length + 1);
    for (const w of [...experiences, ...projects]) expect(boardItems.find((i) => i.slug === w.slug)?.href).toMatch(new RegExp(`/${w.slug}$`));
  });
  it("gives each part a unique reference designator", () => {
    expect(new Set(boardItems.map((i) => i.ref)).size).toBe(boardItems.length);
  });
  it("lights a planned project's LED amber and built ones green", () => {
    for (const p of projects) {
      const item = boardItems.find((i) => i.slug === p.slug)!;
      const led = boardLeds.find((l) => l.ref === `D${item.ref.slice(1)}`);
      expect(led, p.slug).toBeDefined();
      expect(led!.color, p.slug).toBe(p.status.startsWith("In progress") ? "planned" : "on");
    }
  });
});

describe("homepage tour", async () => {
  const { STOPS } = await import("@/components/board/stops");
  const { boardItems } = await import("@/components/board/boardData");
  it("opens on the whole board and visits every part once, ending at the contact header", () => {
    expect(STOPS[0].id).toBe("hero");
    const visited = STOPS.slice(1).map((s) => s.id);
    expect([...visited].sort()).toEqual(boardItems.map((i) => i.slug).sort());
    expect(visited.at(-1)).toBe("contact");
  });
  it("docks each card on the side away from its part", () => {
    for (const s of STOPS.slice(1)) expect(s.side, s.id).toBe(s.item!.x < 80 ? "right" : "left");
  });
});

describe("net search", async () => {
  const { buildSearchIndex, search } = await import("@/components/nav/searchIndex");
  const index = buildSearchIndex();
  it("finds a part by its reference designator first", () => {
    expect(search(index, "U3")[0].title).toBe("VisionVest");
    expect(search(index, "j2")[0].href).toBe("/experience/eco-illini");
  });
  it("finds skills and sections", () => {
    expect(search(index, "kicad").some((e) => e.kind === "Skill")).toBe(true);
    expect(search(index, "comparator").length).toBeGreaterThan(0);
  });
  it("only links to pages that exist", () => {
    const pages = new Set(["/", "/experience", "/projects", "/about", "/resume", ...experiences.map((e) => `/experience/${e.slug}`), ...projects.map((p) => `/projects/${p.slug}`)]);
    for (const e of index) expect(pages.has(e.href.split("#")[0]), e.href).toBe(true);
  });
});
