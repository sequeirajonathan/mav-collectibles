import { Suspense } from "react";
import { PrintAgentLoginForm } from "@components/print-agent/login-form";

export default function PrintAgentLoginPage() {
  return (
    <Suspense>
      <PrintAgentLoginForm />
    </Suspense>
  );
}
