import type { MetadataRoute } from "next";

import { loadAreaManifest } from "@/features/area-intelligence";
import { absoluteUrl } from "@/shared/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const manifest = await loadAreaManifest();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(manifest.generatedAt),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/methodology"),
      lastModified: new Date(manifest.generatedAt),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const areaRoutes: MetadataRoute.Sitemap = manifest.areas.map((area) => ({
    url: absoluteUrl(`/area/${area.slug}`),
    lastModified: new Date(area.scrapedAt),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...areaRoutes];
}
