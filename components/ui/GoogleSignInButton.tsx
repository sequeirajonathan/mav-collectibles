import { Button } from "@components/ui/button";
import { createClient } from "@utils/supabase/client";
import { useState } from "react";
import Image from "next/image";

interface GoogleSignInButtonProps {
  redirectTo?: string;
  fullWidth?: boolean;
}

export function GoogleSignInButton({ redirectTo = "/dashboard", fullWidth = true }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    setIsLoading(false);
  };

  return (
    <Button
      type="button"
      variant="outlineGold"
      className={`flex items-center justify-center gap-2 ${fullWidth ? "w-full" : ""}`}
      onClick={handleGoogleSignIn}
      isLoading={isLoading}
      disabled={isLoading}
    >
      Google
    </Button>
  );
} 