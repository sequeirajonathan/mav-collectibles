import { z } from "zod";
import { apiErrorSchema, type ApiErrorCode } from "@lib/contracts/common";

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode | "NETWORK" | "INVALID_RESPONSE",
    message: string
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type QueryValue = string | number | boolean | undefined | null;

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`/api/v1${path}`, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return typeof window === "undefined" ? url.toString() : `${url.pathname}${url.search}`;
}

/**
 * Calls an API route and validates the JSON response against its contract.
 * A response that doesn't match the schema is an error, never silently cast.
 */
export async function apiRequest<S extends z.ZodType>(
  schema: S,
  path: string,
  options: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; query?: Record<string, QueryValue>; body?: unknown; signal?: AbortSignal } = {}
): Promise<z.infer<S>> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      credentials: "same-origin",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiClientError(0, "NETWORK", "Network error. Check your connection.");
  }

  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(json);
    throw parsed.success
      ? new ApiClientError(response.status, parsed.data.error.code, parsed.data.error.message)
      : new ApiClientError(response.status, "INTERNAL", `Request failed (${response.status})`);
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    console.error(`Response from ${path} did not match its contract`, parsed.error.issues);
    throw new ApiClientError(response.status, "INVALID_RESPONSE", "Unexpected response from the server");
  }
  return parsed.data;
}
