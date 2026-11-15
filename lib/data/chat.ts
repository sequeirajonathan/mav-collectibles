import "server-only";
import { prisma } from "@lib/prisma";
import { chatMessageSchema, type ChatMessage } from "@lib/contracts/chat";

/** The latest messages, oldest first; or only those after `after`. */
export async function listChatMessages(after?: string): Promise<ChatMessage[]> {
  const rows = await prisma.staffMessage.findMany({
    where: { deleted_at: null, ...(after ? { created_at: { gt: new Date(after) } } : {}) },
    orderBy: { created_at: "desc" },
    take: 100,
  });
  return rows.reverse().map((r) =>
    chatMessageSchema.parse({
      id: r.id,
      authorId: r.author_id,
      authorName: r.author_name,
      body: r.body,
      hasImage: r.image_path !== null,
      createdAt: r.created_at.toISOString(),
    })
  );
}
