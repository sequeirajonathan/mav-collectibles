"use client";

import { LoginForm } from "@components/ui/LoginForm";

export function ElectronLoginForm() {
  return (
    <LoginForm 
      hideSignupLink 
      hideTitle 
      hideForgotPassword 
      hideSocialLogins
    />
  );
} 