import { NextResponse } from 'next/server';
import { requireUser } from '@lib/auth/server';
import { findCustomerForUser } from '@lib/square-customer';

/**
 * Returns the signed-in user's own Square customer (or null). The customer is
 * resolved on the server from the user's id/profile phone; the request body is
 * ignored so one user can't look up another's record.
 */
export async function POST() {
  const { user, response } = await requireUser();
  if (response) return response;

  try {
    const customer = await findCustomerForUser(user.id);
    if (!customer) return NextResponse.json(null);

    return NextResponse.json({
      id: customer.id,
      givenName: customer.givenName,
      familyName: customer.familyName,
      emailAddress: customer.emailAddress,
      phoneNumber: customer.phoneNumber,
      address: customer.address
        ? {
            addressLine1: customer.address.addressLine1,
            addressLine2: customer.address.addressLine2,
            locality: customer.address.locality,
            administrativeDistrictLevel1: customer.address.administrativeDistrictLevel1,
            postalCode: customer.address.postalCode,
            country: customer.address.country,
          }
        : undefined,
      note: customer.note,
      referenceId: customer.referenceId,
    });
  } catch (error) {
    console.error('Error looking up Square customer:', error);
    return NextResponse.json({ error: 'Failed to load customer' }, { status: 500 });
  }
}
