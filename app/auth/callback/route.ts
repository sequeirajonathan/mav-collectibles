import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@utils/supabase/server";
import { prisma } from "@lib/prisma";
import { ensureSquareCustomer } from "@lib/square-customer";
import { bootstrapFirstAdmin } from "@lib/auth/bootstrap";
import { safeNext } from "@lib/auth/redirect";

/**
 * Landing point for every Supabase auth redirect: email confirmation,
 * password-reset links and OAuth (Google/Facebook).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  let error: unknown = null;
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  } else {
    error = new Error("Missing code");
  }

  if (error) {
    const message = encodeURIComponent("That link is invalid or has expired. Please try again.");
    return NextResponse.redirect(`${origin}/sign-in?message=${message}&error=token_expired`);
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  // First admin (BOOTSTRAP_ADMIN_EMAIL): promote on email confirmation, then reissue the session.
  if (user && (await bootstrapFirstAdmin(user.id).catch(() => false))) await supabase.auth.refreshSession();
  if (user && next !== "/reset-password") {
    // OAuth sign-ups have no username/phone yet: collect them first.
    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    if (!profile?.username || !profile.phone) {
      return NextResponse.redirect(`${origin}/sign-up/complete?next=${encodeURIComponent(next)}`);
    }
    await ensureSquareCustomer({ id: user.id }).catch((e) =>
      console.error("Square customer link failed:", e)
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
