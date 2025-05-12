import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { z } from 'zod';

const alertBannerPatchSchema = z.object({
  message: z.string().optional(),
  code: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  enabled: z.boolean().optional(),
});

// GET a specific alert banner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const alertBanner = await prisma.alertBanner.findUnique({
      where: { id }
    });
    
    if (!alertBanner) {
      return NextResponse.json(
        { error: 'Alert banner not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(alertBanner);
  } catch (error: unknown) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert banner' },
      { status: 500 }
    );
  }
}

// PATCH to update an alert banner
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const validatedData = alertBannerPatchSchema.parse(body);
    
    const updated = await prisma.alertBanner.update({
      where: { id },
      data: validatedData,
    });
    
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update alert banner' },
      { status: 500 }
    );
  }
}

// DELETE an alert banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await prisma.alertBanner.delete({
      where: { id }
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert banner' },
      { status: 500 }
    );
  }
} 