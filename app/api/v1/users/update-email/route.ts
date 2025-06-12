import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailAddress } = await req.json();
    if (!emailAddress) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const client = await clerkClient();
    
    // Create new email address
    const emailAddressResource = await client.emailAddresses.createEmailAddress({
      userId: session.userId,
      emailAddress,
    });

    // Set as primary email
    await client.emailAddresses.setPrimaryEmailAddress({
      userId: session.userId,
      emailAddressId: emailAddressResource.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    );
  }
} 