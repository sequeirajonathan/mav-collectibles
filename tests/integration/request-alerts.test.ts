import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@lib/prisma";
import { SYSTEM_AUTHOR_ID, sendRequestAlerts } from "@lib/request-alerts";

const ASKER = "11111111-2222-4333-8444-555555555555";
const made: string[] = [];

async function request(title: string, status: string) {
  const row = await prisma.staffRequest.create({
    data: { title, status, response: status === "done" ? "Shipped it." : "", created_by: ASKER, created_by_name: "Test Asker", completed_at: status === "done" ? new Date() : null },
  });
  made.push(row.id);
  return row.id;
}

const announcements = (title: string) => prisma.staffMessage.findMany({ where: { author_id: SYSTEM_AUTHOR_ID, body: { contains: title } } });

afterAll(async () => {
  await prisma.staffMessage.deleteMany({ where: { author_id: SYSTEM_AUTHOR_ID, body: { contains: "alert-test" } } });
  await prisma.staffRequest.deleteMany({ where: { id: { in: made } } });
});

describe("finished request alerts", () => {
  it("announces a finished request in Team chat, once", async () => {
    // Clear anything left unannounced by other tests so counts below are ours.
    await sendRequestAlerts();
    const title = `alert-test done ${Date.now()}`;
    const id = await request(title, "done");

    expect(await sendRequestAlerts()).toBe(1);
    const [message, ...extra] = await announcements(title);
    expect(extra).toHaveLength(0);
    expect(message?.body).toContain("Test Asker");
    expect(message?.body).toContain("Shipped it.");
    expect((await prisma.staffRequest.findUniqueOrThrow({ where: { id } })).notified_at).not.toBeNull();

    // Running again, or twice at once, never repeats it.
    expect(await sendRequestAlerts()).toBe(0);
    await Promise.all([sendRequestAlerts(), sendRequestAlerts()]);
    expect(await announcements(title)).toHaveLength(1);
  });

  it("says nothing about requests that aren't finished", async () => {
    const title = `alert-test open ${Date.now()}`;
    await request(title, "in_progress");
    await request(`${title} declined`, "declined");
    expect(await sendRequestAlerts()).toBe(0);
    expect(await announcements(title)).toHaveLength(0);
  });

  it("two callers at once announce a request only once", async () => {
    const title = `alert-test race ${Date.now()}`;
    await request(title, "done");
    const sent = await Promise.all([sendRequestAlerts(), sendRequestAlerts(), sendRequestAlerts()]);
    expect(sent.reduce((a, b) => a + b, 0)).toBe(1);
    expect(await announcements(title)).toHaveLength(1);
  });
});
