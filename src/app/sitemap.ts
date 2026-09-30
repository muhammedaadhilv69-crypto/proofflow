import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";
import { ROUTES } from "@/lib/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppUrl();
  const lastModified = new Date();
  return [
    { url: baseUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${baseUrl}${ROUTES.pricing}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}${ROUTES.features}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
