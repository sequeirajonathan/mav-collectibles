import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { featuredEventSchema } from '@/lib/validations/feature-flags';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const featuredEvents = await prisma.featuredEvent.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(featuredEvents);
  } catch (error) {
    console.error('Error fetching featured events:', error);
    return NextResponse.json({ error: 'Failed to fetch featured events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validationResult = featuredEventSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const featuredEvent = await prisma.featuredEvent.create({
      data: validationResult.data
    });
    
    return NextResponse.json(featuredEvent);
  } catch (error) {
    console.error('Error creating featured event:', error);
    return NextResponse.json({ error: 'Failed to create featured event' }, { status: 500 });
  }
} 