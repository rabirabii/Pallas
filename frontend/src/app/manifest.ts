import type { MetadataRoute } from "next";

import { siteConfig } from "@/shared/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#e7eaeb",
    theme_color: "#7a3034",
    categories: ["business", "productivity", "utilities"],
    lang: "en-MY",
  };
}
