"use client";

import { LoginForm } from "@components/ui/LoginForm";

export function PrintAgentLoginForm() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <div className="flex flex-col items-center w-full max-w-md bg-zinc-900 rounded-xl shadow-2xl p-10 border border-yellow-600">
        <LoginForm
          hideSignupLink
          hideTitle
          hideForgotPassword
          hideSocialLogins
        />
      </div>
    </div>
  );
} 