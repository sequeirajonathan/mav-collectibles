import "server-only";
import { serverEnv } from "@lib/env.server";
import { getServiceKey } from "@lib/service-keys";

interface Email {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer }[];
}

/**
 * Sends an email through Resend. Returns false (and logs) when email isn't
 * configured or the send fails; callers treat email as best-effort.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  const env = serverEnv();
  const apiKey = await getServiceKey("RESEND_API_KEY");
  if (!apiKey || !env.EMAIL_FROM) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        reply_to: email.replyTo,
        attachments: email.attachments?.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) console.error(`Email send failed: HTTP ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error("Email send failed", error);
    return false;
  }
}
