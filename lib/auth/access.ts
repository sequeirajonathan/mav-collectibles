import { CONTENT_ROLES, HIRING_ROLES, PRINT_ROLES, UserRole } from "@interfaces/roles";

/**
 * The access policy for every page and API route, enforced in one place
 * (proxy.ts). Anything not matched here requires a signed-in user.
 *
 * - "public":  anyone
 * - "user":    any signed-in user
 * - a role list: signed-in user whose role is in the list
 */
type Access = "public" | "user" | readonly UserRole[];

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Rule {
  /** Path prefix or exact path pattern (":param" matches one segment, "*" matches the rest). */
  path: string;
  /** Access per method. "*" is the fallback for methods not listed. */
  access: Partial<Record<Method | "*", Access>>;
}

const ADMIN = [UserRole.ADMIN] as const;
const ADMIN_ONLY = ADMIN;

/**
 * Order matters: the first matching rule wins, so specific paths come first.
 * Server actions POST to the page they're used on; each action also checks the
 * caller's role itself (lib/actions/safe-action.ts).
 */
const RULES: Rule[] = [
  // ---- Public pages ---------------------------------------------------------
  { path: "/", access: { "*": "public" } },
  { path: "/events*", access: { "*": "public" } },
  { path: "/feed*", access: { "*": "public" } },
  { path: "/vendors/apply", access: { "*": "user" } },
  { path: "/vendors*", access: { "*": "public" } },
  { path: "/leaderboard", access: { "*": "public" } },
  { path: "/shop", access: { "*": "public" } },
  { path: "/category*", access: { "*": "public" } },
  { path: "/product*", access: { "*": "public" } },
  { path: "/search", access: { "*": "public" } },
  { path: "/cart", access: { "*": "public" } },
  { path: "/maintenance", access: { "*": "public" } },
  { path: "/offline", access: { "*": "public" } },
  { path: "/privacy", access: { "*": "public" } },
  { path: "/jobs", access: { "*": "public" } },
  { path: "/pokemon-cards-montgomery-tx", access: { "*": "public" } },
  { path: "/sell-your-cards", access: { "*": "public" } },
  { path: "/visit", access: { "*": "public" } },
  { path: "/robots.txt", access: { "*": "public" } },
  { path: "/sitemap.xml", access: { "*": "public" } },
  { path: "/og.png", access: { "*": "public" } },
  { path: "/manifest.webmanifest", access: { "*": "public" } },

  // ---- Auth ---------------------------------------------------------------
  { path: "/sign-in", access: { "*": "public" } },
  { path: "/sign-up", access: { "*": "public" } },
  { path: "/sign-up/complete", access: { "*": "user" } },
  { path: "/forgot-password", access: { "*": "public" } },
  { path: "/auth/*", access: { "*": "public" } },
  { path: "/reset-password", access: { "*": "user" } },

  // ---- Print agent ----------------------------------------------------------
  { path: "/print-agent/login", access: { "*": "public" } },
  { path: "/print-agent*", access: { "*": PRINT_ROLES } },

  // ---- Admin ----------------------------------------------------------------
  { path: "/admin/site*", access: { "*": ADMIN } },
  { path: "/admin/roles*", access: { "*": ADMIN } },
  { path: "/admin/downloads*", access: { "*": ADMIN } },
  { path: "/admin/applications*", access: { "*": HIRING_ROLES } },
  { path: "/admin*", access: { "*": CONTENT_ROLES } },

  // ---- API (only what the browser fetches directly) -------------------------
  { path: "/api/v1/catalog/*", access: { GET: "public" } },
  { path: "/api/v1/job-applications", access: { POST: "public" } },
  { path: "/api/v1/job-applications/:id/resume", access: { GET: HIRING_ROLES } },
  { path: "/api/v1/staff-chat*", access: { GET: CONTENT_ROLES, POST: CONTENT_ROLES } },
  { path: "/api/v1/print-jobs", access: { GET: PRINT_ROLES, PATCH: PRINT_ROLES, POST: ADMIN } },
];

function matches(pattern: string, pathname: string): boolean {
  if (pattern.endsWith("*")) {
    const base = pattern.slice(0, -1).replace(/\/$/, "");
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  const p = pattern.split("/");
  const s = pathname.replace(/\/$/, "").split("/");
  if (p.length !== s.length) return false;
  return p.every((part, i) => part.startsWith(":") || part === s[i]);
}

/** Resolves the access level for a request. Unmatched routes require sign-in. */
export function accessFor(pathname: string, method: string): Access {
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  for (const rule of RULES) {
    if (rule.path === "/" ? normalized === "/" : matches(rule.path, normalized)) {
      const m = method.toUpperCase() as Method;
      // HEAD and OPTIONS follow GET.
      const key = m === ("HEAD" as Method) || m === ("OPTIONS" as Method) ? "GET" : m;
      // Methods a rule doesn't mention are admin-only.
      return rule.access[key] ?? rule.access["*"] ?? ADMIN_ONLY;
    }
  }
  return "user";
}

export function isAllowed(access: Access, role: UserRole | null): boolean {
  if (access === "public") return true;
  if (role === null) return false;
  if (access === "user") return true;
  return access.includes(role);
}
