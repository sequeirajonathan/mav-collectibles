import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { UserRole } from "@interfaces/roles";
import type { CurrentUser } from "@lib/auth/server";

const auth = vi.hoisted(() => ({
  getCurrentUser: vi.fn<() => Promise<CurrentUser | null>>(),
  currentRole: vi.fn<(id: string) => Promise<UserRole | null>>(),
}));
vi.mock("@lib/auth/server", () => auth);

const { createAction, ActionError } = await import("@lib/actions/safe-action");

const user = (role: UserRole): CurrentUser => ({ id: "u1", email: "u@mav.local", role });
const handler = vi.fn((input: { n: number }, u: CurrentUser | null) => Promise.resolve({ n: input.n, role: u?.role }));

const adminOnly = createAction({ input: z.object({ n: z.number() }), access: [UserRole.ADMIN] }, handler);
const signedIn = createAction({ input: z.object({ n: z.number() }), access: "user" }, handler);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createAction", () => {
  it("rejects signed-out callers without running the handler", async () => {
    auth.getCurrentUser.mockResolvedValue(null);
    expect(await signedIn({ n: 1 })).toEqual({ ok: false, error: "Please sign in first." });
    expect(handler).not.toHaveBeenCalled();
  });

  it("checks the role as stored now, not the token's copy", async () => {
    // Token still says ADMIN, but the user was demoted.
    auth.getCurrentUser.mockResolvedValue(user(UserRole.ADMIN));
    auth.currentRole.mockResolvedValue(UserRole.USER);
    expect(await adminOnly({ n: 1 })).toEqual({ ok: false, error: "You don't have permission to do that." });
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects deleted or banned accounts", async () => {
    auth.getCurrentUser.mockResolvedValue(user(UserRole.ADMIN));
    auth.currentRole.mockResolvedValue(null);
    expect((await adminOnly({ n: 1 })).ok).toBe(false);
  });

  it("passes the fresh role to the handler", async () => {
    // Token says STAFF; the user has since been promoted.
    auth.getCurrentUser.mockResolvedValue(user(UserRole.STAFF));
    auth.currentRole.mockResolvedValue(UserRole.ADMIN);
    expect(await adminOnly({ n: 2 })).toEqual({ ok: true, data: { n: 2, role: UserRole.ADMIN } });
  });

  it("validates input before the handler runs", async () => {
    auth.getCurrentUser.mockResolvedValue(user(UserRole.USER));
    const result = await signedIn({ n: "nope" as unknown as number });
    expect(result.ok).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns ActionError messages and hides other errors", async () => {
    auth.getCurrentUser.mockResolvedValue(user(UserRole.USER));
    const failing = createAction({ input: z.object({}), access: "user" }, () => Promise.reject(new ActionError("Event is full.")));
    expect(await failing({})).toEqual({ ok: false, error: "Event is full." });

    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const crashing = createAction({ input: z.object({}), access: "user" }, () => Promise.reject(new Error("db password is hunter2")));
    expect(await crashing({})).toEqual({ ok: false, error: "Something went wrong. Please try again." });
  });
});
