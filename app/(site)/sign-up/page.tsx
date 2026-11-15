import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SignupForm } from "@components/auth/sign-up-form";
import { getCurrentUser } from "@lib/auth/server";
import { Skeleton } from "@components/ui/skeleton";

async function SignUp() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <SignupForm />;
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[32rem] max-w-md" />}>
      <SignUp />
    </Suspense>
  );
}
