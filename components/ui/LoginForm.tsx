"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useSignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { FieldErrorText, GlobalErrors } from "@components/ui/AuthFormErrors";

interface LoginFormProps {
  redirectTo?: string;
  hideSignupLink?: boolean;
  hideTitle?: boolean;
  hideForgotPassword?: boolean;
  hideSocialLogins?: boolean;
}

type Step =
  | "start"
  | "first-factor-code"
  | "second-factor-code"
  | "forgot-password"
  | "reset-password";

const inputClassName =
  "border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]";
const RESEND_COOLDOWN_SECONDS = 30;
const SSO_CALLBACK_URL = "/sign-in/sso-callback";
const AFTER_SIGN_IN_URL = "/dashboard";

export function LoginForm({
  hideSignupLink = false,
  hideTitle = false,
  hideForgotPassword = false,
  hideSocialLogins = false,
}: LoginFormProps) {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const error = searchParams.get("error");

  const { signIn, errors, fetchStatus } = useSignIn();
  const isBusy = fetchStatus === "fetching";

  const [step, setStep] = useState<Step>("start");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const goTo = (next: Step) => {
    setLocalError(null);
    setCode("");
    setStep(next);
  };

  // Moves the flow forward based on the sign-in status Clerk reports.
  // Session activation is enough here: the sign-in page and login modal
  // react to the new session themselves.
  const advance = async () => {
    switch (signIn.status) {
      case "complete":
        await signIn.finalize();
        return;
      case "needs_first_factor": {
        const { error: sendError } = await signIn.emailCode.sendCode();
        if (!sendError) {
          setCooldown(RESEND_COOLDOWN_SECONDS);
          goTo("first-factor-code");
        }
        return;
      }
      case "needs_second_factor":
      case "needs_client_trust": {
        const { error: sendError } = await signIn.mfa.sendEmailCode();
        if (!sendError) {
          setCooldown(RESEND_COOLDOWN_SECONDS);
          goTo("second-factor-code");
        }
        return;
      }
      default:
        setLocalError("Unable to complete sign in. Please try again.");
    }
  };

  const handleStart = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const { error: signInError } = await signIn.password({ identifier, password });
    if (signInError) return;
    await advance();
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const { error: verifyError } =
      step === "first-factor-code"
        ? await signIn.emailCode.verifyCode({ code })
        : await signIn.mfa.verifyEmailCode({ code });
    if (verifyError) return;
    await advance();
  };

  const handleResend = async () => {
    const { error: resendError } =
      step === "first-factor-code"
        ? await signIn.emailCode.sendCode()
        : step === "reset-password"
          ? await signIn.resetPasswordEmailCode.sendCode()
          : await signIn.mfa.sendEmailCode();
    if (!resendError) setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const handleSendResetCode = async () => {
    setLocalError(null);
    if (!identifier) {
      setLocalError("Enter your email or username first.");
      goTo("start");
      return;
    }
    const { error: createError } = await signIn.create({ identifier });
    if (createError) return;
    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (sendError) return;
    setCooldown(RESEND_COOLDOWN_SECONDS);
    goTo("reset-password");
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (newPassword !== confirmNewPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({ code });
    if (verifyError) return;
    const { error: submitError } = await signIn.resetPasswordEmailCode.submitPassword({
      password: newPassword,
    });
    if (submitError) return;
    await advance();
  };

  const handleSocial = async (strategy: "oauth_google" | "oauth_facebook") => {
    setLocalError(null);
    await signIn.sso({
      strategy,
      redirectUrl: AFTER_SIGN_IN_URL,
      redirectCallbackUrl: SSO_CALLBACK_URL,
    });
  };

  const resendButton = (
    <Button
      type="button"
      variant="link"
      className="w-full mt-2 text-[#E6B325]"
      disabled={cooldown > 0 || isBusy}
      onClick={handleResend}
    >
      {cooldown > 0 ? `Resend code in ${cooldown} second(s)` : "Resend code"}
    </Button>
  );

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

      {!hideTitle && step === "start" && (
        <h1 className="text-2xl font-bold mb-4 md:mb-6 text-center text-[#E6B325]">
          Login
        </h1>
      )}

      {message && (
        <div className="bg-[#181d29] border-2 border-[#E6B325] text-[#E6B325] px-4 py-3 rounded mb-4 text-center">
          <p className="font-medium">{decodeURIComponent(message)}</p>
          {error === "token_expired" && (
            <p className="text-sm mt-2 text-gray-400">
              Please check your email for a new verification link or contact
              support if you need assistance.
            </p>
          )}
        </div>
      )}

      <GlobalErrors errors={errors.global} localError={localError} />

      {step === "start" && (
        <>
          <form className="space-y-4" onSubmit={handleStart}>
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
                className={inputClassName}
              />
              <FieldErrorText error={errors.fields.identifier} />
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
                className={inputClassName}
              />
              <FieldErrorText error={errors.fields.password} />
            </div>

            {!hideForgotPassword && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  className="text-[#E6B325] hover:text-[#FFD966] p-0 h-auto"
                  onClick={() => goTo("forgot-password")}
                >
                  Forgot password?
                </Button>
              </div>
            )}

            <Button type="submit" className="w-full" variant="gold" disabled={isBusy}>
              Sign in
            </Button>

            {!hideSignupLink && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="text-[#E6B325] hover:underline">
                  Sign up
                </Link>
              </p>
            )}
          </form>

          {!hideSocialLogins && (
            <>
              <div className="my-6 flex items-center gap-4">
                <hr className="flex-1 border-[#E6B325] opacity-40" />
                <span className="text-[#E6B325] text-sm font-semibold">
                  Or continue with
                </span>
                <hr className="flex-1 border-[#E6B325] opacity-40" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-white"
                disabled={isBusy}
                onClick={() => handleSocial("oauth_google")}
              >
                Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-white mt-2"
                disabled={isBusy}
                onClick={() => handleSocial("oauth_facebook")}
              >
                Facebook
              </Button>
            </>
          )}

          <div id="clerk-captcha" className="mt-4" />
        </>
      )}

      {(step === "first-factor-code" || step === "second-factor-code") && (
        <form onSubmit={handleVerifyCode}>
          <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
            Check your email
          </h1>
          <p className="text-center mb-4">
            We sent a code to {signIn.identifier ?? "your email"}.
          </p>

          <Label htmlFor="code">Email code</Label>
          <Input
            id="code"
            autoComplete="one-time-code"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={inputClassName}
          />
          <FieldErrorText error={errors.fields.code} />

          <Button type="submit" className="w-full mt-4" variant="gold" disabled={isBusy}>
            Continue
          </Button>
          {resendButton}
        </form>
      )}

      {step === "forgot-password" && (
        <div>
          <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
            Forgot your password?
          </h1>

          <div className="space-y-4">
            <Button
              type="button"
              variant="gold"
              className="w-full"
              disabled={isBusy}
              onClick={handleSendResetCode}
            >
              Reset your password via Email
            </Button>

            <div className="flex items-center gap-4">
              <hr className="flex-1 border-[#E6B325] opacity-40" />
              <span className="text-[#E6B325] text-sm font-semibold">or</span>
              <hr className="flex-1 border-[#E6B325] opacity-40" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-white"
              disabled={isBusy}
              onClick={() => handleSocial("oauth_google")}
            >
              Sign in with Google
            </Button>

            <Button
              type="button"
              variant="link"
              className="w-full mt-4 text-[#E6B325]"
              onClick={() => goTo("start")}
            >
              Back to sign in
            </Button>
          </div>
        </div>
      )}

      {step === "reset-password" && (
        <form className="space-y-4" onSubmit={handleResetPassword}>
          <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
            Reset your password
          </h1>
          <p className="text-center text-gray-400">
            We sent a reset code to {signIn.identifier ?? "your email"}.
          </p>

          <div>
            <Label htmlFor="reset-code">Reset code</Label>
            <Input
              id="reset-code"
              autoComplete="one-time-code"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={inputClassName}
            />
            <FieldErrorText error={errors.fields.code} />
          </div>

          <div>
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClassName}
            />
            <FieldErrorText error={errors.fields.password} />
          </div>

          <div>
            <Label htmlFor="confirm-new-password">Confirm password</Label>
            <Input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className={inputClassName}
            />
          </div>

          <Button type="submit" className="w-full mt-4" variant="gold" disabled={isBusy}>
            Update password
          </Button>
          {resendButton}
        </form>
      )}
    </div>
  );
}
