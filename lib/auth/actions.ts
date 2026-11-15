"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@lib/prisma";
import { publicEnv } from "@lib/env";
import { createClient } from "@utils/supabase/server";
import { getCurrentUser } from "@lib/auth/server";
import { ensureSquareCustomer, toE164 } from "@lib/square-customer";
import { bootstrapFirstAdmin } from "@lib/auth/bootstrap";

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const GENERIC_SIGN_IN_ERROR = "Invalid email/username or password.";

async function siteOrigin(): Promise<string> {
  const configured = publicEnv().NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  // Email links must never be built from request headers in production
  // (a forged Host header would point reset links at another site).
  if (process.env.VERCEL_ENV === "production") throw new Error("NEXT_PUBLIC_SITE_URL must be set in production.");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

async function emailForUsername(username: string): Promise<string | null> {
  const rows = await prisma.$queryRaw<{ email: string }[]>`
    select u.email
    from auth.users u
    join public.profiles p on p.id = u.id
    where lower(p.username) = lower(${username})
    limit 1`;
  return rows[0]?.email ?? null;
}

// ---------------------------------------------------------------------------

export async function signInAction(input: {
  identifier: string;
  password: string;
}): Promise<ActionResult> {
  const identifier = input.identifier.trim();
  if (!identifier || !input.password) return { ok: false, error: GENERIC_SIGN_IN_ERROR };

  const email = identifier.includes("@") ? identifier : await emailForUsername(identifier);
  if (!email) return { ok: false, error: GENERIC_SIGN_IN_ERROR };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: input.password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, error: "Please confirm your email address first. Check your inbox for the link." };
    }
    return { ok: false, error: GENERIC_SIGN_IN_ERROR };
  }
  // First admin (BOOTSTRAP_ADMIN_EMAIL): promote, then reissue the session so it carries the role.
  if (data.user && (await bootstrapFirstAdmin(data.user.id).catch(() => false))) await supabase.auth.refreshSession();
  return { ok: true };
}

// ---------------------------------------------------------------------------

const usernameSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_.-]{3,30}$/, "Username must be 3-30 letters, numbers, dots, dashes or underscores.");

const phoneSchema = z
  .string()
  .transform((v) => toE164(v))
  .refine((v): v is string => v !== null, "Enter a 10-digit US phone number.");

const signUpSchema = z
  .object({
    username: usernameSchema,
    email: z.email("Enter a valid email address."),
    phone: phoneSchema,
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type SignUpFieldErrors = Partial<Record<"username" | "email" | "phone" | "password" | "confirmPassword", string>>;

async function usernameTaken(username: string, exceptUserId?: string): Promise<boolean> {
  const existing = await prisma.profile.findFirst({
    where: { username: { equals: username, mode: "insensitive" }, ...(exceptUserId ? { NOT: { id: exceptUserId } } : {}) },
    select: { id: true },
  });
  return existing !== null;
}

export async function signUpAction(
  input: z.input<typeof signUpSchema>
): Promise<ActionResult<{ needsEmailConfirmation: boolean }> | { ok: false; error: string; fieldErrors: SignUpFieldErrors }> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: SignUpFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof SignUpFieldErrors;
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  const { username, email, phone, password } = parsed.data;

  if (await usernameTaken(username)) {
    return { ok: false, error: "That username is taken.", fieldErrors: { username: "That username is taken." } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, phone },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    return { ok: false, error: error.message, fieldErrors: {} };
  }

  // With email confirmation on (the default), no session exists yet; the
  // Square customer is linked when the confirmation link is opened.
  if (data.session && data.user) {
    await ensureSquareCustomer({ id: data.user.id }).catch((e) =>
      console.error("Square customer link failed:", e)
    );
  }
  return { ok: true, needsEmailConfirmation: !data.session };
}

// ---------------------------------------------------------------------------

const completeProfileSchema = z.object({ username: usernameSchema, phone: phoneSchema });

/** Collects the username/phone that OAuth sign-ups don't provide. */
export async function completeProfileAction(input: {
  username: string;
  phone: string;
}): Promise<ActionResult | { ok: false; error: string; fieldErrors: SignUpFieldErrors }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const parsed = completeProfileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: SignUpFieldErrors = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as keyof SignUpFieldErrors] ??= issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }
  if (await usernameTaken(parsed.data.username, user.id)) {
    return { ok: false, error: "That username is taken.", fieldErrors: { username: "That username is taken." } };
  }

  await prisma.profile.update({
    where: { id: user.id },
    data: { username: parsed.data.username, phone: parsed.data.phone },
  });
  await ensureSquareCustomer({ id: user.id }).catch((e) =>
    console.error("Square customer link failed:", e)
  );
  return { ok: true };
}

// ---------------------------------------------------------------------------

export async function requestPasswordResetAction(email: string): Promise<ActionResult> {
  const parsed = z.email().safeParse(email.trim());
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  // Same response whether or not the account exists.
  return { ok: true };
}

export async function updatePasswordAction(input: {
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  if (input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (input.password !== input.confirmPassword) return { ok: false, error: "Passwords do not match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
