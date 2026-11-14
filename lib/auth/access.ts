import { PRINT_ROLES, UserRole } from "@interfaces/roles";

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

// The admin dashboard and content management are ADMIN-only (matching the
// original admin page gate). STAFF/EVENT keep their maintenance-mode exemption.
const ADMIN = [UserRole.ADMIN] as const;
const ADMIN_ONLY = ADMIN;

const RULES: Rule[] = [
  // ---- Pages --------------------------------------------------------------
  { path: "/", access: { "*": "public" } },
  { path: "/events*", access: { "*": "public" } },
  { path: "/category*", access: { "*": "public" } },
  { path: "/product*", access: { "*": "public" } },
  { path: "/search*", access: { "*": "public" } },
  { path: "/cart*", access: { "*": "public" } },
  { path: "/maintenance*", access: { "*": "public" } },
  { path: "/error*", access: { "*": "public" } },
  { path: "/sign-in*", access: { "*": "public" } },
  { path: "/sign-up", access: { "*": "public" } },
  { path: "/sign-up/complete", access: { "*": "user" } },
  { path: "/forgot-password", access: { "*": "public" } },
  { path: "/auth/*", access: { "*": "public" } },
  { path: "/reset-password", access: { "*": "user" } },
  { path: "/print-agent/login", access: { "*": "public" } },
  { path: "/print-agent*", access: { "*": PRINT_ROLES } },
  { path: "/admin*", access: { "*": ADMIN } },

  // ---- Public content (read-only for everyone, managed by staff) ----------
  { path: "/api/v1/alert-banner*", access: { GET: "public", "*": ADMIN } },
  { path: "/api/v1/feature-flags/seed", access: { "*": ADMIN_ONLY } },
  { path: "/api/v1/feature-flags*", access: { GET: "public", "*": ADMIN } },
  { path: "/api/v1/featured-events*", access: { GET: "public", "*": ADMIN } },
  { path: "/api/v1/video-settings*", access: { GET: "public", "*": ADMIN } },
  { path: "/api/v1/youtube-settings*", access: { GET: "public", "*": ADMIN } },
  { path: "/api/v1/category*", access: { GET: "public" } },
  { path: "/api/v1/product*", access: { GET: "public" } },
  { path: "/api/v1/google-reviews", access: { GET: "public" } },
  { path: "/api/v1/search", access: { POST: "public" } },

  // ---- Staff tools --------------------------------------------------------
  { path: "/api/v1/installers*", access: { "*": ADMIN } },
  { path: "/api/v1/upload-installer*", access: { "*": ADMIN } },
  { path: "/api/v1/upload", access: { "*": ADMIN } },
  { path: "/api/v1/print-jobs*", access: { GET: PRINT_ROLES, PATCH: PRINT_ROLES, "*": ADMIN } },
  { path: "/api/v1/users/role", access: { "*": ADMIN_ONLY } },
  { path: "/api/v1/test*", access: { "*": ADMIN_ONLY } },

  // ---- Signed-in customers (handlers scope data to the caller) ------------
  { path: "/api/v1/square/customers*", access: { "*": "user" } },
  { path: "/api/v1/user-profile", access: { "*": "user" } },
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
