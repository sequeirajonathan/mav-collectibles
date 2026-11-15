import { defineRoute, HttpError } from "@lib/api/define-route";
import { canSeeShop } from "@lib/shop-access";
import { catalogPageSchema, searchQuerySchema } from "@lib/contracts/catalog";
import { searchCatalog } from "@lib/data/catalog";

/** One page of catalog search results, for infinite scroll. */
export const GET = defineRoute({
  query: searchQuerySchema,
  response: catalogPageSchema,
  handler: async ({ query }) => {
    // While the shop is hidden, only admins and staff get catalog data.
    if (!(await canSeeShop())) throw new HttpError("NOT_FOUND", "Not found");
    return searchCatalog(query.query, { stock: query.stock, sort: query.sort, cursor: query.cursor, limit: query.limit });
  },
});
