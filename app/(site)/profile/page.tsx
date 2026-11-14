import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@components/hub/page-header";
import { ProfileForm } from "@components/account/profile-form";
import { AddressForm } from "@components/account/address-form";
import { getCurrentUser } from "@lib/auth/server";
import { listGames } from "@lib/data/hub";
import { getMyCustomer } from "@lib/data/customer";
import { prisma } from "@lib/prisma";

export const metadata: Metadata = { title: "Profile" };

async function Profile() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/profile");
  const [profile, games] = await Promise.all([prisma.profile.findUnique({ where: { id: user.id } }), listGames()]);
  return (
    <ProfileForm
      email={user.email ?? ""}
      games={games}
      profile={{
        username: profile?.username ?? null,
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        phone: profile?.phone ?? null,
        favoriteGameId: profile?.favorite_game_id ?? null,
      }}
    />
  );
}

async function StoreAccount() {
  const user = await getCurrentUser();
  if (!user) return null;
  const customer = await getMyCustomer(user.id).catch(() => null);
  return customer ? <AddressForm customer={customer} /> : null;
}

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile" />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-panel" />}>
        <Profile />
      </Suspense>
      <div className="mt-8">
        <Suspense fallback={null}>
          <StoreAccount />
        </Suspense>
      </div>
    </div>
  );
}
