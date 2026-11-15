import { z } from "zod";
import { defineRoute, HttpError } from "@lib/api/define-route";
import { canSeeShop } from "@lib/shop-access";
import { catalogPageSchema, categoryQuerySchema } from "@lib/contracts/catalog";
import { listCategory } from "@lib/data/catalog";

/** One page of a category, for infinite scroll. */
export const GET = defineRoute({
  params: z.object({ slug: z.string().min(1).max(60) }),
  query: categoryQuerySchema,
  response: catalogPageSchema,
  handler: async ({ params, query }) => {
    // While the shop is hidden, only admins and staff get catalog data.
    if (!(await canSeeShop())) throw new HttpError("NOT_FOUND", "Not found");
    const page = await listCategory(params.slug, query.group, {
      stock: query.stock,
      sort: query.sort,
      cursor: query.cursor,
      limit: query.limit,
    });
    if (!page) throw new HttpError("NOT_FOUND", "Unknown category");
    return page;
  },
});
