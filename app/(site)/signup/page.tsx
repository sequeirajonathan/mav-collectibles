"use client";

import { SignupForm } from '@components/ui/SignUpForm'
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@contexts/AuthContext";

export default function SignUpPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (!isLoading && user) return null;

  return <SignupForm />
}
