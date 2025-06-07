import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { updateCustomerSchema } from "@validations/square-customer";
import { z } from "zod";

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
    const customer = await client.customers.update({
      customerId,
      ...validatedData,
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