import { z } from "zod";
import { JOB_POSITIONS } from "@const/jobs";
import { isoDateTime, uuid } from "./common";

export const applicationStatusSchema = z.enum(["new", "reviewing", "interview", "hired", "declined"]);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  interview: "Interview",
  hired: "Hired",
  declined: "Not moving forward",
};

/** The text fields of the public application form (the résumé travels as a file). */
export const applyInput = z.object({
  position: z.string().refine((p) => JOB_POSITIONS.includes(p), "Choose a position"),
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.email("Enter a valid email address").max(254),
  phone: z.string().trim().max(40).default(""),
  availability: z.string().trim().max(500).default(""),
  message: z.string().trim().max(4000, "Keep this under 4,000 characters").default(""),
});

export const jobApplicationSchema = z.object({
  id: uuid,
  position: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  availability: z.string(),
  message: z.string(),
  resumeName: z.string().nullable(),
  status: applicationStatusSchema,
  notes: z.string(),
  createdAt: isoDateTime,
});
export type JobApplication = z.infer<typeof jobApplicationSchema>;

export const updateApplicationInput = z.object({
  id: uuid,
  status: applicationStatusSchema,
  notes: z.string().trim().max(2000, "Keep notes under 2,000 characters").default(""),
});
export const deleteApplicationInput = z.object({ id: uuid });

export const applyResponseSchema = z.object({ ok: z.literal(true) });
