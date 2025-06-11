import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@lib/prisma';
import { isAdminRole, UserRoleType } from '@interfaces/roles';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { sessionClaims } = await auth();
    // Check if user is admin
    const metadata = sessionClaims?.metadata as { role?: UserRoleType } | undefined;
    if (!metadata?.role || !isAdminRole(metadata.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Installer ID is required' },
        { status: 400 }
      );
    }

    await prisma.installer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting installer:', error);
    return NextResponse.json(
      { error: 'Failed to delete installer' },
      { status: 500 }
    );
  }
} 