"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { Field, inputClass } from "@components/ui/field";
import { PhoneInput } from "@components/ui/phone-input";
import { updateMyProfile } from "@lib/actions/account";
import { unlinkDiscordAccount } from "@lib/actions/discord";
import { getBrowserClient } from "@utils/supabase/client";
import type { Game } from "@lib/contracts/hub";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";

const toDisplayPhone = (e164: string | null) => {
  const d = (e164 ?? "").replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : "";
};

export function ProfileForm({
  profile,
  email,
  games,
}: {
  profile: { username: string | null; firstName: string; lastName: string; phone: string | null; favoriteGameId: string | null; pokemonPlayerId: string | null; birthMonth: string | null; discordUsername: string | null };
  email: string;
  games: Game[];
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: toDisplayPhone(profile.phone),
    favoriteGameId: profile.favoriteGameId ?? "",
    pokemonPlayerId: profile.pokemonPlayerId ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newEmail, setNewEmail] = useState(email);
  const [pending, startTransition] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await updateMyProfile(values);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      toast.success("Profile saved");
      router.refresh();
    });
  };

  const forgetBirth = () =>
    startTransition(async () => {
      const result = await updateMyProfile({ ...values, forgetBirthMonth: true });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Birth month removed from your profile");
      router.refresh();
    });

  const disconnectDiscord = () =>
    startTransition(async () => {
      const result = await unlinkDiscordAccount({});
      if (!result.ok) return void toast.error(result.error);
      toast.success("Discord disconnected");
      router.refresh();
    });

  const changeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const { error } = await (await getBrowserClient()).auth.updateUser({ email: newEmail }, { emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile` });
      if (error) toast.error(error.message);
      else toast.success("Check both inboxes to confirm the change");
    });
  };

  return (
    <div className="space-y-8">
      <form onSubmit={save} className={cn(cardVariants({ padding: "lg" }), "space-y-5")}>
        <h2 className="text-lg font-bold">Your details</h2>
        <p className="text-sm text-muted-foreground">
          Username <strong className="text-foreground">{profile.username ?? "not set"}</strong> is shown on comments and standings.
        </p>
        <div className="grid gap-5 fold:grid-cols-2">
          <Field label="First name" error={errors.firstName}>
            {(id) => <input id={id} className={inputClass} value={values.firstName} onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))} autoComplete="given-name" />}
          </Field>
          <Field label="Last name" error={errors.lastName}>
            {(id) => <input id={id} className={inputClass} value={values.lastName} onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))} autoComplete="family-name" />}
          </Field>
        </div>
        <Field label="Phone (US)" hint="Links your account to your store purchases" error={errors.phone}>
          {(id) => <PhoneInput id={id} value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} />}
        </Field>
        <Field label="Favorite game" error={errors.favoriteGameId}>
          {(id) => (
            <select id={id} className={inputClass} value={values.favoriteGameId} onChange={(e) => setValues((v) => ({ ...v, favoriteGameId: e.target.value }))}>
              <option value="">No favorite</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Pokémon Player ID (optional)" hint="Your Play! Pokémon ID. We fill it in for you when you sign up for a Pokémon event." error={errors.pokemonPlayerId}>
          {(id) => <input id={id} className={inputClass} inputMode="numeric" maxLength={12} autoComplete="off" value={values.pokemonPlayerId} onChange={(e) => setValues((v) => ({ ...v, pokemonPlayerId: e.target.value }))} />}
        </Field>
        <Button type="submit" variant="gold" disabled={pending} className="w-full fold:w-auto">Save</Button>
        {profile.birthMonth && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-4 text-sm text-muted-foreground">
            <span>We remember your birth month ({profile.birthMonth}) to fill in event sign-ups.</span>
            <button type="button" className="min-h-9 font-semibold text-gold underline underline-offset-2" disabled={pending} onClick={forgetBirth}>
              Forget it
            </button>
          </p>
        )}
      </form>

      <section className={cn(cardVariants({ padding: "lg" }), "space-y-3")}>
        <h2 className="text-lg font-bold">Discord</h2>
        {profile.discordUsername ? (
          <>
            <p className="text-sm text-muted-foreground">
              Connected as <strong className="text-foreground">{profile.discordUsername}</strong>. You can RSVP from our Discord server with <code>/rsvp</code>.
            </p>
            <Button type="button" variant="outline" disabled={pending} onClick={disconnectDiscord} className="w-full fold:w-auto">
              Disconnect Discord
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Not connected. In our Discord server, type <code>/link</code> and follow the button to connect your account. Then you can RSVP from Discord.
          </p>
        )}
      </section>

      <form onSubmit={changeEmail} className={cn(cardVariants({ padding: "lg" }), "space-y-4")}>
        <h2 className="text-lg font-bold">Email</h2>
        <Field label="Email address" hint="We'll send a confirmation link before it changes">
          {(id) => <input id={id} type="email" className={inputClass} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" />}
        </Field>
        <Button type="submit" variant="outline" disabled={pending || newEmail === email} className="w-full fold:w-auto">Change email</Button>
      </form>
    </div>
  );
}
