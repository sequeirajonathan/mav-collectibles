import { z } from "zod";
import { isoDateTime, optionalText, uuid } from "./common";

export const requestKindSchema = z.enum(["feature", "bug", "improvement"]);
export type RequestKind = z.infer<typeof requestKindSchema>;

export const requestPrioritySchema = z.enum(["low", "normal", "high"]);
export type RequestPriority = z.infer<typeof requestPrioritySchema>;

export const requestStatusSchema = z.enum(["new", "planned", "in_progress", "done", "declined"]);
export type RequestStatus = z.infer<typeof requestStatusSchema>;

/** Statuses that still need work. */
export const OPEN_STATUSES: readonly RequestStatus[] = ["new", "planned", "in_progress"];

export const KIND_LABEL: Record<RequestKind, string> = { feature: "New feature", bug: "Something's broken", improvement: "Improvement" };
export const STATUS_LABEL: Record<RequestStatus, string> = { new: "New", planned: "Planned", in_progress: "In progress", done: "Done", declined: "Not doing" };
export const PRIORITY_LABEL: Record<RequestPriority, string> = { low: "Low", normal: "Normal", high: "Urgent" };

export const staffRequestSchema = z.object({
  id: uuid,
  kind: requestKindSchema,
  title: z.string(),
  details: z.string(),
  page: z.string().nullable(),
  priority: requestPrioritySchema,
  status: requestStatusSchema,
  createdBy: uuid,
  createdByName: z.string(),
  response: z.string(),
  completedAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type StaffRequest = z.infer<typeof staffRequestSchema>;

export const submitRequestInput = z.object({
  kind: requestKindSchema,
  title: z.string().trim().min(3, "Give it a short title").max(120, "Keep the title under 120 characters"),
  details: z.string().trim().max(4000, "Keep the details under 4,000 characters").default(""),
  page: optionalText(300),
  urgent: z.boolean().default(false),
});

export const updateRequestInput = z.object({
  id: uuid,
  status: requestStatusSchema,
  priority: requestPrioritySchema,
  response: z.string().trim().max(2000, "Keep the reply under 2,000 characters").default(""),
});

export const deleteRequestInput = z.object({ id: uuid });
