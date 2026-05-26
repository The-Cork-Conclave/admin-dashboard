"use client";

import { z } from "zod";

import { authFetch } from "@/lib/auth/auth-fetch";

const eventQuestionOptionSchema = z.object({
  id: z.string().min(1),
  question_id: z.string().min(1),
  value: z.string(),
  sort_order: z.number(),
});

export const eventQuestionSchema = z.object({
  id: z.string().min(1),
  event_id: z.string().min(1),
  question: z.string().min(1),
  type: z.enum(["yes_no", "text", "single_choice", "multiple_choice"]),
  is_required: z.boolean(),
  sort_order: z.number(),
  options: z.array(eventQuestionOptionSchema),
});

export type EventQuestionOptionDTO = z.infer<typeof eventQuestionOptionSchema>;
export type EventQuestionDTO = z.infer<typeof eventQuestionSchema>;

const eventQuestionListResponseSchema = z.object({
  data: z.array(eventQuestionSchema),
});

const eventQuestionResponseSchema = z.object({
  question: eventQuestionSchema,
});

const eventQuestionOptionResponseSchema = z.object({
  option: eventQuestionOptionSchema,
});

const createEventQuestionOptionInputSchema = z.object({
  value: z.string().min(1),
  sort_order: z.number().int().optional(),
});

const createEventQuestionInputSchema = z.object({
  question: z.string().min(1),
  type: z.enum(["yes_no", "text", "single_choice", "multiple_choice"]),
  is_required: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  options: z.array(createEventQuestionOptionInputSchema).optional(),
});

const updateEventQuestionInputSchema = z.object({
  question: z.string().min(1),
  type: z.enum(["yes_no", "text", "single_choice", "multiple_choice"]),
  is_required: z.boolean(),
  sort_order: z.number().int().optional(),
});

const updateEventQuestionOptionInputSchema = z.object({
  value: z.string().min(1),
  sort_order: z.number().int().optional(),
});

const reorderEventQuestionsRequestSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        sort_order: z.number().int(),
      }),
    )
    .min(1),
});

export type CreateEventQuestionInput = z.infer<typeof createEventQuestionInputSchema>;
export type UpdateEventQuestionInput = z.infer<typeof updateEventQuestionInputSchema>;
export type CreateEventQuestionOptionInput = z.infer<typeof createEventQuestionOptionInputSchema>;
export type UpdateEventQuestionOptionInput = z.infer<typeof updateEventQuestionOptionInputSchema>;
export type ReorderEventQuestionsInput = z.infer<typeof reorderEventQuestionsRequestSchema>;

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    if (typeof body?.message === "string" && body.message.trim()) return body.message.trim();
  } catch {
    // ignore
  }
  return fallback;
}

export async function fetchEventQuestions(eventId: string): Promise<EventQuestionDTO[]> {
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/questions`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Could not load questions. Please try again."));
  }

  const json = (await res.json()) as unknown;
  return eventQuestionListResponseSchema.parse(json).data;
}

export async function createEventQuestion(eventId: string, input: CreateEventQuestionInput): Promise<EventQuestionDTO> {
  const payload = createEventQuestionInputSchema.parse(input);
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Could not create question. Please try again."));
  }

  const json = (await res.json()) as unknown;
  return eventQuestionResponseSchema.parse(json).question;
}

export async function updateEventQuestion(
  eventId: string,
  questionId: string,
  input: UpdateEventQuestionInput,
): Promise<EventQuestionDTO> {
  const payload = updateEventQuestionInputSchema.parse(input);
  const res = await authFetch(
    `/api/events/${encodeURIComponent(eventId)}/questions/${encodeURIComponent(questionId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Could not update question. Please try again."));
  }

  const json = (await res.json()) as unknown;
  return eventQuestionResponseSchema.parse(json).question;
}

export async function deleteEventQuestion(eventId: string, questionId: string): Promise<void> {
  const res = await authFetch(
    `/api/events/${encodeURIComponent(eventId)}/questions/${encodeURIComponent(questionId)}`,
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
    },
  );

  if (res.status === 204) return;
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Could not delete question. Please try again."));
  }
}

export async function reorderEventQuestions(eventId: string, input: ReorderEventQuestionsInput): Promise<void> {
  const payload = reorderEventQuestionsRequestSchema.parse(input);
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/questions/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.status === 204) return;
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Could not reorder questions. Please try again."));
  }
}

export async function createEventQuestionOption(
  eventId: string,
  questionId: string,
  input: CreateEventQuestionOptionInput,
): Promise<EventQuestionOptionDTO> {
  const payload = createEventQuestionOptionInputSchema.parse(input);
  const res = await authFetch(
    `/api/events/${encodeURIComponent(eventId)}/questions/${encodeURIComponent(questionId)}/options`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Could not create option. Please try again."));
  }

  const json = (await res.json()) as unknown;
  return eventQuestionOptionResponseSchema.parse(json).option;
}

export async function updateEventQuestionOption(
  eventId: string,
  questionId: string,
  optionId: string,
  input: UpdateEventQuestionOptionInput,
): Promise<EventQuestionOptionDTO> {
  const payload = updateEventQuestionOptionInputSchema.parse(input);
  const res = await authFetch(
    `/api/events/${encodeURIComponent(eventId)}/questions/${encodeURIComponent(questionId)}/options/${encodeURIComponent(optionId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Could not update option. Please try again."));
  }

  const json = (await res.json()) as unknown;
  return eventQuestionOptionResponseSchema.parse(json).option;
}

export async function deleteEventQuestionOption(eventId: string, questionId: string, optionId: string): Promise<void> {
  const res = await authFetch(
    `/api/events/${encodeURIComponent(eventId)}/questions/${encodeURIComponent(questionId)}/options/${encodeURIComponent(optionId)}`,
    { method: "DELETE", headers: { Accept: "application/json" } },
  );

  if (res.status === 204) return;
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Could not delete option. Please try again."));
  }
}
