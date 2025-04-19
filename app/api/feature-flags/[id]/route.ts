import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const featureFlagPatchSchema = z.object({
  enabled: z.boolean(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const featureFlag = await prisma.featureFlag.findUnique({
      where: { id }
    });

    if (!featureFlag) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 });
    }

    return NextResponse.json(featureFlag);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch feature flag' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const validatedData = featureFlagPatchSchema.parse(body);

    const updated = await prisma.featureFlag.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.featureFlag.delete({
      where: { id }
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete feature flag' }, { status: 500 });
  }
}
