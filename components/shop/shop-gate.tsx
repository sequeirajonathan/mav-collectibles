import { canSeeShop } from "@lib/shop-access";
import { TCGPLAYER_STORE_URL } from "@const/links";
import { buttonVariants } from "@components/ui/button";
import { LinkButton } from "@components/ui/link-button";
import { Mascot } from "@components/ui/mascot";

/** Renders the shop for people allowed to see it, and a "coming soon" note for everyone else. */
export async function ShopGate({ children }: { children: React.ReactNode }) {
  if (await canSeeShop()) return <>{children}</>;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-14 text-center">
      <Mascot name="random" className="size-28" />
      <p className="sticker mt-6 px-3 py-1.5 text-lg">Coming soon</p>
      <h1 className="font-display mt-4 text-4xl">The online shop is on its way</h1>
      <p className="mt-2 text-muted-foreground">We&apos;re still stocking the shelves here. Until then, buy singles from our TCGplayer store or come see everything in person.</p>
      <div className="mt-6 flex flex-col gap-2 fold:flex-row">
        <a href={TCGPLAYER_STORE_URL} target="_blank" rel="noopener" className={buttonVariants()}>
          Shop singles on TCGplayer
        </a>
        <LinkButton href="/visit" variant="outline">Hours and directions</LinkButton>
        <LinkButton href="/events" variant="outline">
          See events
        </LinkButton>
      </div>
    </div>
  );
}
