import type { CaseStudy } from "@/lib/types";
import { experiences } from "./experiences";
import { projects } from "./projects";

export function findStudy(slug: string): CaseStudy | undefined {
  return experiences.find((e) => e.slug === slug) ?? projects.find((p) => p.slug === slug);
}
