import { redirect } from "next/navigation";
import { SignupForm } from "@components/ui/SignUpForm";
import { getCurrentUser } from "@lib/auth/server";

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <SignupForm />;
}
