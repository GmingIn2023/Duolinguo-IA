import type { MetadataRoute } from "next";
import { legalReady } from "@/lib/legal";

const base = (process.env.SITE_URL ?? "https://duolinguo-ia.onrender.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/onboarding`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/signup`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    // Published only once the publisher identity is filled: a half-written legal page is worse than none.
    ...(legalReady
      ? [
          { url: `${base}/mentions-legales`, lastModified, changeFrequency: "yearly" as const, priority: 0.3 },
          { url: `${base}/confidentialite`, lastModified, changeFrequency: "yearly" as const, priority: 0.3 },
          { url: `${base}/cookies`, lastModified, changeFrequency: "yearly" as const, priority: 0.3 },
        ]
      : []),
  ];
}
