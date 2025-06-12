import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { searchCustomerSchema } from "@validations/square-customer";
import { z } from "zod";
import { serializeBigIntValues } from "@utils/serialization";
import { Square } from "square";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);
    
    const validatedData = searchCustomerSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Format phone number to E164 format (e.g., +19545405276)
    // Remove any existing +1 prefix and non-digit characters, then add +1
    const formattedPhoneNumber = `+1${validatedData.phoneNumber.replace(/^\+1|\D/g, '')}`;
    console.log('Formatted phone number for Square:', formattedPhoneNumber);

    const client = createSquareClient();
    const searchQuery = {
      count: true,
      query: {
        filter: {
          phoneNumber: {
            exact: formattedPhoneNumber,
          },
          ...(validatedData.emailAddress && {
            emailAddress: {
              exact: validatedData.emailAddress,
            },
          }),
          ...(validatedData.referenceId && {
            referenceId: {
              exact: validatedData.referenceId,
            },
          }),
        },
        sort: {
          field: (validatedData.sortField || "DEFAULT") as Square.CustomerSortField,
          order: (validatedData.sortOrder || "ASC") as Square.SortOrder,
        },
      },
    };
    
    console.log('Square search query:', JSON.stringify(searchQuery, null, 2));
    
    const response = await client.customers.search(searchQuery);
    console.log('Square API response:', JSON.stringify(response, serializeBigIntValues, 2));

    // Transform the Square response to match our interface
    const customers = (response.customers || []).map(customer => ({
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
    }));

    const responseData = { customers };
    const serializedResponse = JSON.stringify(responseData, serializeBigIntValues);

    return new NextResponse(serializedResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error("Error searching Square customers:", error);
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