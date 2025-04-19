import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { featureFlagSchema } from '@/lib/validations/feature-flags';

const prisma = new PrismaClient();

// GET all feature flags
export async function GET() {
  try {
    const featureFlags = await prisma.featureFlag.findMany();
    
    return NextResponse.json(featureFlags);
  } catch (error: unknown) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

// POST to create a new feature flag
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = featureFlagSchema.parse(body);
    
    const featureFlag = await prisma.featureFlag.create({
      data: validatedData,
    });
    
    return NextResponse.json(featureFlag, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating feature flag:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create feature flag' },
      { status: 500 }
    );
  }
} 