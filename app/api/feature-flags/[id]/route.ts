import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const featureFlagPatchSchema = z.object({
  enabled: z.boolean(),
});

// GET handler
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    const featureFlag = await prisma.featureFlag.findUnique({ where: { id } });

    if (!featureFlag) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 });
    }

    return NextResponse.json(featureFlag);
  } catch (error) {
    console.error('Error fetching feature flag:', error);
    return NextResponse.json({ error: 'Failed to fetch feature flag' }, { status: 500 });
  }
}

// PATCH handler
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    const body = await request.json();
    const validatedData = featureFlagPatchSchema.parse(body);

    const updatedFeatureFlag = await prisma.featureFlag.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedFeatureFlag);
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
}

// DELETE handler
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = (await params).id;

  try {
    await prisma.featureFlag.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    return NextResponse.json({ error: 'Failed to delete feature flag' }, { status: 500 });
  }
}
