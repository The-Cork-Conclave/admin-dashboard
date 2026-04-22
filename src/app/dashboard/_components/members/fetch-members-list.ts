import { z } from "zod";
import { authFetch } from "@/lib/auth/auth-fetch";

const listMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  per_page: z.number().int().min(1),
  total_pages: z.number().int().nonnegative(),
});

const usersListItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string(),
  phone_number: z.string(),
  verified_at: z.string(),
  number_of_events: z.number().int().nonnegative().optional(),
  created_at: z.string(),
});

export const usersListResponseSchema = z.object({
  data: z.array(usersListItemSchema),
  meta: listMetaSchema,
});

export type UsersListResponse = z.infer<typeof usersListResponseSchema>;
export type UserListItem = z.infer<typeof usersListItemSchema>;

export async function fetchUsersList(args: {
  page: number;
  perPage: number;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "created_at" | "name";
  sortOrder?: "asc" | "desc";
}): Promise<UsersListResponse> {
  const sp = new URLSearchParams();
  sp.set("page", String(args.page));
  sp.set("per_page", String(args.perPage));
  if (args.q?.trim()) sp.set("q", args.q.trim());
  if (args.dateFrom?.trim()) sp.set("date_from", args.dateFrom.trim());
  if (args.dateTo?.trim()) sp.set("date_to", args.dateTo.trim());
  if (args.sortBy) sp.set("sort_by", args.sortBy);
  if (args.sortOrder) sp.set("sort_order", args.sortOrder);

  const res = await authFetch("/api/users", {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Failed to load members";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) {
        message = body.message;
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json: unknown = await res.json();
  return usersListResponseSchema.parse(json);
}
