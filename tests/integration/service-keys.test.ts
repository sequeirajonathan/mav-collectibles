import { afterAll, afterEach, describe, expect, it } from "vitest";
import { prisma } from "@lib/prisma";
import { decryptServiceKey, encryptServiceKey, getServiceKey, listServiceKeyStatus } from "@lib/service-keys";

const NAME = "SHIPPO_API_KEY";
const VALUE = "shippo_test_0123456789abcdef";

afterEach(async () => {
  delete process.env.DISCORD_WEBHOOK_URL;
  await prisma.serviceKey.deleteMany({ where: { name: { in: [NAME, "DISCORD_WEBHOOK_URL"] } } });
});
afterAll(async () => {
  await prisma.serviceKey.deleteMany({ where: { name: { in: [NAME, "DISCORD_WEBHOOK_URL"] } } });
});

describe("service keys entered by an admin", () => {
  it("are stored encrypted and read back for the service", async () => {
    const ciphertext = encryptServiceKey(VALUE);
    expect(ciphertext).not.toContain(VALUE);
    // The same value encrypts differently each time, so equal keys can't be spotted in the table.
    expect(encryptServiceKey(VALUE)).not.toBe(ciphertext);
    await prisma.serviceKey.create({ data: { name: NAME, ciphertext } });
    expect(await getServiceKey(NAME)).toBe(VALUE);
    const [row] = await prisma.$queryRaw<{ ciphertext: string }[]>`select ciphertext from public.service_keys where name = ${NAME}`;
    expect(row?.ciphertext).not.toContain(VALUE);
  });

  it("an altered or foreign value is treated as not set", async () => {
    const ciphertext = encryptServiceKey(VALUE);
    const parts = ciphertext.split(".");
    const tampered = [...parts.slice(0, 3), Buffer.from("something else entirely").toString("base64url")].join(".");
    expect(decryptServiceKey(tampered)).toBeNull();
    expect(decryptServiceKey("not-a-stored-value")).toBeNull();
    await prisma.serviceKey.create({ data: { name: NAME, ciphertext: tampered } });
    expect(await getServiceKey(NAME)).toBeUndefined();
    expect((await listServiceKeyStatus()).find((k) => k.name === NAME)?.source).toBe("unreadable");
  });

  it("a key in the hosting settings wins over one saved here", async () => {
    const saved = "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyzABCDEF";
    await prisma.serviceKey.create({ data: { name: "DISCORD_WEBHOOK_URL", ciphertext: encryptServiceKey(saved) } });
    expect(await getServiceKey("DISCORD_WEBHOOK_URL")).toBe(saved);
    expect((await listServiceKeyStatus()).find((k) => k.name === "DISCORD_WEBHOOK_URL")?.source).toBe("saved");
    process.env.DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/999999999999999999/hostvaluehostvaluehostvalue12345";
    expect(await getServiceKey("DISCORD_WEBHOOK_URL")).toContain("hostvalue");
    expect((await listServiceKeyStatus()).find((k) => k.name === "DISCORD_WEBHOOK_URL")?.source).toBe("host");
  });

  it("the status list never carries a key's value", async () => {
    await prisma.serviceKey.create({ data: { name: NAME, ciphertext: encryptServiceKey(VALUE) } });
    const text = JSON.stringify(await listServiceKeyStatus());
    expect(text).not.toContain(VALUE);
    expect(text).not.toContain("ciphertext");
  });
});
