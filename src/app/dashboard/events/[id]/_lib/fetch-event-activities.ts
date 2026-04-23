import { z } from "zod";
import { authFetch } from "@/lib/auth/auth-fetch";
import { activitySchema } from "../_components/insights/schema";

const eventActivitiesCursorSchema = z.object({
  id: z.string().min(1),
  created_at: z.string().min(1),
});

const eventActivitiesMetaSchema = z.object({
  limit: z.number().int().min(1),
  has_more: z.boolean(),
  next_cursor: eventActivitiesCursorSchema.optional(),
});

export const eventActivitiesResponseSchema = z.object({
  data: z.array(activitySchema),
  meta: eventActivitiesMetaSchema,
});

export type EventActivitiesResponse = z.infer<typeof eventActivitiesResponseSchema>;
export type EventActivitiesCursor = z.infer<typeof eventActivitiesCursorSchema>;

export async function fetchEventActivitiesPage(
  id: string,
  args: { limit: number; cursor?: EventActivitiesCursor },
): Promise<EventActivitiesResponse> {
  const sp = new URLSearchParams();
  sp.set("limit", String(args.limit));
  if (args.cursor) {
    sp.set("cursor_id", args.cursor.id);
    sp.set("cursor_created_at", args.cursor.created_at);
  }

  const res = await authFetch(`/api/events/${encodeURIComponent(id)}/activities?${sp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Failed to load event activities";
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
  return eventActivitiesResponseSchema.parse(json);
}

