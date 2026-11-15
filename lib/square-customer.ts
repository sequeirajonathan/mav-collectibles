import "server-only";
import { Square } from "square";
import { createSquareClient } from "@lib/square";
import { prisma } from "@lib/prisma";
import { serverEnv } from "@lib/env.server";

/** Square customer features are off until a Square token is configured (dev, CI). */
const squareEnabled = () => Boolean(serverEnv().SQUARE_ACCESS_TOKEN);

/** Normalizes any US phone format to E.164 (+1XXXXXXXXXX), or null. */
export function toE164(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return ten.length === 10 ? `+1${ten}` : null;
}

async function searchOne(filter: Square.CustomerFilter): Promise<Square.Customer | undefined> {
  const response = await createSquareClient().customers.search({
    limit: BigInt(1),
    query: { filter },
  });
  return response.customers?.[0];
}

/**
 * The Square customer linked to a user (referenceId = Supabase user id), or
 * undefined. Read-only: linking happens in ensureSquareCustomer.
 */
export async function findCustomerForUser(userId: string): Promise<Square.Customer | undefined> {
  if (!squareEnabled()) return undefined;
  return searchOne({ referenceId: { exact: userId } });
}

/** The user's email, only if they've confirmed they own it. */
async function confirmedEmail(userId: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ email: string | null }[]>`
    select email from auth.users where id = ${userId}::uuid and email_confirmed_at is not null`;
  return rows[0]?.email ?? null;
}

/**
 * Makes sure a user has a linked Square customer. Safe to call repeatedly.
 *
 * An existing (e.g. in-store) customer is linked only when its email matches
 * the user's *confirmed* email. Phone numbers aren't verified, so they never
 * link an existing record: anyone could type someone else's number.
 */
export async function ensureSquareCustomer(user: { id: string }): Promise<void> {
  if (!squareEnabled()) return;
  if (await findCustomerForUser(user.id)) return;

  const email = await confirmedEmail(user.id);
  if (!email) return;
  const client = createSquareClient();

  const byEmail = await searchOne({ emailAddress: { exact: email } });
  if (byEmail?.id && !byEmail.referenceId) {
    await client.customers.update({ customerId: byEmail.id, referenceId: user.id });
    return;
  }

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  await client.customers.create({
    idempotencyKey: `signup-${user.id}`,
    referenceId: user.id,
    emailAddress: email,
    phoneNumber: toE164(profile?.phone) ?? undefined,
    givenName: profile?.first_name ?? undefined,
    familyName: profile?.last_name ?? undefined,
  });
}
