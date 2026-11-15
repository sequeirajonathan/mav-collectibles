import { ResetPasswordForm } from "@components/auth/auth-pages";

// Reached from the emailed reset link via /auth/callback, which signs the user in first.
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
