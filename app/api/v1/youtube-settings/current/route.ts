import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';

export async function GET() {
  try {
    // Get the YouTube settings (there should be only one record with id "1")
    const settings = await prisma.youTubeSettings.findUnique({
      where: { id: "1" },
    });
    
    if (!settings) {
      // If no settings exist, return default settings
      return NextResponse.json({
        videoId: "",
        title: "",
        autoplay: true,
        muted: true,
        playlistId: "",
        isLiveStream: false,
        liveStreamId: "",
        showLiveIndicator: true
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching YouTube settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch YouTube settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Upsert to create if not exists or update if exists
    const settings = await prisma.youTubeSettings.upsert({
      where: { id: "1" },
      update: body,
      create: {
        id: "1",
        ...body,
      },
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating YouTube settings:', error);
    return NextResponse.json(
      { error: 'Failed to update YouTube settings' },
      { status: 500 }
    );
  }
} 