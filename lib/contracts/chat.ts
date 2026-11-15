import { z } from "zod";
import { isoDateTime, uuid } from "./common";

export const CHAT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const CHAT_IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" };

export const chatMessageSchema = z.object({
  id: uuid,
  authorId: uuid,
  authorName: z.string(),
  body: z.string(),
  hasImage: z.boolean(),
  createdAt: isoDateTime,
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatListSchema = z.object({ messages: z.array(chatMessageSchema) });
export const chatQuerySchema = z.object({ after: isoDateTime.optional() });

/** A path returned by the upload endpoint: "<uuid>.<ext>". */
const imagePath = z.string().regex(/^[0-9a-f-]{36}\.(jpg|png|gif|webp)$/);

export const sendMessageInput = z
  .object({ body: z.string().trim().max(4000, "Keep messages under 4,000 characters").default(""), imagePath: imagePath.nullish() })
  .refine((m) => m.body !== "" || m.imagePath, "Write a message or attach a picture");

export const deleteMessageInput = z.object({ id: uuid });
export const uploadResponseSchema = z.object({ path: imagePath });

export const pushSubscriptionInput = z.object({
  endpoint: z.url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(300), auth: z.string().min(1).max(100) }),
});
export const removeSubscriptionInput = z.object({ endpoint: z.string().max(1000) });
