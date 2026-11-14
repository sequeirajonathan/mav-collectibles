import { z } from "zod";

/** ISO-8601 timestamp string as sent over the wire. Accepts Date objects from the server. */
export const isoDateTime = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString() : value),
  z.iso.datetime({ offset: true })
);

export const uuid = z.uuid();

export const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes");

/** Optional free-text field: trims, and turns "" into null. */
export const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable()
  );

export const optionalUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.union([z.url(), z.string().regex(/^\/[^/]/, "Must be a URL or a site path")]).nullable()
);

/** Body of every error response from the API. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(["BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "INTERNAL"]),
    message: z.string(),
    issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiErrorCode = ApiError["error"]["code"];

/** Result of every server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function cursorPage<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), cursor: z.string().nullable() });
}
