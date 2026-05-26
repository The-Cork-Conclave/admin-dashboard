import { z } from "zod";

import { authFetch } from "@/lib/auth/auth-fetch";

const listMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  per_page: z.number().int().min(1),
  total_pages: z.number().int().nonnegative(),
});

const eventListItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string(),
  description: z.string(),
  event_date: z.string(),
  venue_name: z.string(),
  venue_address: z.string(),
  amount_in_kobo: z.string(),
  status: z.string(),
  registration_opens_at: z.string(),
  registration_closes_at: z.string(),
  created_at: z.string(),
  image_url: z.string().optional(),
});

export const eventsListResponseSchema = z.object({
  data: z.array(eventListItemSchema),
  meta: listMetaSchema,
});

export type EventsListResponse = z.infer<typeof eventsListResponseSchema>;
export type EventListItem = z.infer<typeof eventListItemSchema>;

export async function fetchEventsList(args: {
  page: number;
  perPage: number;
  q?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "created_at" | "name";
  sortOrder?: "asc" | "desc";
}): Promise<EventsListResponse> {
  const sp = new URLSearchParams();
  sp.set("page", String(args.page));
  sp.set("per_page", String(args.perPage));
  if (args.q?.trim()) sp.set("q", args.q.trim());
  if (args.status?.trim()) sp.set("status", args.status.trim());
  if (args.dateFrom?.trim()) sp.set("date_from", args.dateFrom.trim());
  if (args.dateTo?.trim()) sp.set("date_to", args.dateTo.trim());
  if (args.sortBy) sp.set("sort_by", args.sortBy);
  if (args.sortOrder) sp.set("sort_order", args.sortOrder);

  const res = await authFetch(`/api/events?${sp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Failed to load events";
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
  return eventsListResponseSchema.parse(json);
}
