import { canSeeShop } from "@lib/shop-access";
import { LinkButton } from "@components/ui/link-button";
import { Mascot } from "@components/ui/mascot";

/** Renders the shop for people allowed to see it, and a "coming soon" note for everyone else. */
export async function ShopGate({ children }: { children: React.ReactNode }) {
  if (await canSeeShop()) return <>{children}</>;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-14 text-center">
      <Mascot name="eevee" className="h-28" />
      <p className="sticker mt-6 px-3 py-1.5 text-lg">Coming soon</p>
      <h1 className="font-display mt-4 text-4xl">The online shop is on its way</h1>
      <p className="mt-2 text-muted-foreground">We&apos;re still stocking the shelves here. Until then, come see everything in person at the shop.</p>
      <div className="mt-6 flex flex-col gap-2 fold:flex-row">
        <LinkButton href="/visit">Hours and directions</LinkButton>
        <LinkButton href="/events" variant="outline">
          See events
        </LinkButton>
      </div>
    </div>
  );
}
