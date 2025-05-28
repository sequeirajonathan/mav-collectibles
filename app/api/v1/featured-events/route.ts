import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { z } from 'zod';
import { createFeaturedEvent } from "@services/featuredEventService";
import { createFeaturedEventSchema } from "@validations/featured-events";

export async function GET() {
  try {
    const featuredEvents = await prisma.featuredEvent.findMany({
      orderBy: { order: 'asc' },
      where: {
        enabled: true // Only fetch enabled events
      }
    });
    
    return NextResponse.json(featuredEvents, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching featured events:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch featured events' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = createFeaturedEventSchema.parse(body);
    
    const event = await createFeaturedEvent(validatedData);
    
    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error creating featured event:", error);
    return NextResponse.json(
      { error: "Failed to create featured event" },
      { status: 500 }
    );
  }
} 