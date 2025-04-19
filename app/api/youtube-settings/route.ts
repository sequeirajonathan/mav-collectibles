import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for validation
const youtubeSettingsSchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
  title: z.string().min(1, "Title is required"),
  autoplay: z.boolean().default(true),
  muted: z.boolean().default(true),
  playlistId: z.string().optional(),
});

export async function GET() {
  try {
    const settings = await prisma.youTubeSettings.findUnique({
      where: { id: '1' },
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching YouTube settings:', error);
    return NextResponse.json({ error: 'Failed to fetch YouTube settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validationResult = youtubeSettingsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    // Check if settings already exist
    const existingSettings = await prisma.youTubeSettings.findFirst();
    
    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.youTubeSettings.update({
        where: { id: existingSettings.id },
        data: validationResult.data
      });
    } else {
      // Create new settings
      settings = await prisma.youTubeSettings.create({
        data: validationResult.data
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating YouTube settings:', error);
    return NextResponse.json({ error: 'Failed to update YouTube settings' }, { status: 500 });
  }
} 