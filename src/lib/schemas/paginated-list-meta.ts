import z from "zod";

/** Standard `meta` block for paginated list APIs (`total`, `page`, `per_page`, `total_pages`). */
export const paginatedListMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
});

export type PaginatedListMeta = z.infer<typeof paginatedListMetaSchema>;
