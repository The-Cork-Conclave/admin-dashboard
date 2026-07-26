import { z } from "zod";

import { authFetch } from "@/lib/auth/auth-fetch";

const lastEventSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    event_date: z.string(),
  })
  .nullable()
  .optional();

const eventSchema = z.object({
  id: z.string(),
  name: z.string(),
  event_date: z.string(),
  status: z.enum(["checked_in", "no_show"]),
});

const reviewSchema = z.object({
  id: z.string(),
  wine_name: z.string(),
  producer: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
  event_id: z.string(),
  event_name: z.string(),
  created_at: z.string(),
});

export const memberDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone_number: z.string(),
  verified_at: z.string(),
  created_at: z.string(),
  events_attended: z.number().int().nonnegative(),
  wines_reviewed: z.number().int().nonnegative(),
  avg_rating: z.number(),
  last_event: lastEventSchema,
  events: z.array(eventSchema),
  reviews: z.array(reviewSchema),
});

export type MemberDetailDTO = z.infer<typeof memberDetailSchema>;
export type MemberEventDTO = z.infer<typeof eventSchema>;
export type MemberReviewDTO = z.infer<typeof reviewSchema>;

export type MemberUpdateInput = {
  name: string;
  email: string;
  phone_number: string;
};

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    if (typeof body.message === "string" && body.message.length > 0) {
      return body.message;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export async function getMember(id: string): Promise<MemberDetailDTO> {
  const res = await authFetch(`/api/users/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Could not load member."));
  }

  const json: unknown = await res.json();
  return memberDetailSchema.parse(json);
}

export async function updateMember(id: string, input: MemberUpdateInput): Promise<MemberDetailDTO> {
  const res = await authFetch(`/api/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Could not update member."));
  }

  const json: unknown = await res.json();
  return memberDetailSchema.parse(json);
}

export async function deleteMember(id: string): Promise<void> {
  const res = await authFetch(`/api/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Could not delete member."));
  }
}
