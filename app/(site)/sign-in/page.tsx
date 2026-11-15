import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@components/auth/login-form";
import { getCurrentUser } from "@lib/auth/server";
import { safeNext } from "@lib/auth/redirect";
import { Skeleton } from "@components/ui/skeleton";

type SearchParams = Promise<{ next?: string }>;

async function SignIn({ searchParams }: { searchParams: SearchParams }) {
  if (await getCurrentUser()) redirect(safeNext((await searchParams).next));
  return <LoginForm />;
}

export default function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-md" />}>
      <SignIn searchParams={searchParams} />
    </Suspense>
  );
}
