import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@components/ui/LoginForm";
import { getCurrentUser } from "@lib/auth/server";
import { safeNext } from "@lib/auth/redirect";

type SearchParams = Promise<{ next?: string }>;

async function SignIn({ searchParams }: { searchParams: SearchParams }) {
  if (await getCurrentUser()) redirect(safeNext((await searchParams).next));
  return <LoginForm />;
}

export default function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-md animate-pulse rounded-xl bg-panel" />}>
      <SignIn searchParams={searchParams} />
    </Suspense>
  );
}
