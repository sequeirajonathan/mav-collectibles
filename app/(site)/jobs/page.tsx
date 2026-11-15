import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Mascot } from "@components/ui/mascot";
import { ApplyForm } from "@components/jobs/apply-form";
import { Eyebrow } from "@components/ui/page-header";
import { cardVariants } from "@components/ui/card";
import { JOB_OPENINGS } from "@const/jobs";
import { STORE_ADDRESS } from "@lib/format";
import { cn } from "@utils";

export const metadata: Metadata = {
  title: "We're hiring",
  description: "Work at MAV Collectibles in Montgomery, TX. See open positions and apply online.",
};

const EMAIL = "info@mavcollectibles.com";
/** Staff-run line for help with applications (from the shop's own job posts). */
const HIRING_PHONE = "(936) 330-3553";

export default function JobsPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-hero px-5 py-8 fold:px-8 fold:py-10">
        <div aria-hidden className="speed-lines pointer-events-none absolute inset-0" />
        <Mascot name="lucario" className="pointer-events-none absolute bottom-3 right-4 hidden h-36 fold:block lg:right-16 lg:h-44" />
        <div className="relative max-w-2xl">
          <Eyebrow>Join the team</Eyebrow>
          <h1 className="ui-hero-title font-display mt-3 text-5xl leading-[1.05] fold:text-7xl">
            We&apos;re <span className="text-pop">hiring!</span>
          </h1>
          <p className="mt-3 max-w-xl text-foreground/80 fold:text-lg">
            Love trading card games and looking after the people who play them? Come work at the shop.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-start">
        <div className="space-y-4">
          {JOB_OPENINGS.map((job) => (
            <article key={job.id} className={cn(cardVariants({ padding: "lg" }))}>
              <p className="sticker px-2 py-1 text-sm">Open now</p>
              <h2 className="font-display mt-3 text-3xl">{job.title}</h2>
              <p className="mt-2 text-foreground/80">{job.summary}</p>
              <h3 className="mt-4 text-sm font-bold uppercase tracking-wider text-gold">What we look for</h3>
              <ul className="mt-2 space-y-1.5">
                {job.lookingFor.map((item) => (
                  <li key={item} className="flex gap-2 text-sm fold:text-base">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
          <div className={cn(cardVariants({ variant: "inset", padding: "lg" }), "text-sm fold:text-base")}>
            <h2 className="font-bold">Other ways to apply</h2>
            <ul className="mt-2 space-y-1 text-foreground/80">
              <li>
                Send your résumé to <a className="font-semibold text-gold" href={`mailto:${EMAIL}`}>{EMAIL}</a>
              </li>
              <li>Apply in store: {STORE_ADDRESS}</li>
            </ul>
            <p className="mt-3">
              <span className="font-semibold">Need help with your application?</span> If the form gives you trouble or you have a
              question along the way, call <a className="font-semibold text-gold" href={`tel:${HIRING_PHONE.replace(/\D/g, "")}`}>{HIRING_PHONE}</a>.
            </p>
            <p className="mt-3 text-muted-foreground">Don&apos;t see your role? Choose &ldquo;General application&rdquo; in the form. We&apos;re always glad to meet good people.</p>
          </div>
        </div>
        <ApplyForm />
      </div>
    </div>
  );
}
