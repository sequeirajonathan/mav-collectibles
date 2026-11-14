"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@contexts/AuthContext";
import Image from "next/image";
import type { Provider } from "@supabase/supabase-js";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { PhoneInput } from "@components/ui/phone-input";
import { FieldErrorText, GlobalErrors } from "@components/auth/form-errors";
import { getBrowserClient } from "@utils/supabase/client";
import { signUpAction, type SignUpFieldErrors } from "@lib/auth/actions";

interface SignupFormProps {
  hideLoginLink?: boolean;
}


export function SignupForm({ hideLoginLink = false }: SignupFormProps) {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});
  const [isBusy, setIsBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsBusy(true);
    const result = await signUpAction({ username, email, phone, password, confirmPassword });
    setIsBusy(false);
    if (!result.ok) {
      setFormError(result.error);
      if ("fieldErrors" in result) setFieldErrors(result.fieldErrors);
      return;
    }
    if (result.needsEmailConfirmation) {
      setSentTo(email);
    } else {
      await refreshSession();
      router.replace("/dashboard");
    }
  };

  const handleSocial = async (provider: Provider) => {
    setFormError(null);
    const { error } = await (await getBrowserClient()).auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) setFormError(error.message);
  };

  const logo = (
    <div className="flex justify-center mb-6">
      <Image
        src="/mav_collectibles.png"
        alt="MAV Collectibles Logo"
        width={200}
        height={80}
        className="w-auto h-auto"
      />
    </div>
  );

  if (sentTo) {
    return (
      <div className="max-w-md mx-auto text-center">
        {logo}
        <h1 className="text-2xl font-bold mb-6 text-gold">Confirm your email</h1>
        <p className="text-foreground/80">
          We&apos;ve sent a confirmation link to{" "}
          <span className="text-gold font-medium">{sentTo}</span>. Open it to finish creating your account.
        </p>
        <Button type="button" variant="link" className="mt-4" onClick={() => setSentTo(null)}>
          Used the wrong email? Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {logo}
      <h1 className="text-2xl font-bold mb-6 text-center text-gold">Sign Up</h1>

      <GlobalErrors errors={null} localError={formError} />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            placeholder="Choose a username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <FieldErrorText error={fieldErrors.username} />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldErrorText error={fieldErrors.email} />
        </div>

        <div>
          <Label htmlFor="phoneNumber">Phone Number (US Only)</Label>
          <PhoneInput
            id="phoneNumber"
            placeholder="(555) 123-4567"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <FieldErrorText error={fieldErrors.phone} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password (8+ characters)"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FieldErrorText error={fieldErrors.password} />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <FieldErrorText error={fieldErrors.confirmPassword} />
        </div>

        <Button type="submit" className="w-full" variant="gold" disabled={isBusy}>
          {isBusy ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <hr className="flex-1 border-gold/30" />
        <span className="text-gold text-sm font-semibold">Or continue with</span>
        <hr className="flex-1 border-gold/30" />
      </div>

      <div className="flex flex-col gap-2">
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
          className="w-full"
          onClick={() => handleSocial("facebook")}
        >
          Facebook
        </Button>
      </div>

      {!hideLoginLink && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-gold hover:underline">
            Log in
          </Link>
        </p>
      )}
    </div>
  );
}
