import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@lib/prisma";

const env = vi.hoisted(() => ({ BOOTSTRAP_ADMIN_EMAIL: undefined as string | undefined }));
const updateUserById = vi.hoisted(() => vi.fn(() => Promise.resolve({ error: null })));
vi.mock("@lib/env.server", () => ({ serverEnv: () => env }));
vi.mock("@utils/supabase/admin", () => ({ createAdminClient: () => ({ auth: { admin: { updateUserById } } }) }));

const { bootstrapFirstAdmin } = await import("@lib/auth/bootstrap");

let customerId: string;
const idOf = async (email: string) =>
  (await prisma.$queryRaw<{ id: string }[]>`select id::text from auth.users where email = ${email}`)[0].id;
const setAdminRole = (role: string) =>
  prisma.$executeRaw`update auth.users set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', ${role}::text) where email = 'admin@mav.local'`;

beforeAll(async () => {
  customerId = await idOf("customer@mav.local");
});
beforeEach(() => {
  updateUserById.mockClear();
  env.BOOTSTRAP_ADMIN_EMAIL = undefined;
});
afterAll(async () => {
  await setAdminRole("ADMIN");
  await prisma.$disconnect();
});

describe("bootstrapFirstAdmin", () => {
  it("does nothing when the setting is empty", async () => {
    expect(await bootstrapFirstAdmin(customerId)).toBe(false);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("does nothing once the site has an admin", async () => {
    env.BOOTSTRAP_ADMIN_EMAIL = "customer@mav.local";
    expect(await bootstrapFirstAdmin(customerId)).toBe(false);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("promotes the named, confirmed account while there is no admin", async () => {
    await setAdminRole("USER");
    try {
      env.BOOTSTRAP_ADMIN_EMAIL = "Customer@MAV.local";
      expect(await bootstrapFirstAdmin(customerId)).toBe(true);
      expect(updateUserById).toHaveBeenCalledWith(customerId, { app_metadata: { role: "ADMIN" } });

      // Someone else signing in gets nothing.
      updateUserById.mockClear();
      expect(await bootstrapFirstAdmin(await idOf("staff@mav.local"))).toBe(false);
      expect(updateUserById).not.toHaveBeenCalled();
    } finally {
      await setAdminRole("ADMIN");
    }
  });

  it("ignores an account that hasn't confirmed its email", async () => {
    await setAdminRole("USER");
    await prisma.$executeRaw`update auth.users set email_confirmed_at = null where id = ${customerId}::uuid`;
    try {
      env.BOOTSTRAP_ADMIN_EMAIL = "customer@mav.local";
      expect(await bootstrapFirstAdmin(customerId)).toBe(false);
    } finally {
      await prisma.$executeRaw`update auth.users set email_confirmed_at = now() where id = ${customerId}::uuid`;
      await setAdminRole("ADMIN");
    }
  });
});
