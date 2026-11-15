import { LinkButton } from "@components/ui/link-button";
import { Mascot } from "@components/ui/mascot";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-14 text-center">
      <Mascot name="karp" className="h-36" />
      <p className="sticker mt-6 px-3 py-1.5 text-lg">404</p>
      <h1 className="font-display mt-4 text-4xl">This page used Splash!</h1>
      <p className="mt-2 text-muted-foreground">But nothing happened. Page not found: it may have moved, or the link is wrong.</p>
      <div className="mt-6 flex flex-col gap-2 fold:flex-row">
        <LinkButton href="/">Back home</LinkButton>
        <LinkButton href="/events" variant="outline">
          See events
        </LinkButton>
      </div>
    </div>
  );
}
