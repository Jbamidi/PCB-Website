import type { MetadataRoute } from "next";
import { experiences } from "@/content/experiences";
import { projects } from "@/content/projects";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const paths = [
    "/",
    "/experience",
    "/projects",
    "/about",
    "/resume",
    ...experiences.map((e) => `/experience/${e.slug}`),
    ...projects.map((p) => `/projects/${p.slug}`),
  ];
  return paths.map((p) => ({ url: `${site}${p === "/" ? "/" : p}` }));
}
