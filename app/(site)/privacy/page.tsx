import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHeader } from "@components/ui/page-header";
import { STORE_ADDRESS } from "@lib/format";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What MAV Collectibles collects when you use this site, why, and how to have it deleted.",
};

const EMAIL = "info@mavcollectibles.com";
const UPDATED = "November 15, 2026";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-foreground/80 fold:text-base">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const mail = (
    <a className="text-gold underline-offset-2 hover:underline" href={`mailto:${EMAIL}`}>
      {EMAIL}
    </a>
  );
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Legal" title="Privacy policy" description={`Last updated ${UPDATED}`} />
      <div className="space-y-8">
        <Section id="who" title="Who we are">
          <p>
            MAV Collectibles is a local game store at {STORE_ADDRESS}. This policy covers mavcollectibles.com and the
            MAV Collectibles app you can install from it.
          </p>
        </Section>

        <Section id="collect" title="What we collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Account details:</strong> your email address, and the name, username and phone number you choose
              to add to your profile.
            </li>
            <li>
              <strong>Sign-in with Google or Facebook:</strong> if you use one of these, we receive your name, email
              address and profile picture from that company. We never see your Google or Facebook password and we
              don&apos;t post anything on your behalf.
            </li>
            <li>
              <strong>What you do here:</strong> the events you RSVP to and the answers you give to an event&apos;s
              sign-up questions (for example a player ID, date of birth or an uploaded deck list, which only our staff see), tournament results and
              season points, posts you like, save or comment on, and vendor applications you send us.
            </li>
            <li>
              <strong>Store records:</strong> if the email on your account matches a customer record at our register,
              we may link the two so your account reflects your in-store history.
            </li>
            <li>
              <strong>Job applications:</strong> if you apply for a job, the details you enter and your résumé. Only
              the people who hire for the shop can see them, and you can ask us to delete them at any time.
            </li>
            <li>
              <strong>On your device:</strong> a cookie that keeps you signed in, and your light or dark theme choice.
            </li>
          </ul>
        </Section>

        <Section id="use" title="How we use it">
          <p>
            To run your account, hold your spot at events, show standings, send you emails about your account (such as
            confirming your address or resetting a password), and keep the site secure. We don&apos;t sell your
            information and we don&apos;t use it for advertising.
          </p>
        </Section>

        <Section id="public" title="What other people can see">
          <p>
            Your username, or your first name and last initial if you haven&apos;t picked one, can appear publicly next
            to your comments, on event attendee lists and on the leaderboard. Your email address and phone number are
            never shown to other visitors. Store staff can see who has signed up for an event.
          </p>
        </Section>

        <Section id="share" title="Who we share it with">
          <p>
            Only the companies that help us run the site, and only as needed to do that: our hosting and database
            providers, our email delivery provider, Square (our in-store register), and Google or Facebook if you
            choose to sign in with them. We may also disclose information when the law requires it.
          </p>
        </Section>

        <Section id="delete" title="Deleting your data">
          <p>
            You can ask us to delete your account and everything tied to it at any time. Email {mail} from the address
            on your account with the subject &ldquo;Delete my account&rdquo;. We&apos;ll confirm and remove your
            account, profile, RSVPs, comments, likes and saved posts within 30 days. Records we must keep by law, such
            as in-store purchase receipts, are not part of your website account.
          </p>
          <p>
            If you signed in with Facebook or Google, you can also remove our access from your Facebook or Google
            account settings. That stops future sign-ins but does not delete your account here, so email us as well.
          </p>
        </Section>

        <Section id="children" title="Children">
          <p>
            Accounts are for people 13 and older. If you believe a child under 13 has created an account, contact us and
            we&apos;ll remove it.
          </p>
        </Section>

        <Section id="changes" title="Changes to this policy">
          <p>If we change this policy we&apos;ll update the date at the top of this page.</p>
        </Section>

        <Section id="contact" title="Contact">
          <p>
            Questions? Email {mail} or call <a className="text-gold" href="tel:9364491277">(936) 449-1277</a>.
          </p>
        </Section>
      </div>
    </div>
  );
}
