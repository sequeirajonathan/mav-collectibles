import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SignupForm } from "@components/ui/SignUpForm";
import { getCurrentUser } from "@lib/auth/server";

async function SignUp() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <SignupForm />;
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-[32rem] max-w-md animate-pulse rounded-xl bg-panel" />}>
      <SignUp />
    </Suspense>
  );
}
