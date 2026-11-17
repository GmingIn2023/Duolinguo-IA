import type { MetadataRoute } from "next";

const base = (process.env.SITE_URL ?? "https://duolinguo-ia.onrender.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/onboarding`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/signup`, lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];
}
