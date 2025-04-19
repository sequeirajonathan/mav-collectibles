import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { alertBannerSchema } from '@/lib/validations/feature-flags';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const alertBanner = await prisma.alertBanner.findFirst({
      where: { enabled: true }
    });
    return NextResponse.json(alertBanner);
  } catch (error) {
    console.error('Error fetching alert banner:', error);
    return NextResponse.json({ error: 'Failed to fetch alert banner' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validationResult = alertBannerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const alertBanner = await prisma.alertBanner.create({
      data: validationResult.data
    });
    
    return NextResponse.json(alertBanner);
  } catch (error) {
    console.error('Error creating alert banner:', error);
    return NextResponse.json({ error: 'Failed to create alert banner' }, { status: 500 });
  }
} 