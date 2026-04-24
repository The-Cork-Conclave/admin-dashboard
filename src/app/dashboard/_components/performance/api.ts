"use client";

import { z } from "zod";
import { authFetch } from "@/lib/auth/auth-fetch";

const graphSeriesItemSchema = z.object({
  label: z.string(),
  value: z.number(),
});

export const signupGraphDTOSchema = z.object({
  data: z.array(graphSeriesItemSchema),
});

export type SignupGraphDTO = z.infer<typeof signupGraphDTOSchema>;
export type GetSignupGraphResponse = z.infer<typeof signupGraphDTOSchema>;

export async function getSignupGraph(): Promise<GetSignupGraphResponse> {
  const res = await authFetch(`/api/metrics/signup/graph`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Could not load metrics. Please try again.";

    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return signupGraphDTOSchema.parse(json);
}

export const eventsActivityDTOSchema = z.object({
  registrations: z.array(graphSeriesItemSchema),
  tickets: z.array(graphSeriesItemSchema),
});

export type EventsActivityDTO = z.infer<typeof eventsActivityDTOSchema>;

export type GetEventsActivityInput = {
  type: "month" | "year";
  value: string;
};

export async function getEventsActivity(input: GetEventsActivityInput): Promise<EventsActivityDTO> {
  const res = await authFetch(
    `/api/metrics/events/activity?type=${input.type}&value=${encodeURIComponent(input.value)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    let message = "Could not load metrics. Please try again.";

    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return eventsActivityDTOSchema.parse(json);
}
