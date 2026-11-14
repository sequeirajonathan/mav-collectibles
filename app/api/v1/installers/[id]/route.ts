import { NextResponse } from 'next/server';
import { requireUser } from '@lib/auth/server';
import { prisma } from '@lib/prisma';
import { UserRole } from '@interfaces/roles';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { response: denied } = await requireUser([UserRole.ADMIN]);
    if (denied) return denied;

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