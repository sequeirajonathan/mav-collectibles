import { z } from "zod";
import { isoDateTime } from "./common";

export const replacementStatusSchema = z.enum(["proposed", "approved", "rejected"]);
export type ReplacementStatus = z.infer<typeof replacementStatusSchema>;

/** A proposed or reviewed replacement photo, for Admin → Photos. */
export const imageReplacementSchema = z.object({
  itemId: z.string(),
  itemName: z.string(),
  sourceName: z.string(),
  sourceSet: z.string().nullable(),
  status: replacementStatusSchema,
  /** The photo customers see today, or null when the item has none. */
  currentUrl: z.string().nullable(),
  currentSize: z.string().nullable(),
  proposedUrl: z.string(),
  proposedSize: z.string(),
  createdAt: isoDateTime,
});
export type ImageReplacement = z.infer<typeof imageReplacementSchema>;

export const reviewReplacementsInput = z.object({
  itemIds: z.array(z.string().min(1).max(64)).min(1).max(100),
  decision: z.enum(["approved", "rejected", "proposed"]),
});
