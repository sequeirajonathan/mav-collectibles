import { z } from "zod";
import { isoDateTime } from "./common";

const printJobStatusSchema = z.enum(["pending", "printing", "printed", "failed"]);

export const printJobSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  label_url: z.url(),
  status: z.string(),
  claimed_by: z.string().nullable(),
  claimed_at: isoDateTime.nullable(),
  printed_at: isoDateTime.nullable(),
  retries: z.number().int().min(0),
  last_tried_at: isoDateTime.nullable(),
  created_at: isoDateTime,
  updated_at: isoDateTime,
  copies: z.number().int().nullable(),
});
export type PrintJob = z.infer<typeof printJobSchema>;

export const printJobListSchema = z.array(printJobSchema);

export const createPrintJobInput = z.object({
  order_id: z.string().min(1),
  // The agent prints this silently, so only https URLs are accepted.
  label_url: z.url({ protocol: /^https$/, message: "Label URL must start with https://" }),
  copies: z.number().int().min(1).max(20).default(1),
});

export const updatePrintJobInput = z.object({
  id: z.string().min(1),
  status: printJobStatusSchema.optional(),
  claimed_by: z.string().nullable().optional(),
  retries: z.number().int().min(0).optional(),
});
