import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@components/ui/LoginForm";
import { getCurrentUser } from "@lib/auth/server";
import { safeNext } from "@lib/auth/redirect";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect(safeNext((await searchParams).next));
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
