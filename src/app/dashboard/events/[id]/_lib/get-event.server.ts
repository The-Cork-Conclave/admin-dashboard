import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { AUTH_COOKIES, getApiBaseUrl } from "@/lib/constants/auth";

export const eventDTOSchema = z.object({
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
});

export type EventDTO = z.infer<typeof eventDTOSchema>;

const getEventResponseSchema = z.object({ event: eventDTOSchema });

export type GetEventResponse = z.infer<typeof getEventResponseSchema>;

function cookieHeader(k: string, v: string): string {
  return `${k}=${encodeURIComponent(v)}`;
}

export async function getEventServer(id: string): Promise<GetEventResponse> {
  const cookieStore = await cookies();
  const access = cookieStore.get(AUTH_COOKIES.accessToken)?.value?.trim() ?? "";
  const apiBase = getApiBaseUrl();

  const res = await fetch(`${apiBase}/events/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(access ? { Cookie: cookieHeader(AUTH_COOKIES.accessToken, access) } : {}),
    },
    cache: "no-store",
    redirect: "manual",
  });

  if (!res.ok) {
    let message = "Could not load event.";
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

