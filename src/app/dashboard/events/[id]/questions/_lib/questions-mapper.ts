"use client";

import type { DraftQuestion, DraftQuestionOption } from "@/app/dashboard/events/new/_components/constants";
import type { QuestionType } from "@/lib/event-questions";

import type { EventQuestionDTO, EventQuestionOptionDTO } from "./questions-api.client";
import {
  createEventQuestionOption,
  deleteEventQuestionOption,
  updateEventQuestionOption,
} from "./questions-api.client";

export function apiQuestionToDraft(q: EventQuestionDTO): DraftQuestion {
  return {
    clientId: q.id,
    question: q.question,
    type: q.type as QuestionType,
    is_required: q.is_required,
    sort_order: q.sort_order,
    options:
      q.options?.map((o) => ({
        id: o.id,
        value: o.value,
        sort_order: o.sort_order,
      })) ?? [],
  };
}

export function draftToCreatePayload(q: DraftQuestion) {
  const base = {
    question: q.question,
    type: q.type,
    is_required: q.is_required,
    sort_order: q.sort_order,
  };

  if (q.type === "single_choice" || q.type === "multiple_choice") {
    return {
      ...base,
      options: (q.options ?? []).map((opt) => ({
        value: opt.value,
        sort_order: opt.sort_order,
      })),
    };
  }

  return base;
}

export function draftToUpdatePayload(q: DraftQuestion) {
  return {
    question: q.question,
    type: q.type,
    is_required: q.is_required,
    sort_order: q.sort_order,
  };
}

function byId(list: EventQuestionOptionDTO[]): Map<string, EventQuestionOptionDTO> {
  return new Map(list.map((o) => [o.id, o]));
}

function isServerUUID(id: string): boolean {
  // our draft uses server ids on existing events; new drafts are crypto.randomUUID() too,
  // so we cannot distinguish by shape. We treat any id not found in `before` as "new".
  return Boolean(id);
}

export async function syncQuestionOptions({
  eventId,
  questionId,
  before,
  after,
}: {
  eventId: string;
  questionId: string;
  before: EventQuestionOptionDTO[];
  after: DraftQuestionOption[];
}): Promise<void> {
  const beforeMap = byId(before);
  const afterIds = new Set(after.map((o) => o.id).filter(Boolean));

  // delete removed
  await Promise.all(
    before.filter((o) => !afterIds.has(o.id)).map((o) => deleteEventQuestionOption(eventId, questionId, o.id)),
  );

  // create or update
  for (const opt of after) {
    const existing = opt.id ? beforeMap.get(opt.id) : undefined;
    if (!existing && isServerUUID(opt.id)) {
      await createEventQuestionOption(eventId, questionId, {
        value: opt.value,
        sort_order: opt.sort_order,
      });
      continue;
    }
    if (!existing) {
      await createEventQuestionOption(eventId, questionId, {
        value: opt.value,
        sort_order: opt.sort_order,
      });
      continue;
    }
    if (existing.value !== opt.value || Number(existing.sort_order) !== Number(opt.sort_order)) {
      await updateEventQuestionOption(eventId, questionId, existing.id, {
        value: opt.value,
        sort_order: opt.sort_order,
      });
    }
  }
}
