import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';

const DEFAULT_FLAGS = [
  {
    name: 'showAlertBanner',
    description: 'Controls visibility of the alert banner at the top of the site',
    enabled: true,
  },
  {
    name: 'showVideoPlayer',
    description: 'Controls visibility of the video player section',
    enabled: true,
  },
  {
    name: 'showYouTubeVideo',
    description: 'Controls visibility of YouTube video content',
    enabled: true,
  },
  {
    name: 'showDirectStreaming',
    description: 'Controls visibility of direct streaming content',
    enabled: false,
  },
  {
    name: 'showGoogleReviews',
    description: 'Controls visibility of Google Reviews section on the homepage',
    enabled: true,
  },
  {
    name: 'maintenanceMode',
    description: 'Enables maintenance mode, restricting access to admin users only',
    enabled: false,
  },
];

export async function POST() {
  try {
    // Create or update each feature flag
    const results = await Promise.all(
      DEFAULT_FLAGS.map(flag =>
        prisma.featureFlag.upsert({
          where: { name: flag.name },
          update: { enabled: flag.enabled },
          create: flag,
        })
      )
    );

    return NextResponse.json({ 
      message: 'Feature flags seeded successfully',
      flags: results 
    });
  } catch (error) {
    console.error('Error seeding feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to seed feature flags' },
      { status: 500 }
    );
  }
} 