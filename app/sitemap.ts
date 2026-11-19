import type { MetadataRoute } from "next";
import { CATEGORY_GROUPS } from "@const/categories";
import { listEvents, listVendors } from "@lib/data/hub";
import { siteUrl } from "@lib/seo";
import { getFlags } from "@lib/data/site";

const GROUP_PARAM: Record<string, string> = { TCG: "TCG", Collectibles: "COLLECTIBLES", "Supplies & Grading": "SUPPLIES" };

const STATIC: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/events", priority: 0.9, changeFrequency: "daily" },
  { path: "/pokemon-cards-montgomery-tx", priority: 0.9, changeFrequency: "monthly" },
  { path: "/sell-your-cards", priority: 0.8, changeFrequency: "monthly" },
  { path: "/visit", priority: 0.8, changeFrequency: "monthly" },
  { path: "/shop", priority: 0.8, changeFrequency: "weekly" },
  { path: "/feed", priority: 0.6, changeFrequency: "daily" },
  { path: "/vendors", priority: 0.5, changeFrequency: "weekly" },
  { path: "/leaderboard", priority: 0.5, changeFrequency: "weekly" },
  { path: "/jobs", priority: 0.4, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.1, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [events, vendors, flags] = await Promise.all([listEvents({ limit: 100 }).catch(() => []), listVendors().catch(() => []), getFlags()]);
  // A hidden shop stays out of search results.
  const shop = flags.shopVisible;
  return [
    ...STATIC.filter((p) => (shop || p.path !== "/shop") && (flags.vendorsVisible || p.path !== "/vendors") && (flags.hiringOpen || p.path !== "/jobs")).map((p) => ({ url: `${base}${p.path}`, changeFrequency: p.changeFrequency, priority: p.priority })),
    ...(shop ? CATEGORY_GROUPS : []).flatMap((group) =>
      group.categories.map((c) => ({
        url: `${base}/category/${c.slug}?group=${GROUP_PARAM[group.name] ?? "TCG"}`,
        changeFrequency: "daily" as const,
        priority: 0.6,
      }))
    ),
    ...events.filter((e) => e.status === "published").map((e) => ({ url: `${base}/events/${e.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...(flags.vendorsVisible ? vendors : []).map((v) => ({ url: `${base}/vendors/${v.slug}`, changeFrequency: "weekly" as const, priority: 0.4 })),
  ];
}
