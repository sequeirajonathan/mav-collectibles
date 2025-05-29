"use client";

import { useState } from "react";
import { useAuth } from "@contexts/AuthContext";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@components/ui/GoogleSignInButton";

interface SignupFormProps {
  redirectTo?: string;
  hideLoginLink?: boolean;
}

export function SignupForm({ redirectTo = "/dashboard", hideLoginLink = false }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setPasswordError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const phoneNumber = formData.get("phoneNumber") as string;

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await signup(email, password, phoneNumber);
      
      if (error) {
        if (error.message.includes('10 seconds')) {
          toast.error('Please wait 10 seconds before trying again');
        } else {
          throw error;
        }
        return;
      }

      if (data?.user) {
        toast.success("Account created successfully! Please check your email to verify your account.");
        router.push("/login?message=Please check your email to verify your account");
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
        Sign Up
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            required
            disabled={isLoading}
            className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder="Enter your phone number"
            required
            disabled={isLoading}
            className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a password"
            required
            disabled={isLoading}
            className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            required
            disabled={isLoading}
            className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
          />
        </div>
        {passwordError && (
          <div className="text-red-500 text-sm text-center">{passwordError}</div>
        )}
        <Button
          type="submit"
          className="w-full"
          variant="gold"
          disabled={isLoading}
        >
          {isLoading ? "Creating Account..." : "Sign Up"}
        </Button>
      </form>
      <div className="my-6 flex items-center gap-4">
        <hr className="flex-1 border-[#E6B325] opacity-40" />
        <span className="text-[#E6B325] text-sm font-semibold">Or continue with</span>
        <hr className="flex-1 border-[#E6B325] opacity-40" />
      </div>
      <div className="flex flex-col gap-2">
        <GoogleSignInButton redirectTo={redirectTo} />
      </div>
      {!hideLoginLink && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-[#E6B325] hover:underline">
            Log in
          </Link>
        </p>
      )}
    </div>
  );
} 