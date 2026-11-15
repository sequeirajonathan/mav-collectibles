import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { createAdminClient } from "@utils/supabase/admin";
import { getUserWithRole } from "@lib/auth/server";
import { CONTENT_ROLES } from "@interfaces/roles";
import { uuid } from "@lib/contracts/common";

/** Staff: a chat picture, through a signed link that expires in an hour. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { allowed } = await getUserWithRole(CONTENT_ROLES);
  if (!allowed) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not allowed" } }, { status: 403 });
  const id = uuid.safeParse((await context.params).id);
  const row = id.success ? await prisma.staffMessage.findUnique({ where: { id: id.data }, select: { image_path: true } }) : null;
  if (!row?.image_path) return NextResponse.json({ error: { code: "NOT_FOUND", message: "No picture" } }, { status: 404 });
  const signed = await createAdminClient().storage.from("staff-chat").createSignedUrl(row.image_path, 3600);
  if (signed.error) return NextResponse.json({ error: { code: "INTERNAL", message: "Couldn't load the picture" } }, { status: 500 });
  return NextResponse.redirect(signed.data.signedUrl);
}
