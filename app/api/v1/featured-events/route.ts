import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { z } from 'zod';
import { createFeaturedEventSchema } from "@validations/featured-events";
import { FeaturedEvent } from '@prisma/client';

// Helper function to convert Prisma event to API response
const convertPrismaEventToResponse = (event: FeaturedEvent) => ({
  ...event,
  date: event.date.toISOString(),
  createdAt: event.createdAt.toISOString(),
  updatedAt: event.updatedAt.toISOString()
});

export async function GET() {
  try {
    const featuredEvents = await prisma.featuredEvent.findMany({
      orderBy: { order: 'asc' },
      where: {
        enabled: true // Only fetch enabled events
      }
    });
    
    return NextResponse.json(featuredEvents.map(convertPrismaEventToResponse), {
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
    
    // Convert the date string to a Date object for Prisma
    const eventData = {
      ...validatedData,
      date: new Date(validatedData.date)
    };
    
    const event = await prisma.featuredEvent.create({
      data: eventData
    });
    
    return NextResponse.json(convertPrismaEventToResponse(event));
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