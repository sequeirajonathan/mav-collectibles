import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { z } from 'zod';

const youtubeSettingsSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  autoplay: z.boolean().default(true),
  muted: z.boolean().default(true),
  playlistId: z.string().default(''),
});

export async function GET() {
  try {
    // Get the YouTube settings (there should be only one record with id "1")
    const settings = await prisma.youTubeSettings.findUnique({
      where: { id: "1" },
    });
    
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
    const validatedData = youtubeSettingsSchema.parse(body);
    
    // Upsert to create if not exists or update if exists
    const settings = await prisma.youTubeSettings.upsert({
      where: { id: "1" },
      update: validatedData,
      create: {
        id: "1",
        ...validatedData,
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