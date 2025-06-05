"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSignUp, useUser } from "@clerk/nextjs";
import { UserRole } from "@interfaces/roles";
import { useUserMetadata } from "@hooks/useUserMetadata";
import { toast } from "react-hot-toast";

interface SignupFormProps {
  hideLoginLink?: boolean;
}

export function SignupForm({ hideLoginLink = false }: SignupFormProps) {
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { user } = useUser();
  const { setUserRole } = useUserMetadata();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Set user role after successful verification
  useEffect(() => {
    const setRole = async () => {
      if (signUpLoaded && signUp?.status === 'complete' && !(user?.unsafeMetadata as any)?.role) {
        try {
          const result = await setUserRole(UserRole.USER);
          if (!result.success) {
            toast.error(result.error || 'Failed to set user role');
          }
        } catch (error) {
          console.error('Error setting user role:', error);
          toast.error('Failed to set user role');
        }
      }
    };

    setRole();
  }, [signUpLoaded, signUp?.status, user, setUserRole]);

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
      <SignUp.Root>
        <SignUp.Step name="start">
          <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
            Sign Up
          </h1>
          <div className="space-y-4">
            <Clerk.Field name="username">
              <Clerk.Label asChild>
                <Label htmlFor="username">Username</Label>
              </Clerk.Label>
              <Clerk.Input
                asChild
                className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
              >
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  required
                />
              </Clerk.Input>
              <Clerk.FieldError />
            </Clerk.Field>

            <Clerk.Field name="emailAddress">
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
                  placeholder="Create a password"
                  required
                />
              </Clerk.Input>
              <Clerk.FieldError />
            </Clerk.Field>

            <Clerk.Field name="confirmPassword">
              <Clerk.Label asChild>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
              </Clerk.Label>
              <Clerk.Input
                asChild
                className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
              >
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  required
                />
              </Clerk.Input>
              <Clerk.FieldError />
            </Clerk.Field>

            <div
              id="clerk-captcha"
              data-cl-theme="dark"
              data-cl-size="normal"
              data-cl-language="en-US"
              className="mt-4"
            />

            <SignUp.Action submit asChild>
              <Button type="submit" className="w-full" variant="gold">
                Sign Up
              </Button>
            </SignUp.Action>
          </div>

          <div className="my-6 flex items-center gap-4">
            <hr className="flex-1 border-[#E6B325] opacity-40" />
            <span className="text-[#E6B325] text-sm font-semibold">
              Or continue with
            </span>
            <hr className="flex-1 border-[#E6B325] opacity-40" />
          </div>

          <div className="flex flex-col gap-2">
            <Clerk.Connection name="google" asChild>
              <Button
                variant="outline"
                className="w-full border-[#E6B325] text-[#E6B325] hover:bg-[#E6B325] hover:text-white"
              >
                Sign up with Google
              </Button>
            </Clerk.Connection>
          </div>

          {!hideLoginLink && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#E6B325] hover:underline">
                Log in
              </Link>
            </p>
          )}
        </SignUp.Step>

        <SignUp.Step name="verifications">
          <SignUp.Strategy name="email_code">
            <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
              Confirm your email
            </h1>

            <p className="text-center mb-4 text-gray-400">
              We've sent a verification code to{" "}
              <span className="text-[#E6B325] font-medium">
                {signUp?.emailAddress}
              </span>
            </p>

            <Clerk.Field name="code">
              <Clerk.Label asChild>
                <Label>Email verification code</Label>
              </Clerk.Label>
              <Clerk.Input
                asChild
                className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
              >
                <Input placeholder="Enter code" />
              </Clerk.Input>
              <Clerk.FieldError />
            </Clerk.Field>

            <div className="mt-4 space-y-4">
              <SignUp.Action
                resend
                className="w-full text-[#E6B325] hover:text-[#FFD966] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                fallback={({ resendableAfter }) => (
                  <button
                    type="button"
                    disabled
                    className="w-full text-[#E6B325]/50 text-sm cursor-not-allowed"
                  >
                    Resend code in {resendableAfter} seconds
                  </button>
                )}
              >
                Didn't receive the code? Resend
              </SignUp.Action>

              <SignUp.Action
                navigate="start"
                className="w-full text-gray-400 hover:text-white text-sm"
              >
                Need to change your email?
              </SignUp.Action>
            </div>

            <SignUp.Action submit asChild>
              <Button type="submit" className="w-full mt-4" variant="gold">
                Confirm Email
              </Button>
            </SignUp.Action>
          </SignUp.Strategy>
        </SignUp.Step>

        <SignUp.Step name="continue">
          <h1 className="text-2xl font-bold mb-6 text-center text-[#E6B325]">
            Complete your profile
          </h1>
          <div className="space-y-4">
            <Clerk.Field name="username">
              <Clerk.Label asChild>
                <Label htmlFor="username">Username</Label>
              </Clerk.Label>
              <Clerk.Input
                asChild
                className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
              >
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  required
                />
              </Clerk.Input>
              <Clerk.FieldError />
            </Clerk.Field>
            <SignUp.Action submit asChild>
              <Button 
                type="submit" 
                className="w-full mt-4" 
                variant="gold"
              >
                Continue
              </Button>
            </SignUp.Action>
          </div>
        </SignUp.Step>
      </SignUp.Root>
    </div>
  );
}
