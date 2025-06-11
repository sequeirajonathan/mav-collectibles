import { z } from 'zod';

export const printJobSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  label_url: z.string().url(),
  status: z.string(),
  claimed_by: z.string().nullable(),
  claimed_at: z.string().datetime().nullable(),
  printed_at: z.string().datetime().nullable(),
  retries: z.number().int().min(0),
  last_tried_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type PrintJob = z.infer<typeof printJobSchema>; 