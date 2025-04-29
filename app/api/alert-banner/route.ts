import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { alertBannerSchema } from '@validations/alert-banner';
import { z } from 'zod';

export async function GET() {
  try {
    // Get the first alert banner (assuming there's only one active at a time)
    const alertBanner = await prisma.alertBanner.findFirst({
      where: { enabled: true },
    });
    
    return NextResponse.json(alertBanner);
  } catch (error) {
    console.error('Error fetching alert banner:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch alert banner' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = alertBannerSchema.parse(body);
    
    const newAlertBanner = await prisma.alertBanner.create({
      data: validatedData,
    });
    
    return NextResponse.json(newAlertBanner, { status: 201 });
  } catch (error) {
    console.error('Error creating alert banner:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create alert banner' },
      { status: 500 }
    );
  }
} 