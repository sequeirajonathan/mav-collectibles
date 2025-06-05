import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';

export async function GET() {
  try {
    const videoSettings = await prisma.videoSettings.findFirst({
      where: { id: 1 }, // Assuming we're using the first record
    });
    
    if (!videoSettings) {
      return NextResponse.json(
        { error: 'Video settings not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(videoSettings);
  } catch (error) {
    console.error('Error fetching video settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video settings' },
      { status: 500 }
    );
  }
} 