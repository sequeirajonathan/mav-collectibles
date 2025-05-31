import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { z } from 'zod';
import { optionalUrlSchema } from '@validations/base';

const featuredEventPatchSchema = z.object({
  title: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  imageSrc: z.string().optional(),
  imageAlt: z.string().optional(),
  bulletPoints: z.array(z.string()).optional(),
  link: optionalUrlSchema,
  enabled: z.boolean().optional(),
  order: z.number().optional(),
});

// Helper function to convert Prisma event to API response
const convertPrismaEventToResponse = (event: any) => ({
  ...event,
  date: event.date.toISOString(),
  createdAt: event.createdAt.toISOString(),
  updatedAt: event.updatedAt.toISOString()
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const featuredEvent = await prisma.featuredEvent.findUnique({
      where: { id }
    });

    if (!featuredEvent) {
      return NextResponse.json({ error: 'Featured event not found' }, { status: 404 });
    }

    return NextResponse.json(convertPrismaEventToResponse(featuredEvent));
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch featured event' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const validatedData = featuredEventPatchSchema.parse(body);

    // Convert date string to Date object if date is provided
    const updateData = {
      ...validatedData,
      date: validatedData.date ? new Date(validatedData.date) : undefined
    };

    const updated = await prisma.featuredEvent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(convertPrismaEventToResponse(updated));
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update featured event' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.featuredEvent.delete({
      where: { id }
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete featured event' }, { status: 500 });
  }
} 