"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Provider } from "@supabase/supabase-js";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { PhoneInput } from "@components/ui/PhoneInput";
import { FieldErrorText, GlobalErrors } from "@components/ui/AuthFormErrors";
import { createClient } from "@utils/supabase/client";
import { signUpAction, type SignUpFieldErrors } from "@lib/auth/actions";

interface SignupFormProps {
  hideLoginLink?: boolean;
}

const inputClassName =
  "border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]";

export function SignupForm({ hideLoginLink = false }: SignupFormProps) {
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
      window.location.assign("/dashboard");
    }
  };

  const handleSocial = async (provider: Provider) => {
    setFormError(null);
    const { error } = await createClient().auth.signInWithOAuth({
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
        <h1 className="text-2xl font-bold mb-6 text-[#E6B325]">Confirm your email</h1>
        <p className="text-gray-300">
          We&apos;ve sent a confirmation link to{" "}
          <span className="text-[#E6B325] font-medium">{sentTo}</span>. Open it to finish creating your account.
        </p>
        <Button type="button" variant="link" className="mt-4 text-[#E6B325]" onClick={() => setSentTo(null)}>
          Used the wrong email? Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {logo}
      <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">Sign Up</h1>

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
            className={inputClassName}
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
            className={inputClassName}
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
            className={inputClassName}
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
            className={inputClassName}
          />
          <FieldErrorText error={fieldErrors.confirmPassword} />
        </div>

        <Button type="submit" className="w-full" variant="gold" disabled={isBusy}>
          {isBusy ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <hr className="flex-1 border-[#E6B325] opacity-40" />
        <span className="text-[#E6B325] text-sm font-semibold">Or continue with</span>
        <hr className="flex-1 border-[#E6B325] opacity-40" />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-white"
          onClick={() => handleSocial("google")}
        >
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-white"
          onClick={() => handleSocial("facebook")}
        >
          Facebook
        </Button>
      </div>

      {!hideLoginLink && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-[#E6B325] hover:underline">
            Log in
          </Link>
        </p>
      )}
    </div>
  );
}
