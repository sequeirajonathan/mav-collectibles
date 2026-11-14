import { NextResponse } from 'next/server';
import { requireUser } from '@lib/auth/server';
import { assertCustomerOwnedBy, CustomerAccessError } from '@lib/square-customer';
import { createSquareClient } from '@lib/square';
import { updateCustomerSchema } from '@validations/square-customer';
import { z } from 'zod';
import { Square } from 'square';
import { validateAddress } from '@lib/shippo';
import { serializeBigIntValues } from "@utils/serialization";

export async function PUT(request: Request) {
  try {
    const { user, response: denied } = await requireUser();
    if (denied) return denied;

    const body = await request.json();

    const validatedData = updateCustomerSchema.parse(body);

    const { customerId, ...updateData } = validatedData;

    // Users may only edit the Square customer linked to their own account.
    await assertCustomerOwnedBy(customerId, user.id);
    // The link itself can't be changed from the client.
    delete (updateData as { referenceId?: string }).referenceId;

    // Validate address with Shippo if address is provided
    if (updateData.address) {
      const validationResult = await validateAddress(updateData.address);
      
      if (!validationResult.isValid) {
        return NextResponse.json({
          error: 'Invalid address',
          details: validationResult.messages,
        }, { status: 400 });
      }

      // If there's a suggested address, return it for user confirmation
      if (validationResult.validatedAddress && 
          JSON.stringify(validationResult.validatedAddress) !== JSON.stringify(updateData.address)) {
        return NextResponse.json({
          status: 'address_suggestion',
          originalAddress: updateData.address,
          suggestedAddress: validationResult.validatedAddress,
          messages: validationResult.messages,
        });
      }

      // Use the validated address if available
      if (validationResult.validatedAddress) {
        updateData.address = validationResult.validatedAddress;
      }
    }

    const squareClient = createSquareClient();

    // Update customer in Square
    const response = await squareClient.customers.update({
      customerId,
      givenName: updateData.givenName,
      familyName: updateData.familyName,
      emailAddress: updateData.emailAddress,
      phoneNumber: updateData.phoneNumber,
      address: updateData.address ? {
        addressLine1: updateData.address.addressLine1,
        addressLine2: updateData.address.addressLine2,
        locality: updateData.address.locality,
        administrativeDistrictLevel1: updateData.address.administrativeDistrictLevel1,
        postalCode: updateData.address.postalCode,
        country: updateData.address.country as Square.Country
      } : undefined,
      note: updateData.note
    });

    console.log('Square API response:', JSON.stringify(response, serializeBigIntValues, 2));

    if (!response.customer) {
      console.error('Square API error:', response);
      throw new Error('Failed to update customer in Square');
    }

    return NextResponse.json(
      JSON.parse(JSON.stringify(response.customer, serializeBigIntValues))
    );
  } catch (error) {
    console.error('Error updating Square customer:', error);
    if (error instanceof CustomerAccessError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: 'Failed to update customer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: error instanceof Error && 'statusCode' in error ? (error.statusCode as number) : 500 }
    );
  }
} 