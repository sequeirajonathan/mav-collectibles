import { defineRoute } from "@lib/api/define-route";
import { CONTENT_ROLES } from "@interfaces/roles";
import { chatListSchema, chatQuerySchema } from "@lib/contracts/chat";
import { listChatMessages } from "@lib/data/chat";

/** Staff: the latest chat messages, or only those newer than `after`. */
export const GET = defineRoute({
  roles: CONTENT_ROLES,
  query: chatQuerySchema,
  response: chatListSchema,
  handler: async ({ query }) => ({ messages: await listChatMessages(query.after) }),
});
