import { expect, type Page } from "@playwright/test";
import { z } from "zod";

const searchResult = z.object({ messages: z.array(z.object({ ID: z.string() })).optional() });
const message = z.object({ Text: z.string() });

export const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
export const PASSWORD = "password123";

/** Signs in through the real form (works with username or email). */
export async function signIn(page: Page, identifier: string, password = PASSWORD, next = "/dashboard") {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  const form = page.locator("main form").filter({ has: page.locator("input[type=password]") });
  await form.getByLabel("Email or Username").fill(identifier);
  await form.getByLabel("Password").fill(password);
  await form.getByRole("button", { name: /sign in/i }).click();
}

export async function signInAs(page: Page, identifier: string, next = "/dashboard") {
  await signIn(page, identifier, PASSWORD, next);
  await expect(page).toHaveURL((url) => url.pathname === next);
}

/** Latest auth email link (confirmation / reset) sent to an address. */
export async function emailLink(to: string, skipId?: string): Promise<{ id: string; link: string }> {
  for (let i = 0; i < 40; i++) {
    const list = searchResult.parse(await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)).json());
    const msg = list.messages?.find((m) => m.ID !== skipId);
    if (msg) {
      const full = message.parse(await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json());
      const link = full.Text.match(/https?:\/\/\S+verify\S+/)?.[0];
      if (link) return { id: msg.ID, link: link.replace(/&amp;/g, "&").replace(/\)$/, "") };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No email for ${to}`);
}
