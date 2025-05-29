import { Button } from "@components/ui/button";
import { createClient } from "@utils/supabase/client";
import { useState } from "react";
// import Image from "next/image"; // Uncomment if you add a Facebook icon

interface FacebookSignInButtonProps {
  redirectTo?: string;
  fullWidth?: boolean;
}

export function FacebookSignInButton({ redirectTo = "/dashboard", fullWidth = true }: FacebookSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setIsLoading(false);
  };

  return (
    <Button
      type="button"
      variant="outlineGold"
      className={`flex items-center justify-center gap-2 ${fullWidth ? "w-full" : ""}`}
      onClick={handleFacebookSignIn}
      isLoading={isLoading}
      disabled={isLoading}
    >
      {/* <Image src="/facebook-icon.svg" alt="Facebook" width={20} height={20} className="inline-block" /> */}
      Facebook
    </Button>
  );
} 