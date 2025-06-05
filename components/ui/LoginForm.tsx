"use client";

import * as Clerk from '@clerk/elements/common';
import * as SignIn from '@clerk/elements/sign-in';
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";

interface LoginFormProps {
  redirectTo?: string;
  hideSignupLink?: boolean;
}

export function LoginForm({
  hideSignupLink = false,
}: LoginFormProps) {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const error = searchParams.get("error");

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

      <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
        Login
      </h1>

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

      <SignIn.Root>
        <SignIn.Step name="start">
          <div className="space-y-4">
            <Clerk.Field name="identifier">
              <Clerk.Label asChild>
                <Label htmlFor="email">Email</Label>
              </Clerk.Label>
              <Clerk.Input
                asChild
                className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </Clerk.Input>
              <Clerk.FieldError />
            </Clerk.Field>

            <Clerk.Field name="password">
              <Clerk.Label asChild>
                <Label htmlFor="password">Password</Label>
              </Clerk.Label>
              <Clerk.Input
                asChild
                className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
              >
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </Clerk.Input>
              <Clerk.FieldError />
            </Clerk.Field>

            <div className="flex justify-end">
              <SignIn.Action navigate="forgot-password" asChild>
                <Button
                  variant="link"
                  className="text-[#E6B325] hover:text-[#FFD966] p-0 h-auto"
                >
                  Forgot password?
                </Button>
              </SignIn.Action>
            </div>

            <SignIn.Action submit asChild>
              <Button
                type="submit"
                className="w-full"
                variant="gold"
              >
                Sign in
              </Button>
            </SignIn.Action>

            {!hideSignupLink && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Don't have an account?{" "}
                <Link href="/sign-up" className="text-[#E6B325] hover:underline">
                  Sign up
                </Link>
              </p>
            )}
          </div>

          <div className="my-6 flex items-center gap-4">
            <hr className="flex-1 border-[#E6B325] opacity-40" />
            <span className="text-[#E6B325] text-sm font-semibold">
              Or continue with
            </span>
            <hr className="flex-1 border-[#E6B325] opacity-40" />
          </div>
          
          <Clerk.Connection name="google" asChild>
            <Button
              variant="outline"
              className="w-full border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-white"
            >
              Google
            </Button>
          </Clerk.Connection>

          <Clerk.Connection name="facebook" asChild>
            <Button
              variant="outline"
              className="w-full border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-white mt-2"
            >
              Facebook
            </Button>
          </Clerk.Connection>

          <div id="clerk-captcha" className="mt-4" />
        </SignIn.Step>

        <SignIn.Step name="verifications">
          <SignIn.Strategy name="email_code">
            <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
              Check your email
            </h1>
            <p className="text-center mb-4">
              We sent a code to <SignIn.SafeIdentifier />.
            </p>

            <Clerk.Field name="code">
              <Clerk.Label asChild>
                <Label>Email code</Label>
              </Clerk.Label>
              <Clerk.Input
                asChild
                className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
              >
                <Input />
              </Clerk.Input>
              <Clerk.FieldError />
            </Clerk.Field>

            <SignIn.Action submit asChild>
              <Button
                type="submit"
                className="w-full mt-4"
                variant="gold"
              >
                Continue
              </Button>
            </SignIn.Action>

            <SignIn.Action
              resend
              fallback={({ resendableAfter }) => (
                <p className="text-center text-sm text-gray-400 mt-2">
                  Resend code in {resendableAfter} second(s)
                </p>
              )}
              asChild
            >
              <Button
                variant="link"
                className="w-full mt-2 text-[#E6B325]"
              >
                Resend code
              </Button>
            </SignIn.Action>
          </SignIn.Strategy>

          <SignIn.Strategy name="password">
            <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
              Enter your password
            </h1>

            <Clerk.Field name="password">
              <Clerk.Label asChild>
                <Label>Password</Label>
              </Clerk.Label>
              <Clerk.Input
                asChild
                className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
              >
                <Input type="password" />
              </Clerk.Input>
              <Clerk.FieldError />
            </Clerk.Field>

            <SignIn.Action submit asChild>
              <Button
                type="submit"
                className="w-full mt-4"
                variant="gold"
              >
                Continue
              </Button>
            </SignIn.Action>

            <SignIn.Action navigate="forgot-password" asChild>
              <Button
                variant="link"
                className="w-full mt-2 text-[#E6B325]"
              >
                Forgot password?
              </Button>
            </SignIn.Action>
          </SignIn.Strategy>
        </SignIn.Step>

        <SignIn.Step name="forgot-password">
          <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
            Forgot your password?
          </h1>

          <div className="space-y-4">
            <SignIn.SupportedStrategy name="reset_password_email_code" asChild>
              <Button
                variant="gold"
                className="w-full"
              >
                Reset your password via Email
              </Button>
            </SignIn.SupportedStrategy>

            <div className="flex items-center gap-4">
              <hr className="flex-1 border-[#E6B325] opacity-40" />
              <span className="text-[#E6B325] text-sm font-semibold">or</span>
              <hr className="flex-1 border-[#E6B325] opacity-40" />
            </div>

            <Clerk.Connection name="google" asChild>
              <Button
                variant="outline"
                className="w-full border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-white"
              >
                Sign in with Google
              </Button>
            </Clerk.Connection>

            <SignIn.Action navigate="previous" asChild>
              <Button
                variant="link"
                className="w-full mt-4 text-[#E6B325]"
              >
                Back to sign in
              </Button>
            </SignIn.Action>
          </div>
        </SignIn.Step>

        <SignIn.Step name="reset-password">
          <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
            Reset your password
          </h1>

          <Clerk.Field name="password">
            <Clerk.Label asChild>
              <Label>New password</Label>
            </Clerk.Label>
            <Clerk.Input
              asChild
              className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
            >
              <Input type="password" />
            </Clerk.Input>
            <Clerk.FieldError />
          </Clerk.Field>

          <Clerk.Field name="confirmPassword">
            <Clerk.Label asChild>
              <Label>Confirm password</Label>
            </Clerk.Label>
            <Clerk.Input
              asChild
              className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
            >
              <Input type="password" />
            </Clerk.Input>
            <Clerk.FieldError />
          </Clerk.Field>

          <SignIn.Action submit asChild>
            <Button
              type="submit"
              className="w-full mt-4"
              variant="gold"
            >
              Update password
            </Button>
          </SignIn.Action>
        </SignIn.Step>
      </SignIn.Root>
    </div>
  );
}
