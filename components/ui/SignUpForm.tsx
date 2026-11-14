"use client";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { PhoneInput } from "@components/ui/PhoneInput";
import { FieldErrorText, GlobalErrors } from "@components/ui/AuthFormErrors";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, type FormEvent } from "react";
import { useSignUp, useUser } from "@clerk/nextjs";
import { UserRole } from "@interfaces/roles";
import { useUserMetadata } from "@hooks/useUserMetadata";
import { toast } from "react-hot-toast";
import axios from "axios";

interface SignupFormProps {
  hideLoginLink?: boolean;
}

type Step = "start" | "verify-phone" | "verify-email" | "continue";

const inputClassName =
  "border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]";
const RESEND_COOLDOWN_SECONDS = 30;
const SSO_CALLBACK_URL = "/sign-in/sso-callback";
const AFTER_SIGN_UP_URL = "/dashboard";

/** Converts the masked "(555) 123-4567" value into E.164 for Clerk. */
const toE164 = (formatted: string) => `+1${formatted.replace(/\D/g, "")}`;

export function SignupForm({ hideLoginLink = false }: SignupFormProps) {
  const { signUp, errors, fetchStatus } = useSignUp();
  const isBusy = fetchStatus === "fetching";
  const { user } = useUser();
  const { setUserRole } = useUserMetadata();

  const [selectedStep, setStep] = useState<Step>("start");
  const [username, setUsername] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Returning from an OAuth sign-up that still needs a username/phone
  // (Clerk redirects to /sign-up/continue): resume at the "continue" step.
  const needsContinue =
    signUp.status === "missing_requirements" &&
    (signUp.missingFields.includes("username") ||
      signUp.missingFields.includes("phone_number"));
  const step: Step =
    selectedStep === "start" && needsContinue && !signUp.hasPassword
      ? "continue"
      : selectedStep;

  // Check for existing Square customer and handle role setting
  useEffect(() => {
    const handleSquareCustomer = async () => {
      if (
        signUp.status === "complete" &&
        !(user?.unsafeMetadata as Record<string, unknown>)?.role
      ) {
        try {
          const phoneNumber = signUp.phoneNumber;
          if (!phoneNumber) {
            toast.error("Phone number is required");
            return;
          }

          // Search for existing Square customer
          const searchResponse = await axios.post(
            "/api/v1/search-square-customer",
            {
              phoneNumber: phoneNumber.replace(/\D/g, "").slice(-10), // Remove non-digits and get last 10 digits
            }
          );

          if (searchResponse.data.customers?.length > 0) {
            // Customer exists, update their information
            const customer = searchResponse.data.customers[0];
            await axios.put(`/api/v1/update-square-customer/${customer.id}`, {
              emailAddress: signUp.emailAddress,
              givenName: signUp.firstName || "",
              familyName: signUp.lastName || "",
            });
          } else {
            // Create new Square customer
            await axios.post("/api/v1/create-square-customer", {
              emailAddress: signUp.emailAddress,
              givenName: signUp.firstName || "",
              familyName: signUp.lastName || "",
              phoneNumber: phoneNumber.replace(/\D/g, "").slice(-10),
              address: {
                country: "US",
                firstName: signUp.firstName || "",
                lastName: signUp.lastName || "",
                addressLine1: "Pending",
                locality: "Pending",
                postalCode: "00000",
              },
              referenceId: user?.id,
            });
          }

          // Set user role
          const result = await setUserRole(UserRole.USER);
          if (!result.success) {
            toast.error(result.error || "Failed to set user role");
          }
        } catch (error) {
          console.error("Error handling Square customer:", error);
          toast.error("Failed to process customer information");
        }
      }
    };

    handleSquareCustomer();
  }, [signUp, user, setUserRole]);

  const goTo = (next: Step) => {
    setLocalError(null);
    setCode("");
    setStep(next);
  };

  // Moves the flow forward based on what Clerk still needs.
  const advance = async () => {
    if (signUp.status === "complete") {
      await signUp.finalize();
      return;
    }
    if (signUp.status !== "missing_requirements") {
      setLocalError("Unable to complete sign up. Please try again.");
      return;
    }
    if (
      signUp.missingFields.includes("username") ||
      signUp.missingFields.includes("phone_number")
    ) {
      goTo("continue");
      return;
    }
    if (signUp.unverifiedFields.includes("phone_number")) {
      const { error } = await signUp.verifications.sendPhoneCode();
      if (!error) {
        setCooldown(RESEND_COOLDOWN_SECONDS);
        goTo("verify-phone");
      }
      return;
    }
    if (signUp.unverifiedFields.includes("email_address")) {
      const { error } = await signUp.verifications.sendEmailCode();
      if (!error) {
        setCooldown(RESEND_COOLDOWN_SECONDS);
        goTo("verify-email");
      }
      return;
    }
    setLocalError("Unable to complete sign up. Please try again.");
  };

  const handleStart = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    const { error } = await signUp.password({
      username,
      emailAddress,
      phoneNumber: toE164(phoneValue),
      password,
    });
    if (error) return;
    await advance();
  };

  const handleContinue = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const { error } = await signUp.update({
      ...(username ? { username } : {}),
      ...(phoneValue ? { phoneNumber: toE164(phoneValue) } : {}),
    });
    if (error) return;
    await advance();
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const { error } =
      step === "verify-phone"
        ? await signUp.verifications.verifyPhoneCode({ code })
        : await signUp.verifications.verifyEmailCode({ code });
    if (error) return;
    await advance();
  };

  const handleResend = async () => {
    const { error } =
      step === "verify-phone"
        ? await signUp.verifications.sendPhoneCode()
        : await signUp.verifications.sendEmailCode();
    if (!error) setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const handleSocial = async (strategy: "oauth_google" | "oauth_facebook") => {
    setLocalError(null);
    await signUp.sso({
      strategy,
      redirectUrl: AFTER_SIGN_UP_URL,
      redirectCallbackUrl: SSO_CALLBACK_URL,
    });
  };

  const usernameField = (
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
      <FieldErrorText error={errors.fields.username} />
    </div>
  );

  const phoneField = (
    <div>
      <Label htmlFor="phoneNumber">Phone Number (US Only)</Label>
      <PhoneInput
        id="phoneNumber"
        placeholder="(555) 123-4567"
        required
        value={phoneValue}
        onChange={(e) => setPhoneValue(e.target.value)}
        className={inputClassName}
      />
      <FieldErrorText error={errors.fields.phoneNumber} />
    </div>
  );

  const isPhone = step === "verify-phone";

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <Image
          src="/mav_collectibles.png"
          alt="MAV Collectibles Logo"
          width={200}
          height={80}
          className="w-auto h-auto"
        />
      </div>

      <GlobalErrors errors={errors.global} localError={localError} />

      {step === "start" && (
        <>
          <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
            Sign Up
          </h1>
          <form className="space-y-4" onSubmit={handleStart}>
            {usernameField}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                required
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className={inputClassName}
              />
              <FieldErrorText error={errors.fields.emailAddress} />
            </div>

            {phoneField}

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClassName}
              />
              <FieldErrorText error={errors.fields.password} />
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
            </div>

            <div
              id="clerk-captcha"
              data-cl-theme="dark"
              data-cl-size="normal"
              data-cl-language="en-US"
              className="mt-4"
            />
            <FieldErrorText error={errors.fields.captcha} />

            <Button type="submit" className="w-full" variant="gold" disabled={isBusy}>
              Sign Up
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <hr className="flex-1 border-[#E6B325] opacity-40" />
            <span className="text-[#E6B325] text-sm font-semibold">
              Or continue with
            </span>
            <hr className="flex-1 border-[#E6B325] opacity-40" />
          </div>

          <div className="flex flex-col gap-2">
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
              className="w-full border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-white"
              disabled={isBusy}
              onClick={() => handleSocial("oauth_facebook")}
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
        </>
      )}

      {(step === "verify-phone" || step === "verify-email") && (
        <form onSubmit={handleVerify}>
          <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
            {isPhone ? "Verify your phone" : "Confirm your email"}
          </h1>

          <p className="text-center mb-4 text-gray-400">
            We&apos;ve sent a verification code to{" "}
            <span className="text-[#E6B325] font-medium">
              {isPhone ? signUp.phoneNumber : signUp.emailAddress}
            </span>
          </p>

          <Label htmlFor="code">
            {isPhone ? "Phone verification code" : "Email verification code"}
          </Label>
          <Input
            id="code"
            placeholder="Enter code"
            autoComplete="one-time-code"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={inputClassName}
          />
          <FieldErrorText error={errors.fields.code} />

          <div className="mt-4 space-y-4">
            <button
              type="button"
              disabled={cooldown > 0 || isBusy}
              onClick={handleResend}
              className="w-full text-[#E6B325] hover:text-[#FFD966] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cooldown > 0
                ? `Resend code in ${cooldown} seconds`
                : "Didn't receive the code? Resend"}
            </button>

            <button
              type="button"
              onClick={() => goTo(isPhone && signUp.createdSessionId ? "continue" : "start")}
              className="w-full text-gray-400 hover:text-white text-sm"
            >
              {isPhone ? "Need to change your phone number?" : "Need to change your email?"}
            </button>
          </div>

          <Button type="submit" className="w-full mt-4" variant="gold" disabled={isBusy}>
            {isPhone ? "Verify Phone" : "Confirm Email"}
          </Button>
        </form>
      )}

      {step === "continue" && (
        <form className="space-y-4" onSubmit={handleContinue}>
          <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
            Complete your profile
          </h1>
          {usernameField}
          {phoneField}
          <Button type="submit" className="w-full mt-4" variant="gold" disabled={isBusy}>
            Continue
          </Button>
        </form>
      )}
    </div>
  );
}
