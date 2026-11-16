"use server";

import type { Square } from "square";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { ActionError, createAction } from "@lib/actions/safe-action";
import { createSquareClient } from "@lib/square";
import { findCustomerForUser, toE164 } from "@lib/square-customer";
import { validateAddress } from "@lib/shippo";
import { serverEnv } from "@lib/env.server";
import { createAdminClient } from "@utils/supabase/admin";
import { UserRole } from "@interfaces/roles";
import { searchPeople } from "@lib/data/users";
import { PLAYER_ID } from "@lib/event-questions";
import { roleChangeInput, updateCustomerInput, type UpdateCustomerResponse } from "@lib/contracts/customer";

const profileInput = z.object({
  firstName: z.string().trim().max(60),
  lastName: z.string().trim().max(60),
  phone: z.string().transform((v) => toE164(v)).refine((v): v is string => v !== null, "Enter a 10-digit US phone number"),
  favoriteGameId: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
  pokemonPlayerId: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().regex(PLAYER_ID, "Player IDs are numbers only").nullable()).default(null),
});

/** Updates the caller's profile (and their linked Square customer's name/phone). */
export const updateMyProfile = createAction({ input: profileInput, access: "user" }, async (input, user) => {
  await prisma.profile.update({
    where: { id: user.id },
    data: { first_name: input.firstName || null, last_name: input.lastName || null, phone: input.phone, favorite_game_id: input.favoriteGameId, pokemon_player_id: input.pokemonPlayerId },
  });
  return null;
});

/** Updates the caller's own Square customer. The customer is resolved server-side. */
export const updateMyCustomer = createAction(
  { input: updateCustomerInput.extend({ acceptSuggestion: z.boolean().default(false) }), access: "user" },
  async ({ acceptSuggestion, ...input }, user): Promise<UpdateCustomerResponse> => {
    const customer = await findCustomerForUser(user.id);
    if (!customer?.id) throw new ActionError("We couldn't find your store account yet. Try signing out and back in.");

    let address = input.address;
    if (address && serverEnv().SHIPPO_API_KEY && !acceptSuggestion) {
      const check = await validateAddress(address);
      if (!check.isValid) return { status: "invalid_address", messages: check.messages };
      if (check.validatedAddress && JSON.stringify(check.validatedAddress) !== JSON.stringify(address)) {
        return { status: "address_suggestion", originalAddress: address, suggestedAddress: check.validatedAddress, messages: check.messages };
      }
      address = check.validatedAddress ?? address;
    }

    const { customer: updated } = await createSquareClient().customers.update({
      customerId: customer.id,
      givenName: input.givenName,
      familyName: input.familyName,
      emailAddress: input.emailAddress,
      phoneNumber: input.phoneNumber,
      address: address ? { ...address, country: (address.country ?? "US") as Square.Country } : undefined,
    });
    if (!updated?.id) throw new ActionError("Square didn't accept the update. Please try again.");
    return {
      status: "updated",
      customer: {
        id: updated.id,
        givenName: updated.givenName ?? undefined,
        familyName: updated.familyName ?? undefined,
        emailAddress: updated.emailAddress ?? undefined,
        phoneNumber: updated.phoneNumber ?? undefined,
      },
    };
  }
);

async function resolveUserId(identifier: string): Promise<string | null> {
  if (z.uuid().safeParse(identifier).success) return identifier;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    select u.id from auth.users u left join public.profiles p on p.id = u.id
    where lower(u.email) = lower(${identifier}) or lower(p.username) = lower(${identifier})
    limit 1`;
  return rows[0]?.id ?? null;
}

/** ADMIN only: people matching what was typed, for the role picker. */
export const findPeople = createAction({ input: z.object({ query: z.string().max(80) }), access: [UserRole.ADMIN] }, async ({ query }) => {
  return { people: await searchPeople(query) };
});

/** ADMIN only: sets a user's role in app_metadata. */
export const setUserRole = createAction({ input: roleChangeInput, access: [UserRole.ADMIN] }, async (input, admin) => {
  const userId = await resolveUserId(input.user);
  if (!userId) throw new ActionError("No user with that email, username or ID.");
  if (userId === admin.id && input.role !== UserRole.ADMIN) throw new ActionError("You can't remove your own admin role.");
  const { data, error } = await createAdminClient().auth.admin.updateUserById(userId, { app_metadata: { role: input.role } });
  if (error || !data.user) throw new ActionError("Couldn't update that user's role.");
  // End their sessions so no device keeps a token with the old role.
  if (userId !== admin.id) await prisma.$executeRaw`delete from auth.sessions where user_id = ${userId}::uuid`;
  const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { username: true } });
  return { username: profile?.username ?? data.user.email ?? userId, role: input.role };
});
