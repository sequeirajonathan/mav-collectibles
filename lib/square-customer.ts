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
 * Finds the Square customer that belongs to a user: first by referenceId
 * (= Supabase user id), then by the phone on their profile. A customer found
 * by phone that is linked to a different user is never returned. An unlinked
 * match gets linked to this user.
 */
export async function findCustomerForUser(userId: string): Promise<Square.Customer | undefined> {
  if (!squareEnabled()) return undefined;
  const byReference = await searchOne({ referenceId: { exact: userId } });
  if (byReference) return byReference;

  const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { phone: true } });
  const phone = toE164(profile?.phone);
  if (!phone) return undefined;

  const byPhone = await searchOne({ phoneNumber: { exact: phone } });
  if (!byPhone?.id) return undefined;
  if (byPhone.referenceId && byPhone.referenceId !== userId) return undefined;

  if (!byPhone.referenceId) {
    const { customer } = await createSquareClient().customers.update({
      customerId: byPhone.id,
      referenceId: userId,
    });
    return customer ?? byPhone;
  }
  return byPhone;
}

/**
 * Makes sure a signed-up user has a linked Square customer: links an existing
 * customer with the same phone, or creates one. Safe to call repeatedly.
 */
export async function ensureSquareCustomer(user: {
  id: string;
  email: string | null;
}): Promise<void> {
  if (!squareEnabled()) return;
  const existing = await findCustomerForUser(user.id);
  if (existing) return;

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  const phone = toE164(profile?.phone);
  // Square requires at least one identifying field; wait until we have a phone.
  if (!phone) return;

  await createSquareClient().customers.create({
    idempotencyKey: `signup-${user.id}`,
    referenceId: user.id,
    emailAddress: user.email ?? undefined,
    phoneNumber: phone,
    givenName: profile?.first_name ?? undefined,
    familyName: profile?.last_name ?? undefined,
  });
}
