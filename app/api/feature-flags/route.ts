import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { z } from 'zod';

const featureFlagSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean().default(false),
});

// GET all feature flags
export async function GET() {
  try {
    const flags = await prisma.featureFlag.findMany();
    return NextResponse.json(flags);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }
}

// POST to create a new feature flag
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = featureFlagSchema.parse(body);
    
    const newFeatureFlag = await prisma.featureFlag.create({
      data: validatedData,
    });
    
    return NextResponse.json(newFeatureFlag, { status: 201 });
  } catch (error) {
    console.error('Error creating feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to create feature flag' },
      { status: 500 }
    );
  }
} 