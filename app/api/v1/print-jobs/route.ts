import { defineRoute, HttpError } from "@lib/api/define-route";
import { prisma } from "@lib/prisma";
import { PRINT_ROLES, UserRole } from "@interfaces/roles";
import {
  createPrintJobInput,
  printJobListSchema,
  printJobSchema,
  updatePrintJobInput,
} from "@lib/contracts/print-jobs";

export const GET = defineRoute({
  roles: PRINT_ROLES,
  response: printJobListSchema,
  handler: () => prisma.printJob.findMany({ orderBy: { created_at: "desc" }, take: 100 }),
});

export const POST = defineRoute({
  roles: [UserRole.ADMIN],
  body: createPrintJobInput,
  response: printJobSchema,
  handler: ({ body }) => prisma.printJob.create({ data: body }),
});

export const PATCH = defineRoute({
  roles: PRINT_ROLES,
  body: updatePrintJobInput,
  response: printJobSchema,
  handler: async ({ body }) => {
    const { id, ...data } = body;
    const existing = await prisma.printJob.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new HttpError("NOT_FOUND", "Print job not found");
    return prisma.printJob.update({ where: { id }, data });
  },
});
