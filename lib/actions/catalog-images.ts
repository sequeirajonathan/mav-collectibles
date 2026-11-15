"use server";

import { updateTag } from "next/cache";
import { prisma } from "@lib/prisma";
import { createAction } from "@lib/actions/safe-action";
import { CONTENT_ROLES } from "@interfaces/roles";
import { reviewReplacementsInput } from "@lib/contracts/catalog-images";
import { tags } from "@lib/data/tags";

/** Approve or reject proposed replacement photos ("proposed" undoes a decision). */
export const reviewImageReplacements = createAction({ input: reviewReplacementsInput, access: CONTENT_ROLES }, async ({ itemIds, decision }, user) => {
  const reviewed = decision !== "proposed";
  const result = await prisma.imageReplacement.updateMany({
    where: { square_item_id: { in: itemIds } },
    data: { status: decision, reviewed_by: reviewed ? user.id : null, reviewed_at: reviewed ? new Date() : null },
  });
  updateTag(tags.catalog);
  return { updated: result.count };
});
