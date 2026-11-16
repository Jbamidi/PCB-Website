import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { experiences } from "@/content/experiences";
import { CaseStudy } from "@/components/portfolio/CaseStudy";
import { caseFigures } from "@/components/figures/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return experiences.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = experiences.find((x) => x.slug === slug);
  return e ? { title: e.title, description: e.summary } : {};
}

export default async function ExperiencePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = experiences.find((x) => x.slug === slug);
  if (!study) notFound();
  return <CaseStudy study={study} figures={caseFigures[slug] ?? {}} />;
}
