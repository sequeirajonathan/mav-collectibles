import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { featuredEventSchema } from '@/lib/validations/feature-flags';

const prisma = new PrismaClient();

// Define the Params type
type Params = { params: { id: string } }

export async function GET(request: Request, { params }: Params) {
  const id = params.id;
  try {
    const featuredEvent = await prisma.featuredEvent.findUnique({
      where: { id }
    });
    
    if (!featuredEvent) {
      return NextResponse.json({ error: 'Featured event not found' }, { status: 404 });
    }
    
    return NextResponse.json(featuredEvent);
  } catch (error) {
    console.error('Error fetching featured event:', error);
    return NextResponse.json({ error: 'Failed to fetch featured event' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const id = params.id;
  try {
    const body = await request.json();
    
    // Validate the request body
    const validationResult = featuredEventSchema.partial().safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const featuredEvent = await prisma.featuredEvent.update({
      where: { id },
      data: validationResult.data
    });
    
    return NextResponse.json(featuredEvent);
  } catch (error) {
    console.error('Error updating featured event:', error);
    return NextResponse.json({ error: 'Failed to update featured event' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const id = params.id;
  try {
    await prisma.featuredEvent.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting featured event:', error);
    return NextResponse.json({ error: 'Failed to delete featured event' }, { status: 500 });
  }
} 