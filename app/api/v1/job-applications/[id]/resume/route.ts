import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { createAdminClient } from "@utils/supabase/admin";
import { getUserWithRole } from "@lib/auth/server";
import { HIRING_ROLES } from "@interfaces/roles";
import { uuid } from "@lib/contracts/common";

/** Staff: open an applicant's résumé through a link that expires in a minute. */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { allowed } = await getUserWithRole(HIRING_ROLES);
  if (!allowed) return NextResponse.json({ error: { code: "FORBIDDEN", message: "Not allowed" } }, { status: 403 });
  const id = uuid.safeParse((await context.params).id);
  const row = id.success ? await prisma.jobApplication.findUnique({ where: { id: id.data }, select: { resume_path: true, resume_name: true } }) : null;
  if (!row?.resume_path) return NextResponse.json({ error: { code: "NOT_FOUND", message: "No résumé on file" } }, { status: 404 });
  const signed = await createAdminClient()
    .storage.from("resumes")
    .createSignedUrl(row.resume_path, 60, { download: row.resume_name ?? true });
  if (signed.error) return NextResponse.json({ error: { code: "INTERNAL", message: "Couldn't open the résumé" } }, { status: 500 });
  return NextResponse.redirect(signed.data.signedUrl);
}
