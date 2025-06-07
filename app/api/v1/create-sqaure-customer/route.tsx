import { NextResponse } from "next/server";
import { createSquareClient } from "@lib/square";
import { createCustomerSchema } from "@validations/square-customer";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createCustomerSchema.parse(body);

    const client = createSquareClient();
    const customer = await client.customers.create({
      ...validatedData,
      phoneNumber: validatedData.phoneNumber, // This will already have the "1" prefix from the transform
    });

    return NextResponse.json({
      customer,
    });
  } catch (error) {
    console.error("Error creating Square customer:", error);
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
        error: "Failed to create customer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
