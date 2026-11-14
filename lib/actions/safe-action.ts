import "server-only";
import { z } from "zod";
import { unstable_rethrow } from "next/navigation";
import type { ActionResult } from "@lib/contracts/common";
import { getCurrentUser, type CurrentUser } from "@lib/auth/server";
import type { UserRole } from "@interfaces/roles";

/** Throw inside an action to return a user-facing error. */
export class ActionError extends Error {}

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    out[key] ??= issue.message;
  }
  return out;
}

type Access = "public" | "user" | readonly UserRole[];
type HandlerUser<A extends Access> = A extends "public" ? CurrentUser | null : CurrentUser;

/**
 * Wraps a server action with input validation and an authorization check.
 * Server actions are public HTTP endpoints, so every action checks the caller
 * itself rather than relying on the page it's used from. Handlers for
 * signed-in access receive a non-null user.
 */
export function createAction<S extends z.ZodType, T, const A extends Access>(
  config: { input: S; access: A },
  handler: (input: z.infer<S>, user: HandlerUser<A>) => Promise<T>
): (input: z.input<S>) => Promise<ActionResult<T>> {
  return async (rawInput) => {
    const user = await getCurrentUser();
    if (config.access !== "public") {
      if (!user) return { ok: false, error: "Please sign in first." };
      if (config.access !== "user" && !(config.access as readonly UserRole[]).includes(user.role)) {
        return { ok: false, error: "You don't have permission to do that." };
      }
    }

    const parsed = config.input.safeParse(rawInput);
    if (!parsed.success) {
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: fieldErrorsFrom(parsed.error) };
    }

    try {
      return { ok: true, data: await handler(parsed.data, user as HandlerUser<A>) };
    } catch (error) {
      unstable_rethrow(error);
      if (error instanceof ActionError) return { ok: false, error: error.message };
      console.error("Server action failed", error);
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  };
}
