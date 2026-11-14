"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { PhoneInput } from "@components/ui/PhoneInput";
import { FieldErrorText, GlobalErrors } from "@components/ui/AuthFormErrors";
import {
  completeProfileAction,
  requestPasswordResetAction,
  updatePasswordAction,
  type SignUpFieldErrors,
} from "@lib/auth/actions";
import { safeNext } from "@lib/auth/redirect";

const inputClassName =
  "border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]";
const titleClassName = "text-2xl font-bold mb-6 text-center text-[#E6B325]";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    const result = await requestPasswordResetAction(email);
    setIsBusy(false);
    if (!result.ok) setError(result.error);
    else setSent(true);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className={titleClassName}>Forgot your password?</h1>
      {sent ? (
        <p className="text-center text-gray-300">
          If an account exists for <span className="text-[#E6B325]">{email}</span>, we&apos;ve sent a link to reset
          your password.
        </p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <GlobalErrors errors={null} localError={error} />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClassName}
            />
          </div>
          <Button type="submit" variant="gold" className="w-full" disabled={isBusy}>
            Send reset link
          </Button>
        </form>
      )}
      <p className="text-center text-sm mt-6">
        <Link href="/sign-in" className="text-[#E6B325] hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    const result = await updatePasswordAction({ password, confirmPassword });
    setIsBusy(false);
    if (!result.ok) setError(result.error);
    else window.location.assign("/dashboard");
  };

  return (
    <form className="max-w-md mx-auto space-y-4" onSubmit={handleSubmit}>
      <h1 className={titleClassName}>Choose a new password</h1>
      <GlobalErrors errors={null} localError={error} />
      <div>
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClassName}
        />
      </div>
      <div>
        <Label htmlFor="confirm-new-password">Confirm password</Label>
        <Input
          id="confirm-new-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClassName}
        />
      </div>
      <Button type="submit" variant="gold" className="w-full" disabled={isBusy}>
        Update password
      </Button>
    </form>
  );
}

export function CompleteProfileForm() {
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setFieldErrors({});
    const result = await completeProfileAction({ username, phone });
    setIsBusy(false);
    if (!result.ok) {
      setError(result.error);
      if ("fieldErrors" in result) setFieldErrors(result.fieldErrors);
      return;
    }
    window.location.assign(next);
  };

  return (
    <form className="max-w-md mx-auto space-y-4" onSubmit={handleSubmit}>
      <h1 className={titleClassName}>Complete your profile</h1>
      <GlobalErrors errors={null} localError={error} />
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
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
      <Button type="submit" variant="gold" className="w-full" disabled={isBusy}>
        Continue
      </Button>
    </form>
  );
}
