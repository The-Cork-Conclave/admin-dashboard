"use client";

import { z } from "zod";

import { authFetch } from "@/lib/auth/auth-fetch";

export const eventDTOSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string(),
  description: z.string(),
  welcome_text: z.string().nullable().optional(),
  dress_code: z.string().nullable().optional(),
  entry_fee: z.string().nullable().optional(),
  event_date: z.string(),
  venue_name: z.string(),
  venue_address: z.string(),
  amount_in_kobo: z.string(),
  status: z.string(),
  registration_opens_at: z.string(),
  registration_closes_at: z.string(),
  created_at: z.string(),
  image_url: z.string(),
  checked_in_count: z.number().optional(),
});

export type EventDTO = z.infer<typeof eventDTOSchema>;

const getEventResponseSchema = z.object({ event: eventDTOSchema });

export type GetEventResponse = z.infer<typeof getEventResponseSchema>;

export async function getEventClient(id: string): Promise<GetEventResponse> {
  const res = await authFetch(`/api/events/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Could not load event. Please try again.";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return getEventResponseSchema.parse(json);
}
