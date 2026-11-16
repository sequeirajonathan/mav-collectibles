import { alertStaff } from "@lib/discord/announce";
import { defineRoute, HttpError } from "@lib/api/define-route";
import { prisma } from "@lib/prisma";
import { createAdminClient } from "@utils/supabase/admin";
import { applyInput, applyResponseSchema } from "@lib/contracts/jobs";
import { RESUME_MAX_BYTES, RESUME_TYPES } from "@const/jobs";
import { sendEmail } from "@lib/email";
import { serverEnv } from "@lib/env.server";
import { publicEnv } from "@lib/env";
import { notifyRoles } from "@lib/push";
import { HIRING_ROLES } from "@interfaces/roles";

const DAY_MS = 86_400_000;
/** Enough for a real hiring push; stops a script from filling the table. */
const MAX_PER_EMAIL_PER_DAY = 3;
const MAX_PER_DAY = 100;

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
};

/** Public: someone applies for a job (multipart form with an optional résumé). */
export const POST = defineRoute({
  response: applyResponseSchema,
  handler: async ({ request }) => {
    const form = await request.formData().catch(() => null);
    if (!form) throw new HttpError("BAD_REQUEST", "Please fill in the form and try again.");
    // Honeypot: real people never see or fill this field.
    if (text(form, "website")) return { ok: true as const };

    const parsed = applyInput.safeParse({
      position: text(form, "position"),
      name: text(form, "name"),
      email: text(form, "email"),
      phone: text(form, "phone"),
      availability: text(form, "availability"),
      message: text(form, "message"),
    });
    if (!parsed.success) throw new HttpError("BAD_REQUEST", parsed.error.issues[0]?.message ?? "Please check the form.");
    const input = parsed.data;

    const file = form.get("resume");
    const resume = file instanceof File && file.size > 0 ? file : null;
    if (resume) {
      if (!(resume.type in RESUME_TYPES)) throw new HttpError("BAD_REQUEST", "Résumés must be a PDF or Word document.");
      if (resume.size > RESUME_MAX_BYTES) throw new HttpError("BAD_REQUEST", "Résumés must be 4 MB or smaller.");
    }

    const since = new Date(Date.now() - DAY_MS);
    const [fromEmail, today] = await Promise.all([
      prisma.jobApplication.count({ where: { email: { equals: input.email, mode: "insensitive" }, created_at: { gte: since } } }),
      prisma.jobApplication.count({ where: { created_at: { gte: since } } }),
    ]);
    if (fromEmail >= MAX_PER_EMAIL_PER_DAY) throw new HttpError("CONFLICT", "We already have your application. We'll be in touch!");
    if (today >= MAX_PER_DAY) throw new HttpError("CONFLICT", "We can't take more applications online today. Please call or stop by the shop.");

    let resumePath: string | null = null;
    let resumeBytes: Buffer | null = null;
    if (resume) {
      resumeBytes = Buffer.from(await resume.arrayBuffer());
      resumePath = `${crypto.randomUUID()}.${RESUME_TYPES[resume.type]}`;
      const upload = await createAdminClient().storage.from("resumes").upload(resumePath, resumeBytes, { contentType: resume.type });
      if (upload.error) {
        console.error("Résumé upload failed", upload.error);
        throw new HttpError("INTERNAL", "We couldn't save your résumé. Please try again.");
      }
    }

    const resumeName = resume ? resume.name.replace(/[^\w.\- ()]/g, "_").slice(0, 200) : null;
    await prisma.jobApplication.create({ data: { ...input, resume_path: resumePath, resume_name: resumeName } });

    await notifyRoles(HIRING_ROLES, { title: "New job application", body: `${input.name} applied for ${input.position}`, url: "/admin/applications", tag: "job-application" });

    await alertStaff("New job application", `${input.name} applied for ${input.position}`, "/admin/applications");

    const notify = serverEnv().JOBS_NOTIFY_EMAIL;
    if (notify) {
      const site = publicEnv().NEXT_PUBLIC_SITE_URL ?? "";
      await sendEmail({
        to: notify,
        replyTo: input.email,
        subject: `Job application: ${input.name} (${input.position})`,
        text: [
          `Position: ${input.position}`,
          `Name: ${input.name}`,
          `Email: ${input.email}`,
          `Phone: ${input.phone || "not given"}`,
          `Availability: ${input.availability || "not given"}`,
          "",
          input.message || "(no message)",
          "",
          resume ? "The résumé is attached." : "No résumé was attached.",
          `Review it: ${site}/admin/applications`,
        ].join("\n"),
        attachments: resumeBytes && resumeName ? [{ filename: resumeName, content: resumeBytes }] : undefined,
      });
    }
    return { ok: true as const };
  },
});
