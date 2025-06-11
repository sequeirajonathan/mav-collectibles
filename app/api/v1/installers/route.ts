import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@lib/prisma';
import { isAdminRole, UserRoleType } from '@interfaces/roles';

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const metadata = sessionClaims?.metadata as { role?: UserRoleType } | undefined;
    if (!metadata?.role || !isAdminRole(metadata.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const installers = await prisma.installer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    console.log('API Response - First installer date:', {
      createdAt: installers[0]?.createdAt
    });

    return NextResponse.json(installers);
  } catch (error) {
    console.error('Error fetching installers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const metadata = sessionClaims?.metadata as { role?: UserRoleType } | undefined;
    if (!metadata?.role || !isAdminRole(metadata.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { url, name, type } = body;

    if (!url || !name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type !== 'github_release') {
      return NextResponse.json(
        { error: 'Invalid installer type' },
        { status: 400 }
      );
    }

    // Validate GitHub release URL format
    if (!url.includes('github.com') || !url.includes('/releases/download/')) {
      return NextResponse.json(
        { error: 'Invalid GitHub release URL format' },
        { status: 400 }
      );
    }

    const installer = await prisma.installer.create({
      data: {
        name,
        url,
        type,
      },
    });

    return NextResponse.json(installer);
  } catch (error) {
    console.error('Error creating installer:', error);
    return NextResponse.json(
      { error: 'Failed to create installer' },
      { status: 500 }
    );
  }
} 