import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSquareClient } from '@lib/square';
import { z } from 'zod';
import { serializeBigIntValues } from '@utils/serialization';
import { Square } from 'square';

const searchSchema = z.object({
  phoneNumber: z.string().min(1)
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      console.error('[GET /square/customers/search] No user session', { session });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      console.error('[GET /square/customers/search] Missing phone number', { searchParams: request.url });
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const client = createSquareClient();
    const searchQuery = {
      count: true,
      query: {
        filter: {
          phoneNumber: {
            exact: `+1${phoneNumber.replace(/^\+1|\D/g, '')}`,
          },
        },
        sort: {
          field: "DEFAULT" as Square.CustomerSortField,
          order: "ASC" as Square.SortOrder,
        },
      },
    };
    
    console.log('[GET /square/customers/search] Square search query:', JSON.stringify(searchQuery, null, 2));
    
    const response = await client.customers.search(searchQuery);
    console.log('[GET /square/customers/search] Square API response:', JSON.stringify(response, serializeBigIntValues, 2));

    if (!response.customers?.length) {
      console.warn('[GET /square/customers/search] No customers found for', { phoneNumber });
      return NextResponse.json(null);
    }

    // Transform the Square response to match our interface
    const customer = response.customers[0];
    const serializedCustomer = {
      id: customer.id || '',
      emailAddress: customer.emailAddress,
      givenName: customer.givenName,
      familyName: customer.familyName,
      phoneNumber: customer.phoneNumber,
      address: customer.address ? {
        addressLine1: customer.address.addressLine1,
        addressLine2: customer.address.addressLine2,
        locality: customer.address.locality,
        postalCode: customer.address.postalCode,
        administrativeDistrictLevel1: customer.address.administrativeDistrictLevel1,
        country: customer.address.country,
      } : undefined,
      referenceId: customer.referenceId,
    };

    return NextResponse.json(JSON.parse(JSON.stringify(serializedCustomer, serializeBigIntValues)));
  } catch (error) {
    console.error('[GET /square/customers/search] Error:', error instanceof Error ? error.stack || error.message : error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: "Failed to search customers",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber } = searchSchema.parse(body);

    const squareClient = createSquareClient();
    const response = await squareClient.customers.search({
      query: {
        filter: {
          phoneNumber: {
            exact: phoneNumber
          }
        }
      }
    });

    if (!response.customers?.length) {
      return NextResponse.json(null);
    }

    // Extract and serialize the customer data
    const customer = response.customers[0];
    const serializedCustomer = {
      id: customer.id,
      givenName: customer.givenName,
      familyName: customer.familyName,
      emailAddress: customer.emailAddress,
      phoneNumber: customer.phoneNumber,
      address: customer.address ? {
        addressLine1: customer.address.addressLine1,
        addressLine2: customer.address.addressLine2,
        locality: customer.address.locality,
        administrativeDistrictLevel1: customer.address.administrativeDistrictLevel1,
        postalCode: customer.address.postalCode,
        country: customer.address.country
      } : undefined,
      note: customer.note,
      referenceId: customer.referenceId,
    };

    return NextResponse.json(serializedCustomer);
  } catch (error) {
    console.error('Error searching Square customer:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to search customer' },
      { status: 500 }
    );
  }
} 