import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const settings = await prisma.youTubeSettings.findUnique({
      where: { id },
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching YouTube settings:', error);
    return NextResponse.json({ error: 'Failed to fetch YouTube settings' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    const updatedSettings = await prisma.youTubeSettings.update({
      where: { id },
      data: {
        videoId: body.videoId,
        title: body.title,
        autoplay: body.autoplay,
        muted: body.muted,
        playlistId: body.playlistId || '',
      },
    });
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating YouTube settings:', error);
    return NextResponse.json({ error: 'Failed to update YouTube settings' }, { status: 500 });
  }
} 