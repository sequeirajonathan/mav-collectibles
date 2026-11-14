"use client";

import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@components/ui/button";
import { Field, inputClass } from "@components/hub/form";
import { updateMyCustomer } from "@lib/actions/account";
import { useShopMode } from "@components/layout/shop-mode";
import type { Customer, CustomerAddress } from "@lib/contracts/customer";

const formatAddress = (a: CustomerAddress) =>
  [a.addressLine1, a.addressLine2, a.locality, a.administrativeDistrictLevel1, a.postalCode].filter(Boolean).join(", ");

/** Shipping address, stored on the user's Square customer. Only shown once online ordering is on. */
export function AddressForm({ customer }: { customer: Customer }) {
  const { canPurchase } = useShopMode();
  const [address, setAddress] = useState<CustomerAddress>({ country: "US", administrativeDistrictLevel1: "TX", ...customer.address });
  const [suggestion, setSuggestion] = useState<CustomerAddress | null>(null);
  const [pending, startTransition] = useTransition();
  if (!canPurchase) return null;

  const submit = (next: CustomerAddress, acceptSuggestion: boolean) =>
    startTransition(async () => {
      const result = await updateMyCustomer({ address: next, acceptSuggestion });
      if (!result.ok) return void toast.error(result.error);
      if (result.data.status === "address_suggestion") return setSuggestion(result.data.suggestedAddress);
      if (result.data.status === "invalid_address") return void toast.error(result.data.messages[0]?.text ?? "That address couldn't be verified");
      setSuggestion(null);
      setAddress(next);
      toast.success("Address saved");
    });

  const set = (key: keyof CustomerAddress) => (e: React.ChangeEvent<HTMLInputElement>) => setAddress((a) => ({ ...a, [key]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(address, false); }} className="space-y-5 rounded-xl border border-line bg-panel p-4 fold:p-6">
      <h2 className="text-lg font-bold">Shipping address</h2>
      <Field label="Street address">{(id) => <input id={id} className={inputClass} value={address.addressLine1 ?? ""} onChange={set("addressLine1")} autoComplete="address-line1" />}</Field>
      <Field label="Apt, suite (optional)">{(id) => <input id={id} className={inputClass} value={address.addressLine2 ?? ""} onChange={set("addressLine2")} autoComplete="address-line2" />}</Field>
      <div className="grid gap-5 fold:grid-cols-3">
        <Field label="City">{(id) => <input id={id} className={inputClass} value={address.locality ?? ""} onChange={set("locality")} autoComplete="address-level2" />}</Field>
        <Field label="State">{(id) => <input id={id} className={inputClass} value={address.administrativeDistrictLevel1 ?? ""} onChange={set("administrativeDistrictLevel1")} autoComplete="address-level1" maxLength={2} />}</Field>
        <Field label="ZIP">{(id) => <input id={id} className={inputClass} value={address.postalCode ?? ""} onChange={set("postalCode")} autoComplete="postal-code" inputMode="numeric" />}</Field>
      </div>
      {suggestion && (
        <div role="status" className="rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm">
          <p className="font-semibold">Did you mean:</p>
          <p className="mt-1">{formatAddress(suggestion)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="gold" onClick={() => submit(suggestion, true)} disabled={pending}>Use this address</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => submit(address, true)} disabled={pending}>Keep mine</Button>
          </div>
        </div>
      )}
      <Button type="submit" variant="gold" disabled={pending} className="w-full fold:w-auto">Save address</Button>
    </form>
  );
}
