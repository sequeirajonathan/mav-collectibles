"use client";

import { Link2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";

/** Copies the link organizers hand out; it opens the event with the sign-up form ready. */
export function SignupLink({ slug }: { slug: string }) {
  const copy = async () => {
    const url = `${window.location.origin}/events/${slug}?rsvp=1`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Sign-up link copied. Paste it anywhere.");
    } catch {
      // Clipboard access can be refused; show the link so it can be copied by hand.
      window.prompt("Copy this sign-up link", url);
    }
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      <Link2 aria-hidden /> Copy sign-up link
    </Button>
  );
}
