import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { apiRequest, ApiClientError } from "@lib/api/client";

const schema = z.object({ items: z.array(z.string()), cursor: z.string().nullable() });
const respond = (status: number, body: unknown) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

afterEach(() => vi.restoreAllMocks());

describe("apiRequest", () => {
  it("returns data that matches the contract", async () => {
    respond(200, { items: ["a"], cursor: null });
    await expect(apiRequest(schema, "/catalog/search", { query: { query: "box", cursor: undefined } })).resolves.toEqual({ items: ["a"], cursor: null });
    const url = String(vi.mocked(fetch).mock.calls[0]?.[0]);
    expect(url).toContain("/api/v1/catalog/search?query=box");
    expect(url).not.toContain("cursor");
  });

  it("rejects responses that don't match the contract", async () => {
    respond(200, { items: [1], cursor: null });
    await expect(apiRequest(schema, "/x")).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("surfaces typed API errors", async () => {
    respond(403, { error: { code: "FORBIDDEN", message: "Nope" } });
    const error = await apiRequest(schema, "/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ status: 403, code: "FORBIDDEN", message: "Nope" });
  });

  it("reports network failures", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(apiRequest(schema, "/x")).rejects.toMatchObject({ code: "NETWORK" });
  });
});
