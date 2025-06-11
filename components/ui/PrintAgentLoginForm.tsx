"use client";

import { LoginForm } from "@components/ui/LoginForm";

export function PrintAgentLoginForm() {
  return (
    <LoginForm 
      hideSignupLink 
      hideTitle 
      hideForgotPassword 
      hideSocialLogins
    />
  );
} 