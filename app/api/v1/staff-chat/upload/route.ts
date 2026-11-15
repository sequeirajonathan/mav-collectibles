import { defineRoute, HttpError } from "@lib/api/define-route";
import { CONTENT_ROLES } from "@interfaces/roles";
import { CHAT_IMAGE_MAX_BYTES, CHAT_IMAGE_TYPES, uploadResponseSchema } from "@lib/contracts/chat";
import { createAdminClient } from "@utils/supabase/admin";

/** Staff: upload a photo or GIF to attach to a chat message. */
export const POST = defineRoute({
  roles: CONTENT_ROLES,
  response: uploadResponseSchema,
  handler: async ({ request }) => {
    const form = await request.formData().catch(() => null);
    const file = form?.get("image");
    if (!(file instanceof File) || file.size === 0) throw new HttpError("BAD_REQUEST", "Choose a picture to send.");
    if (!(file.type in CHAT_IMAGE_TYPES)) throw new HttpError("BAD_REQUEST", "Pictures must be JPG, PNG, GIF or WebP.");
    if (file.size > CHAT_IMAGE_MAX_BYTES) throw new HttpError("BAD_REQUEST", "Pictures must be 4 MB or smaller.");
    const path = `${crypto.randomUUID()}.${CHAT_IMAGE_TYPES[file.type]}`;
    const upload = await createAdminClient()
      .storage.from("staff-chat")
      .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, cacheControl: "3600" });
    if (upload.error) {
      console.error("Chat image upload failed", upload.error);
      throw new HttpError("INTERNAL", "We couldn't upload that picture. Please try again.");
    }
    return { path };
  },
});
