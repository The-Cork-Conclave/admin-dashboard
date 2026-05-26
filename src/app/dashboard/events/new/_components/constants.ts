import { z } from "zod";

import { authFetch } from "@/lib/auth/auth-fetch";
import {
  multiple_choice,
  type QuestionType,
  question_types,
  questionTypeLabel,
  single_choice,
  text,
  yes_no,
} from "@/lib/event-questions";

export { multiple_choice, type QuestionType, question_types, questionTypeLabel, single_choice, text, yes_no };

export const sharpInputClassName = "rounded-md border-foreground/25";

export const formSchema = z.object({
  name: z.string().min(1, { message: "Please enter an event name." }),
  image_url: z
    .string()
    .min(1, { message: "Please upload an event image." })
    .url({ message: "Please upload a valid image URL." }),
  description: z.string().optional(),
  welcome_text: z.string().optional(),
  dress_code: z.string().optional(),
  entry_fee: z.string().optional(),
  event_date: z.string().min(1, { message: "Please select an event date." }),
  amount_in_kobo: z.string().refine((v) => v.trim() === "" || /^\d+$/.test(v.trim()), {
    message: "Amount must be a whole number (naira, stored as kobo on the server).",
  }),
  venue_name: z.string().min(1, { message: "Please enter a venue name." }),
  venue_address: z.string().optional(),
  registration_opens_at: z.string().optional(),
  registration_closes_at: z.string().optional(),
});

export type FormInput = z.infer<typeof formSchema>;

export type DraftQuestionOption = {
  id: string;
  value: string;
  sort_order: number;
};

export type DraftQuestion = {
  clientId: string;
  question: string;
  type: QuestionType;
  is_required: boolean;
  sort_order: number;
  options?: DraftQuestionOption[];
};

export type CreateEventResponse = {
  id: string;
};

export function reindexQuestions(questions: DraftQuestion[]): DraftQuestion[] {
  return questions.map((q, index) => ({
    ...q,
    sort_order: index,
    options: q.options?.map((opt, optIndex) => ({ ...opt, sort_order: optIndex })),
  }));
}

export function newDraftQuestionOption(): DraftQuestionOption {
  return {
    id: crypto.randomUUID(),
    value: "",
    sort_order: 0,
  };
}

export function newDraftQuestion(): DraftQuestion {
  return {
    clientId: crypto.randomUUID(),
    question: "",
    type: text,
    is_required: false,
    sort_order: 0,
    options: [newDraftQuestionOption(), newDraftQuestionOption()],
  };
}

function toRFC3339FromDatetimeLocal(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

function eventInstantFromForm(eventDateLocal: string): Date | null {
  const d = new Date(eventDateLocal);
  return Number.isNaN(d.getTime()) ? null : d;
}

function defaultRegistrationOpensIso(eventInstant: Date): string {
  const d = new Date(eventInstant);
  d.setDate(d.getDate() - 21);
  return d.toISOString();
}

function defaultRegistrationClosesIso(eventInstant: Date): string {
  const d = new Date(eventInstant);
  d.setDate(d.getDate() - 1);
  return d.toISOString();
}

export async function postCreateEvent({
  event,
  questions,
}: {
  event: FormInput;
  questions: DraftQuestion[];
}): Promise<CreateEventResponse> {
  const input = event;
  const eventInstant = eventInstantFromForm(input.event_date);
  if (!eventInstant) {
    throw new Error("Invalid event date.");
  }

  const registrationOpensAt = input.registration_opens_at?.trim()
    ? toRFC3339FromDatetimeLocal(input.registration_opens_at)
    : defaultRegistrationOpensIso(eventInstant);

  const registrationClosesAt = input.registration_closes_at?.trim()
    ? toRFC3339FromDatetimeLocal(input.registration_closes_at)
    : defaultRegistrationClosesIso(eventInstant);

  const apiQuestions =
    questions.length > 0
      ? questions.map((q, index) => {
          const base = {
            question: q.question.trim(),
            type: q.type,
            is_required: q.is_required,
            sort_order: q.sort_order ?? index,
          };

          if (q.type === single_choice || q.type === multiple_choice) {
            return {
              ...base,
              options: (q.options ?? []).map((opt, optIndex) => ({
                value: opt.value.trim(),
                sort_order: opt.sort_order ?? optIndex,
              })),
            };
          }

          return base;
        })
      : undefined;

  const payload = {
    name: input.name,
    image_url: input.image_url.trim(),
    description: input.description?.trim() ? input.description.trim() : undefined,
    welcome_text: input.welcome_text?.trim() ? input.welcome_text.trim() : undefined,
    dress_code: input.dress_code?.trim() ? input.dress_code.trim() : undefined,
    entry_fee: input.entry_fee?.trim() ? input.entry_fee.trim() : undefined,
    event_date: toRFC3339FromDatetimeLocal(input.event_date),
    venue_name: input.venue_name,
    venue_address: input.venue_address?.trim() ? input.venue_address.trim() : undefined,
    amount_in_kobo: (input.amount_in_kobo ?? "").trim() || "0",
    registration_opens_at: registrationOpensAt,
    registration_closes_at: registrationClosesAt,
    questions: apiQuestions,
  };

  const res = await authFetch("/api/events", {
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
  const parsed = z.object({ id: z.string().min(1) }).safeParse(json);
  if (!parsed.success) {
    throw new Error("Event created, but received an unexpected response.");
  }
  return { id: parsed.data.id };
}
