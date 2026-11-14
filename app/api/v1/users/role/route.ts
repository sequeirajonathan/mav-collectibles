import { NextResponse } from 'next/server';
import { z } from 'zod';
import { UserRole } from '@interfaces/roles';
import { requireUser } from '@lib/auth/server';
import { createAdminClient } from '@utils/supabase/admin';
import { prisma } from '@lib/prisma';

const bodySchema = z.object({
  /** Email address, username or user id. */
  user: z.string().trim().min(1),
  role: z.enum(UserRole),
});

async function resolveUserId(identifier: string): Promise<string | null> {
  if (/^[0-9a-f-]{36}$/i.test(identifier)) return identifier;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    select u.id
    from auth.users u
    left join public.profiles p on p.id = u.id
    where lower(u.email) = lower(${identifier}) or lower(p.username) = lower(${identifier})
    limit 1`;
  return rows[0]?.id ?? null;
}

/** ADMIN only: sets a user's role in app_metadata (users can't edit this themselves). */
export async function POST(request: Request) {
  const { user: admin, response } = await requireUser([UserRole.ADMIN]);
  if (response) return response;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const userId = await resolveUserId(parsed.data.user);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (userId === admin.id && parsed.data.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "You can't remove your own admin role" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { role: parsed.data.role },
  });
  if (error || !data.user) {
    const status = error?.status === 404 ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? 'User not found' : 'Failed to update role' }, { status });
  }

  const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { username: true } });
  return NextResponse.json({
    success: true,
    username: profile?.username ?? data.user.email ?? userId,
    role: parsed.data.role,
  });
}
