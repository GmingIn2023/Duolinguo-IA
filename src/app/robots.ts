import type { MetadataRoute } from "next";

const base = (process.env.SITE_URL ?? "https://duolinguo-ia.onrender.com").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/learn", "/map", "/jeu", "/courses", "/lesson", "/review", "/notes", "/profile", "/dev", "/auth/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
