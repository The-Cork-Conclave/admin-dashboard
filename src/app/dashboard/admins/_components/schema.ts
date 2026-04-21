import z from "zod";

import { paginatedListMetaSchema } from "@/lib/schemas/paginated-list-meta";

export const adminSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  verified_at: z.string(),
  created_at: z.string(),
});

export type AdminRow = z.infer<typeof adminSchema>;

export const adminsListResponseSchema = z.object({
  data: z.array(adminSchema),
  meta: paginatedListMetaSchema,
});

export type AdminsListResponse = z.infer<typeof adminsListResponseSchema>;
