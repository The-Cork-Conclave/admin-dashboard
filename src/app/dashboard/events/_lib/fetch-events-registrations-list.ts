import { z } from "zod";
import { authFetch } from "@/lib/auth/auth-fetch";

const listMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  per_page: z.number().int().min(1),
  total_pages: z.number().int().nonnegative(),
});

const eventRegistrationListItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string(),
  user_id: z.string(),
  status: z.string(),
  confirmed_at: z.string().optional(),
  checked_in_at: z.string().nullable().optional(),
  created_at: z.string(),
});

export const eventRegistrationListResponseSchema = z.object({
  data: z.array(eventRegistrationListItemSchema),
  meta: listMetaSchema,
});

export type EventRegistrationListResponse = z.infer<typeof eventRegistrationListResponseSchema>;
export type EventRegistrationListItem = z.infer<typeof eventRegistrationListItemSchema>;

export async function fetchEventRegistrationsList(
  id: string,
  args: {
    page: number;
    perPage: number;
    q?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: "created_at" | "name";
    sortOrder?: "asc" | "desc";
  },
): Promise<EventRegistrationListResponse> {
  const sp = new URLSearchParams();
  sp.set("page", String(args.page));
  sp.set("per_page", String(args.perPage));
  if (args.q?.trim()) sp.set("q", args.q.trim());
  if (args.status?.trim()) sp.set("status", args.status.trim());
  if (args.dateFrom?.trim()) sp.set("date_from", args.dateFrom.trim());
  if (args.dateTo?.trim()) sp.set("date_to", args.dateTo.trim());
  if (args.sortBy) sp.set("sort_by", args.sortBy);
  if (args.sortOrder) sp.set("sort_order", args.sortOrder);

  const res = await authFetch(`/api/events/${id}/registrations?${sp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Failed to load event registrations";
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
  return eventRegistrationListResponseSchema.parse(json);
}
