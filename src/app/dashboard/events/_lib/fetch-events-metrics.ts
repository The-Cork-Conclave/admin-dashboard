import { z } from "zod";

import { authFetch } from "@/lib/auth/auth-fetch";

const eventsMetricsDataSchema = z.object({
  draft: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  closed: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  cancelled: z.number().int().nonnegative(),
});

export const eventsMetricsResponseSchema = z.object({
  data: eventsMetricsDataSchema,
});

export type EventsMetricsResponse = z.infer<typeof eventsMetricsResponseSchema>;
export type EventsMetricsData = z.infer<typeof eventsMetricsDataSchema>;

export async function fetchEventsMetrics(): Promise<EventsMetricsResponse> {
  const res = await authFetch("/api/events/metrics", {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Failed to load event metrics";
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
  return eventsMetricsResponseSchema.parse(json);
}
