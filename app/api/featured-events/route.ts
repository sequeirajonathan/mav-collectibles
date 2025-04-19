import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const featuredEventSchema = z.object({
  title: z.string(),
  date: z.string(),
  description: z.string(),
  imageSrc: z.string(),
  imageAlt: z.string(),
  bulletPoints: z.array(z.string()),
  link: z.string().optional(),
  enabled: z.boolean().default(true),
  order: z.number().default(0),
});

export async function GET() {
  try {
    const featuredEvents = await prisma.featuredEvent.findMany({
      orderBy: { order: 'asc' },
    });
    
    return NextResponse.json(featuredEvents);
  } catch (error) {
    console.error('Error fetching featured events:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch featured events' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = featuredEventSchema.parse(body);
    
    const newFeaturedEvent = await prisma.featuredEvent.create({
      data: validatedData,
    });
    
    return NextResponse.json(newFeaturedEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating featured event:', error);
    return NextResponse.json(
      { error: 'Failed to create featured event' },
      { status: 500 }
    );
  }
} 