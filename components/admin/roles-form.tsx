"use client";

import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { Field, inputClass } from "@components/hub/form";
import { setUserRole } from "@lib/actions/account";

const ROLES = [
  { value: "USER", label: "Customer", help: "Default for everyone" },
  { value: "EVENT", label: "Event team", help: "Events, posts, vendors, check-in, results" },
  { value: "STAFF", label: "Staff", help: "Everything Event team can do, plus print jobs" },
  { value: "PRINT_AGENT", label: "Print agent", help: "The shop PC that prints shipping labels" },
  { value: "ADMIN", label: "Admin", help: "Everything, including site settings and roles" },
] as const;

export function RolesForm() {
  const [user, setUser] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["value"]>("STAFF");
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await setUserRole({ user, role });
          if (!result.ok) return void toast.error(result.error);
          toast.success(`${result.data.username} is now ${ROLES.find((r) => r.value === result.data.role)?.label}`);
          setUser("");
        });
      }}
      className="max-w-lg space-y-5 rounded-xl border border-line bg-panel p-4"
    >
      <Field label="Email, username or user ID">{(id) => <input id={id} className={inputClass} value={user} onChange={(e) => setUser(e.target.value)} required autoCapitalize="none" />}</Field>
      <fieldset>
        <legend className="text-sm font-semibold">Role</legend>
        <div className="mt-2 space-y-2">
          {ROLES.map((r) => (
            <label key={r.value} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-line p-3 has-[:checked]:border-gold">
              <input type="radio" name="role" className="mt-1 accent-[var(--gold)]" checked={role === r.value} onChange={() => setRole(r.value)} />
              <span>
                <span className="block font-semibold">{r.label}</span>
                <span className="text-sm text-muted-foreground">{r.help}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-muted-foreground">The person needs to sign out and back in for the change to take effect.</p>
      <Button type="submit" variant="gold" disabled={pending}>Update role</Button>
    </form>
  );
}
