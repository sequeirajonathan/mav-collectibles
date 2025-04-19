import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const youtubeSettingsPatchSchema = z.object({
  videoId: z.string().optional(),
  title: z.string().optional(),
  autoplay: z.boolean().optional(),
  muted: z.boolean().optional(),
  playlistId: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const youtubeSettings = await prisma.youTubeSettings.findUnique({
      where: { id }
    });

    if (!youtubeSettings) {
      return NextResponse.json({ error: 'YouTube settings not found' }, { status: 404 });
    }

    return NextResponse.json(youtubeSettings);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch YouTube settings' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const validatedData = youtubeSettingsPatchSchema.parse(body);

    const updated = await prisma.youTubeSettings.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update YouTube settings' }, { status: 500 });
  }
}

// No DELETE handler for YouTube settings as it's a singleton resource 