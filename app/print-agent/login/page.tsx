import { Suspense } from "react";
import { PrintAgentLoginForm } from "@components/ui/PrintAgentLoginForm";

export default function PrintAgentLoginPage() {
  return (
    <Suspense>
      <PrintAgentLoginForm />
    </Suspense>
  );
}
