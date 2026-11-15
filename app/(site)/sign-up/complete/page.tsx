import { Suspense } from "react";
import { CompleteProfileForm } from "@components/auth/auth-pages";

export default function CompleteProfilePage() {
  return (
    <Suspense>
      <CompleteProfileForm />
    </Suspense>
  );
}
