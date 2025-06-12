import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { z } from 'zod';
import { createFeaturedEventSchema } from "@validations/featured-events";
import { FeaturedEvent } from '@prisma/client';

// Helper function to convert Prisma event to API response
const convertPrismaEventToResponse = (event: FeaturedEvent) => ({
  id: event.id,
  title: event.title,
  date: event.date.toISOString(),
  description: event.description,
  imageSrc: event.imageSrc,
  imageAlt: event.imageAlt,
  link: event.link,
  enabled: event.enabled,
  order: event.order,
  createdAt: event.createdAt.toISOString(),
  updatedAt: event.updatedAt.toISOString()
});

export async function GET() {
  try {
    const events = await prisma.featuredEvent.findMany({
      where: { enabled: true },
      orderBy: { order: 'asc' },
    });

    // Convert each event to the expected format
    const formattedEvents = events.map(convertPrismaEventToResponse);

    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching featured events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured events' },
      { status: 500 }
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