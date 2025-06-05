"use client";

import { SignupForm } from '@components/ui/SignUpForm'
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export default function SignUpPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && userId) {
      router.replace("/dashboard");
    }
  }, [userId, isLoaded, router]);

  if (isLoaded && userId) return null;

  return <SignupForm />
}
