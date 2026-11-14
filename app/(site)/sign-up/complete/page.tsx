import { Suspense } from "react";
import { CompleteProfileForm } from "@components/ui/AuthPages";

export default function CompleteProfilePage() {
  return (
    <Suspense>
      <CompleteProfileForm />
    </Suspense>
  );
}
