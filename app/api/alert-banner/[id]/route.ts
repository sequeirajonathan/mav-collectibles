import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { alertBannerSchema } from '@/lib/validations/feature-flags';

const prisma = new PrismaClient();

// GET a specific alert banner
export async function GET(request: Request) {
  // Extract the ID from the URL instead of using params directly
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  try {
    const alertBanner = await prisma.alertBanner.findUnique({
      where: { id },
    });
    
    if (!alertBanner) {
      return NextResponse.json(
        { error: 'Alert banner not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(alertBanner);
  } catch (error: unknown) {
    console.error('Error fetching alert banner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert banner' },
      { status: 500 }
    );
  }
}

// PATCH to update an alert banner
export async function PATCH(request: Request) {
  // Extract the ID from the URL instead of using params directly
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  try {
    const body = await request.json();
    const validationResult = alertBannerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid alert banner data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const alertBanner = await prisma.alertBanner.update({
      where: { id },
      data: validationResult.data
    });
    
    return NextResponse.json(alertBanner);
  } catch (error: unknown) {
    console.error('Error updating alert banner:', error);
    return NextResponse.json(
      { error: 'Failed to update alert banner' },
      { status: 500 }
    );
  }
}

// DELETE an alert banner
export async function DELETE(request: Request) {
  // Extract the ID from the URL instead of using params directly
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  try {
    await prisma.alertBanner.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting alert banner:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert banner' },
      { status: 500 }
    );
  }
} 