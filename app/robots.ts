import type { MetadataRoute } from "next";
import { siteUrl } from "@lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/auth/", "/dashboard", "/profile", "/print-agent", "/cart", "/sign-in", "/sign-up", "/search"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
