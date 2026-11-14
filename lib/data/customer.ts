import "server-only";
import { findCustomerForUser } from "@lib/square-customer";
import { customerSchema, type Customer } from "@lib/contracts/customer";

/** The signed-in user's Square customer (linked on first lookup), or null. */
export async function getMyCustomer(userId: string): Promise<Customer | null> {
  const c = await findCustomerForUser(userId);
  if (!c?.id) return null;
  return customerSchema.parse({
    id: c.id,
    givenName: c.givenName ?? undefined,
    familyName: c.familyName ?? undefined,
    emailAddress: c.emailAddress ?? undefined,
    phoneNumber: c.phoneNumber ?? undefined,
    note: c.note ?? undefined,
    referenceId: c.referenceId ?? undefined,
    address: c.address
      ? {
          addressLine1: c.address.addressLine1 ?? undefined,
          addressLine2: c.address.addressLine2 ?? undefined,
          locality: c.address.locality ?? undefined,
          administrativeDistrictLevel1: c.address.administrativeDistrictLevel1 ?? undefined,
          postalCode: c.address.postalCode ?? undefined,
          country: c.address.country ?? undefined,
        }
      : undefined,
  });
}
