import { FormInput, CheckinResponse } from "./schema";
import { authFetch } from "@/lib/auth/auth-fetch";
import { z } from "zod";

export async function checkinAttendee(id: string, input: FormInput): Promise<CheckinResponse> {
  const payload = {
    access_code: input.access_code,
  };

  const res = await authFetch(`/api/events/${id}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Could not create event. Please try again.";
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

  const json = (await res.json()) as unknown;
  const parsed = z.object({ name: z.string(), ticket_id: z.string(), checkin_at: z.string() }).safeParse(json);
  if (!parsed.success) {
    throw new Error("Event created, but received an unexpected response.");
  }
  return { name: parsed.data.name, ticket_id: parsed.data.ticket_id, checkin_at: parsed.data.checkin_at };
}
