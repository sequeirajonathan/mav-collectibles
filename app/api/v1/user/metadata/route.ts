import { NextResponse } from 'next/server';
import { UserRole } from '@interfaces/roles';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const { userId, role } = await request.json();
    if (!userId || !role || !Object.values(UserRole).includes(role)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const client = await clerkClient();
    try {
      await client.users.getUser(userId);
    } catch {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role
      }
    });

    // Fetch updated user
    const updatedUser = await client.users.getUser(userId);
    const username = updatedUser.username || updatedUser.emailAddresses?.[0]?.emailAddress || updatedUser.id;
    const updatedRole = updatedUser.publicMetadata?.role || role;

    return NextResponse.json({ success: true, username, role: updatedRole });
  } catch (error) {
    console.error('Error updating user metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update user metadata' },
      { status: 500 }
    );
  }
} 