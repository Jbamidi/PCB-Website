// Everything net search can find, built on the server and handed to the client as plain
// data: pages, every part (with its reference designator), the sections inside each case
// study, and each skill (pointing at the work that shows it).
import { experiences } from "@/content/experiences";
import { projects } from "@/content/projects";
import { skillGroups } from "@/content/profile";
import { refFor } from "@/lib/board";

export type SearchEntry = {
  title: string;
  /** what kind of thing it is, shown as a silkscreen tag */
  kind: "Page" | "Project" | "Experience" | "Section" | "Skill";
  href: string;
  /** a second line: the part, the study a section belongs to, the skill's group */
  detail?: string;
  ref?: string;
  /** extra words that should match but aren't shown */
  keywords?: string;
};

export function buildSearchIndex(): SearchEntry[] {
  const out: SearchEntry[] = [
    { title: "Board", kind: "Page", href: "/", detail: "Homepage", keywords: "home" },
    { title: "Experience", kind: "Page", href: "/experience", detail: "Revision history" },
    { title: "Projects", kind: "Page", href: "/projects", detail: "Bill of materials" },
    { title: "About", kind: "Page", href: "/about", detail: "Education and skills" },
    { title: "Résumé", kind: "Page", href: "/resume", detail: "PDF", keywords: "resume cv" },
    { title: "Contact", kind: "Page", href: "/#contact", detail: "P1 · email, GitHub, LinkedIn", ref: "P1", keywords: "email github linkedin" },
  ];
  for (const s of [...experiences, ...projects]) {
    const base = `/${s.kind === "experience" ? "experience" : "projects"}/${s.slug}`;
    out.push({
      title: s.title,
      kind: s.kind === "experience" ? "Experience" : "Project",
      href: base,
      detail: s.line,
      ref: refFor(s.slug),
      keywords: [s.shortTitle, s.domain, s.role, s.tools.join(" ")].filter(Boolean).join(" "),
    });
    const sections: [string, string][] = [
      ["contribution", s.introTitle ?? "What I did"],
      ["validation", s.resultTitle ?? "Result"],
      ["highlight", s.highlight.title],
      ...s.details.map((d) => [d.id, d.title] as [string, string]),
    ];
    for (const [id, title] of sections) out.push({ title, kind: "Section", href: `${base}#${id}`, detail: s.shortTitle ?? s.title });
  }
  for (const g of skillGroups) {
    for (const skill of g.items.split(",").map((x) => x.trim()).filter(Boolean)) {
      out.push({ title: skill, kind: "Skill", href: g.evidence[0]?.href ?? "/about", detail: `${g.title} · ${g.evidence[0]?.label ?? "About"}` });
    }
  }
  return out;
}

/** rank entries for a query: whole-word and prefix hits first, then substring, then in-order letters */
export function search(index: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return index.filter((e) => e.kind === "Page" || e.kind === "Project" || e.kind === "Experience").slice(0, limit);
  const score = (e: SearchEntry) => {
    const title = e.title.toLowerCase();
    const hay = `${title} ${e.ref ?? ""} ${e.detail ?? ""} ${e.keywords ?? ""}`.toLowerCase();
    if (e.ref && e.ref.toLowerCase() === q) return 100;
    if (title === q) return 90;
    if (title.startsWith(q)) return 80;
    if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(title)) return 70;
    if (title.includes(q)) return 60;
    if (hay.includes(q)) return 40;
    let i = 0;
    for (const c of title) if (c === q[i]) i++;
    return i === q.length ? 20 : 0;
  };
  const kindRank: Record<SearchEntry["kind"], number> = { Page: 4, Project: 3, Experience: 3, Section: 1, Skill: 2 };
  return index
    .map((e) => ({ e, s: score(e) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || kindRank[b.e.kind] - kindRank[a.e.kind])
    .slice(0, limit)
    .map((x) => x.e);
}
