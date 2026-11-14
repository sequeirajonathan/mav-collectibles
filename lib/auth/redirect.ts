import type { Route } from "next";

const BASE = "http://same.site";

/**
 * Only allow same-site relative redirect targets (blocks open redirects).
 * The target is parsed the way a browser would (which ignores tabs and
 * newlines, and treats "\" like "/"), and must stay on the same origin.
 */
export function safeNext(next: string | null | undefined, fallback: Route = "/dashboard"): Route {
  if (!next || !next.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;
  return `${url.pathname}${url.search}${url.hash}` as Route;
}
