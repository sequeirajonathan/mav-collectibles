"use client";

import { LoginForm } from "@components/ui/LoginForm";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export default function Login() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && userId) {
      router.replace("/dashboard");
    }
  }, [userId, isLoaded, router]);

  if (isLoaded && userId) return null;

  return <LoginForm />;
}