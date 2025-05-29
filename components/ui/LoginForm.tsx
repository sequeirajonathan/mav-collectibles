"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@contexts/AuthContext";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GoogleSignInButton } from "@components/ui/GoogleSignInButton";

interface LoginFormProps {
  redirectTo?: string;
  hideSignupLink?: boolean;
}

export function LoginForm({
  redirectTo = "/dashboard",
  hideSignupLink = false,
}: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const error = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (process.env.NEXT_PUBLIC_DEBUG === "true") {
        console.log("🔐 LoginForm - Attempting login for:", email);
      }

      const { error } = await login(email, password);

      if (error) {
        if (process.env.NEXT_PUBLIC_DEBUG === "true") {
          console.error("🔐 LoginForm - Login error:", error);
        }
        toast.error(error.message);
        return;
      }

      if (process.env.NEXT_PUBLIC_DEBUG === "true") {
        console.log(
          "🔐 LoginForm - Login successful, redirecting to:",
          redirectTo
        );
      }

      toast.success("Logged in successfully!");
      router.push(redirectTo);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_DEBUG === "true") {
        console.error("🔐 LoginForm - Unexpected error:", error);
      }
      toast.error("An unexpected error occurred");
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            disabled={isLoading}
            className="border-2 border-[#E6B325] bg-[#181d29] text-white focus:border-[#FFD966]"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          variant="gold"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
        {!hideSignupLink && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#E6B325] hover:underline">
              Sign up
            </Link>
          </p>
        )}
      </form>
      <div className="my-6 flex items-center gap-4">
        <hr className="flex-1 border-[#E6B325] opacity-40" />
        <span className="text-[#E6B325] text-sm font-semibold">
          Or continue with
        </span>
        <hr className="flex-1 border-[#E6B325] opacity-40" />
      </div>
      <div className="flex flex-col gap-2">
        <GoogleSignInButton redirectTo={redirectTo} />
      </div>
    </div>
  );
}
