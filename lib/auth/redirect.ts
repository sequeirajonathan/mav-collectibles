import type { Route } from "next";

/**
 * Only allow same-site relative redirect targets (blocks open redirects).
 * The result is a site path, so it's typed as a Next.js route.
 */
export function safeNext(next: string | null | undefined, fallback: Route = "/dashboard"): Route {
  const ok = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
  return ok ? (next as Route) : fallback;
}
