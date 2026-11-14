"use client";

import { LoginForm } from "@components/auth/login-form";
import { Card } from "@components/ui/card";

export function PrintAgentLoginForm() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-safe">
      <Card variant="featured" className="flex w-full max-w-md flex-col items-center p-6 shadow-2xl fold:p-10">
        <LoginForm hideSignupLink hideTitle hideForgotPassword hideSocialLogins />
      </Card>
    </div>
  );
}
