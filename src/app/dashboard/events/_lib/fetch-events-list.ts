import { z } from "zod";

import { apiRoutes } from "@/lib/routes";

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
  const res = await fetch(
    apiRoutes.events.list({
      page: args.page,
      perPage: args.perPage,
      q: args.q,
      status: args.status,
      dateFrom: args.dateFrom,
      dateTo: args.dateTo,
      sortBy: args.sortBy,
      sortOrder: args.sortOrder,
    }),
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    },
  );

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

