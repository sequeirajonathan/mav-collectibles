import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { updateCustomerSchema } from "@validations/square-customer";
import { z } from "zod";
import { Square } from "square";

type UpdateCustomer = z.infer<typeof updateCustomerSchema>;

export async function PUT(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params;
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateCustomerSchema.parse(body);

    const client = createSquareClient();
    // Prepare update payload
    const updatePayload: UpdateCustomer & { customerId: string } = { ...validatedData, customerId };
    if (updatePayload.address && updatePayload.address.country) {
      // Square expects country as enum
      updatePayload.address.country = updatePayload.address.country as Square.Country;
    }
    if (validatedData.referenceId) {
      updatePayload.referenceId = validatedData.referenceId;
    }
    // Ensure correct type for address.country before sending
    const customer = await client.customers.update({
      ...updatePayload,
      address: updatePayload.address
        ? { ...updatePayload.address, country: updatePayload.address.country as Square.Country }
        : undefined,
    });

    return NextResponse.json({
      customer,
    });
  } catch (error) {
    console.error("Error updating Square customer:", error);
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
        error: "Failed to update customer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 