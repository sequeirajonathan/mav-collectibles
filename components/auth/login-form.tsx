"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@contexts/AuthContext";
import type { Provider } from "@supabase/supabase-js";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { GlobalErrors } from "@components/auth/form-errors";
import { getBrowserClient } from "@utils/supabase/client";
import { signInAction } from "@lib/auth/actions";
import { safeNext } from "@lib/auth/redirect";

interface LoginFormProps {
  /** Where to go after signing in. Defaults to ?next= or /dashboard. Pass "" to stay on the current page. */
  redirectTo?: string;
  hideSignupLink?: boolean;
  hideTitle?: boolean;
  hideForgotPassword?: boolean;
  hideSocialLogins?: boolean;
}


export function LoginForm({
  redirectTo,
  hideSignupLink = false,
  hideTitle = false,
  hideForgotPassword = false,
  hideSocialLogins = false,
}: LoginFormProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const error = searchParams.get("error");
  const destination = redirectTo ?? safeNext(searchParams.get("next"));

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsBusy(true);
    const result = await signInAction({ identifier, password });
    if (!result.ok) {
      setFormError(result.error);
      setIsBusy(false);
      return;
    }
    await refreshSession();
    if (destination) router.replace(safeNext(destination));
    router.refresh();
  };

  const handleSocial = async (provider: Provider) => {
    setFormError(null);
    const next = destination || window.location.pathname;
    const { error: oauthError } = await (await getBrowserClient()).auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (oauthError) setFormError(oauthError.message);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-center mb-4 md:mb-6">
        <Image
          src="/mav_collectibles.png"
          alt="MAV Collectibles Logo"
          width={200}
          height={80}
          className="w-[150px] md:w-[200px] h-auto"
        />
      </div>

      {!hideTitle && (
        <h1 className="text-2xl font-bold mb-4 md:mb-6 text-center text-gold">
          Login
        </h1>
      )}

      {message && (
        <div className="mb-4 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-center text-gold">
          <p className="font-medium">{decodeURIComponent(message)}</p>
          {error === "token_expired" && (
            <p className="text-sm mt-2 text-muted-foreground">
              Please check your email for a new verification link or contact
              support if you need assistance.
            </p>
          )}
        </div>
      )}
      {error === "not_print_agent" && (
        <GlobalErrors errors={null} localError="This account is not a print agent account." />
      )}

      <GlobalErrors errors={null} localError={formError} />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email">Email or Username</Label>
          <Input
            id="email"
            type="text"
            autoComplete="username"
            placeholder="Enter your email or username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {!hideForgotPassword && (
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-gold hover:text-gold-light">
              Forgot password?
            </Link>
          </div>
        )}

        <Button type="submit" className="w-full" variant="gold" disabled={isBusy}>
          {isBusy ? "Signing in..." : "Sign in"}
        </Button>

        {!hideSignupLink && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-gold hover:underline">
              Sign up
            </Link>
          </p>
        )}
      </form>

      {!hideSocialLogins && (
        <>
          <div className="my-6 flex items-center gap-4">
            <hr className="flex-1 border-gold/30" />
            <span className="text-gold text-sm font-semibold">
              Or continue with
            </span>
            <hr className="flex-1 border-gold/30" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleSocial("google")}
          >
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-2"
            onClick={() => handleSocial("facebook")}
          >
            Facebook
          </Button>
        </>
      )}
    </div>
  );
}
