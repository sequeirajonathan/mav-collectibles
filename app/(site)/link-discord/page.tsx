import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LinkDiscord } from "@components/account/link-discord";
import { LinkButton } from "@components/ui/link-button";
import { Skeleton } from "@components/ui/skeleton";
import { getCurrentUser } from "@lib/auth/server";
import { readLinkToken } from "@lib/discord/core";
import { prisma } from "@lib/prisma";

export const metadata: Metadata = { title: "Connect Discord", robots: { index: false } };

type SearchParams = Promise<{ token?: string }>;

async function Connect({ searchParams }: { searchParams: SearchParams }) {
  const { token = "" } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/link-discord?token=${token}`)}`);
  const link = readLinkToken(token);
  if (!link) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-display text-3xl">That link has expired</h1>
        <p className="text-muted-foreground">Connection links work for 15 minutes. Run /link in our Discord server to get a new one.</p>
        <LinkButton href="/profile" variant="outline">Back to your profile</LinkButton>
      </div>
    );
  }
  const profile = await prisma.profile.findUnique({ where: { id: user.id }, select: { username: true } });
  return <LinkDiscord token={token} discordName={link.discordUsername} accountName={profile?.username ?? user.email ?? "your account"} />;
}

export default function LinkDiscordPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-md py-10">
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Connect searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
