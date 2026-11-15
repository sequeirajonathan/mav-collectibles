import Image from "next/image";
import { LinkButton } from "@components/ui/link-button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-14 text-center">
      <Image src="/images/karp.gif" alt="" width={500} height={659} unoptimized className="pixelated animate-bob h-36 w-auto" />
      <p className="sticker mt-6 px-3 py-1.5 text-lg">404</p>
      <h1 className="font-display mt-4 text-4xl">This page used Splash!</h1>
      <p className="mt-2 text-muted-foreground">But nothing happened. The page you were looking for isn&apos;t here.</p>
      <div className="mt-6 flex flex-col gap-2 fold:flex-row">
        <LinkButton href="/">Back home</LinkButton>
        <LinkButton href="/events" variant="outline">
          See events
        </LinkButton>
      </div>
    </div>
  );
}
