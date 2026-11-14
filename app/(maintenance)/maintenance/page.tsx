import Image from "next/image";
import Link from "next/link";

function CautionTape({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="flex h-12 shrink-0 items-center overflow-hidden whitespace-nowrap font-extrabold tracking-[0.3em] text-ink short:h-8"
      style={{ background: "repeating-linear-gradient(-45deg, #e6b325 0 28px, #111 28px 56px)" }}
    >
      <span className="mx-auto bg-gold px-4 text-xs fold:text-sm">{label}</span>
    </div>
  );
}

/** Shown to visitors while maintenance mode is on. Staff can still sign in. */
export default function MaintenancePage() {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr_auto] bg-black pt-[env(safe-area-inset-top)]">
      <CautionTape label="UNDER CONSTRUCTION" />
      <main className="flex items-center justify-center px-safe py-8 short:py-3">
        <div className="flex w-full max-w-md flex-col items-center text-center short:max-w-2xl short:flex-row short:gap-6 short:text-left">
          <div className="relative aspect-square w-[min(15rem,55vw)] shrink-0 short:w-32">
            <Image src="/images/pikachu_construction.gif" alt="Pikachu with a hard hat" fill unoptimized priority className="object-contain" />
          </div>
          <div>
            <h1 className="mt-4 text-3xl font-extrabold text-gold fold:text-5xl short:mt-0 short:text-3xl">Coming soon</h1>
            <p className="mt-3 text-sm text-foreground/80 fold:text-base">
              We&apos;re building something special for card players: events, tournaments and more. Stay tuned for the
              grand opening of MAV Collectibles!
            </p>
            <Link
              href="/sign-in?next=/admin"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-gold/60 px-6 font-semibold text-gold hover:bg-gold hover:text-ink fold:w-auto short:mt-4"
            >
              Staff sign in
            </Link>
          </div>
        </div>
      </main>
      <div className="pb-[env(safe-area-inset-bottom)]">
        <CautionTape label="UNDER CONSTRUCTION" />
      </div>
    </div>
  );
}
