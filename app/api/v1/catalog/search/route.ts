import { defineRoute } from "@lib/api/define-route";
import { catalogPageSchema, searchQuerySchema } from "@lib/contracts/catalog";
import { searchCatalog } from "@lib/data/catalog";

/** One page of catalog search results, for infinite scroll. */
export const GET = defineRoute({
  query: searchQuerySchema,
  response: catalogPageSchema,
  handler: ({ query }) =>
    searchCatalog(query.query, { stock: query.stock, sort: query.sort, cursor: query.cursor, limit: query.limit }),
});
