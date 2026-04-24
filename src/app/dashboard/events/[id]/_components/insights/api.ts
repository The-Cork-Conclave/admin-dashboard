import { z } from "zod";

import { authFetch } from "@/lib/auth/auth-fetch";

const graphItemSchema = z.object({
  label: z.string(),
  value: z.number(),
});

export const metricsDTOSchema = z.object({
  total_received: z.number(),
  total_registrations: z.number(),
  total_tickets: z.number(),
  total_attendees: z.number(),
  total_no_shows: z.number(),
  registrations: z.array(graphItemSchema),
  payments: z.array(graphItemSchema),
  reg_to_payment_conversion: z.number(),
  payment_to_attendance_conversion: z.number(),
  average_time_to_payment: z.number(),
});

export type MetricsDTO = z.infer<typeof metricsDTOSchema>;

export type GetEventMetricsResponse = z.infer<typeof metricsDTOSchema>;

export async function getEventMetrics(id: string): Promise<GetEventMetricsResponse> {
  const res = await authFetch(`/api/events/${encodeURIComponent(id)}/metrics`, { method: "GET" });

  if (!res.ok) {
    let message = "Could not load event metrics.";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return metricsDTOSchema.parse(json);
}
