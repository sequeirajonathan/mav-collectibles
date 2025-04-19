import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const featuredEventPatchSchema = z.object({
  title: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  imageSrc: z.string().optional(),
  imageAlt: z.string().optional(),
  bulletPoints: z.array(z.string()).optional(),
  link: z.string().optional(),
  enabled: z.boolean().optional(),
  order: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

  try {
    const featuredEvent = await prisma.featuredEvent.findUnique({
      where: { id }
    });

    if (!featuredEvent) {
      return NextResponse.json({ error: 'Featured event not found' }, { status: 404 });
    }

    return NextResponse.json(featuredEvent);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch featured event' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const validatedData = featuredEventPatchSchema.parse(body);

    const updated = await prisma.featuredEvent.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update featured event' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

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