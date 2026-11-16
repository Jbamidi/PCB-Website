import type { Category } from "../types";

export type FilterValue = "all" | Category;

export const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pcb", label: "PCB & analog" },
  { value: "fpga", label: "FPGA & digital" },
  { value: "embedded", label: "Embedded" },
  { value: "dsp", label: "DSP & GPU" },
];

export function parseFilter(raw: string | string[] | undefined | null): FilterValue {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return FILTERS.some((f) => f.value === v) ? (v as FilterValue) : "all";
}

export function filterItems<T extends { categories: Category[] }>(items: T[], f: FilterValue): T[] {
  return f === "all" ? items : items.filter((i) => i.categories.includes(f));
}

export function resultSentence(n: number, f: FilterValue): string {
  const label = FILTERS.find((x) => x.value === f)!.label;
  const noun = n === 1 ? "project" : "projects";
  return f === "all" ? `Showing all ${n} ${noun}` : `Showing ${n} ${noun} in ${label}`;
}
