import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSquareClient } from '@lib/square';
import { updateCustomerSchema } from '@validations/square-customer';
import { z } from 'zod';
import { Square } from 'square';
import { validateAddress } from '@lib/shippo';
import { serializeBigIntValues } from "@utils/serialization";

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received update request:', body);

    const validatedData = updateCustomerSchema.parse(body);
    console.log('Validated data:', validatedData);

    const { customerId, ...updateData } = validatedData;

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
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