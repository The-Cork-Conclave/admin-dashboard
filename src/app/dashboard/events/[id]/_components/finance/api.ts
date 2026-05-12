import { z } from "zod";

import { authFetch } from "@/lib/auth/auth-fetch";

import { getEventMetrics, type MetricsDTO } from "../insights/api";

const listMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  per_page: z.number().int().min(1),
  total_pages: z.number().int().nonnegative(),
});

const eventExpensesTotalItemSchema = z.object({
  currency: z.string().min(1),
  total_amount_in_kobo: z.number(),
});

const eventExpenseSchema = z.object({
  id: z.string().min(1),
  event_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  amount_in_kobo: z.number().int().nonnegative(),
  currency: z.string().min(1),
  category: z.string().nullable().optional(),
  expense_date: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  receipt_url: z.string().nullable().optional(),
  paid_by: z.string().nullable().optional(),
  payment_method: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

const eventExpensesListResponseSchema = z.object({
  data: z.array(eventExpenseSchema),
  meta: listMetaSchema,
});

const createEventExpenseRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount_in_kobo: z.number().int().nonnegative(),
  currency: z.string().min(1).optional(),
  category: z.string().optional(),
  expense_date: z.string().optional(),
  vendor_name: z.string().optional(),
  receipt_url: z.string().url().optional(),
  paid_by: z.string().optional(),
  payment_method: z.string().optional(),
});

const createEventExpenseResponseSchema = z.object({
  expense: eventExpenseSchema,
});

const updateEventExpenseRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  amount_in_kobo: z.number().int().nonnegative().optional(),
  currency: z.string().min(1).optional(),
  category: z.string().optional(),
  expense_date: z.string().optional(),
  vendor_name: z.string().optional(),
  receipt_url: z.string().url().optional(),
  paid_by: z.string().optional(),
  payment_method: z.string().optional(),
});

const updateEventExpenseResponseSchema = z.object({
  expense: eventExpenseSchema,
});

const eventExpensesTotalResponseSchema = z.object({
  data: z.array(eventExpensesTotalItemSchema),
});

export type CreateEventExpenseInput = z.infer<typeof createEventExpenseRequestSchema>;
export type CreateEventExpenseResponseDTO = z.infer<typeof createEventExpenseResponseSchema>;
export type EventExpenseDTO = z.infer<typeof eventExpenseSchema>;
export type EventExpensesTotalItemDTO = z.infer<typeof eventExpensesTotalItemSchema>;
export type EventExpensesListResponseDTO = z.infer<typeof eventExpensesListResponseSchema>;
export type EventExpensesTotalResponseDTO = z.infer<typeof eventExpensesTotalResponseSchema>;
export type UpdateEventExpenseInput = z.infer<typeof updateEventExpenseRequestSchema>;
export type UpdateEventExpenseResponseDTO = z.infer<typeof updateEventExpenseResponseSchema>;

export type EventFinanceSummaryDTO = {
  expensesInKobo: number;
  metrics: MetricsDTO;
  netBalanceInKobo: number;
  revenueInKobo: number;
};

export type EventExpensesListSortBy = "created_at" | "expense_date" | "amount_in_kobo" | "title";
export type EventExpensesListSortOrder = "asc" | "desc";

export type GetEventExpensesListInput = {
  page: number;
  perPage: number;
  q?: string;
  sortBy?: EventExpensesListSortBy;
  sortOrder?: EventExpensesListSortOrder;
};

function getErrorMessageFallback(defaultMessage: string, body: unknown) {
  return typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string" &&
    body.message.length > 0
    ? body.message
    : defaultMessage;
}

export async function getEventExpensesTotal(id: string): Promise<EventExpensesTotalResponseDTO> {
  const res = await authFetch(`/api/events/${encodeURIComponent(id)}/expenses/total`, { method: "GET" });

  if (!res.ok) {
    let message = "Could not load event expenses total.";
    try {
      message = getErrorMessageFallback(message, (await res.json()) as unknown);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return eventExpensesTotalResponseSchema.parse(json);
}

export async function getEventExpensesList(
  id: string,
  { page, perPage, q, sortBy, sortOrder }: GetEventExpensesListInput,
): Promise<EventExpensesListResponseDTO> {
  const sp = new URLSearchParams();
  sp.set("page", String(page));
  sp.set("per_page", String(perPage));
  if (q?.trim()) sp.set("q", q.trim());
  if (sortBy) sp.set("sort_by", sortBy);
  if (sortOrder) sp.set("sort_order", sortOrder);

  const res = await authFetch(`/api/events/${encodeURIComponent(id)}/expenses?${sp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Could not load event expenses.";
    try {
      message = getErrorMessageFallback(message, (await res.json()) as unknown);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return eventExpensesListResponseSchema.parse(json);
}

export async function createEventExpense(
  id: string,
  input: CreateEventExpenseInput,
): Promise<CreateEventExpenseResponseDTO> {
  const payload = createEventExpenseRequestSchema.parse(input);

  const res = await authFetch(`/api/events/${encodeURIComponent(id)}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Could not create event expense.";
    try {
      message = getErrorMessageFallback(message, (await res.json()) as unknown);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return createEventExpenseResponseSchema.parse(json);
}

export async function updateEventExpense(
  eventId: string,
  expenseId: string,
  input: UpdateEventExpenseInput,
): Promise<UpdateEventExpenseResponseDTO> {
  const payload = updateEventExpenseRequestSchema.parse(input);

  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/expenses/${encodeURIComponent(expenseId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Could not update event expense.";
    try {
      message = getErrorMessageFallback(message, (await res.json()) as unknown);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return updateEventExpenseResponseSchema.parse(json);
}

export async function deleteEventExpense(eventId: string, expenseId: string): Promise<void> {
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/expenses/${encodeURIComponent(expenseId)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Could not delete event expense.";
    try {
      message = getErrorMessageFallback(message, (await res.json()) as unknown);
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}

export async function getEventFinanceSummary(id: string): Promise<EventFinanceSummaryDTO> {
  const [metrics, expensesTotal] = await Promise.all([getEventMetrics(id), getEventExpensesTotal(id)]);

  const expensesInKobo =
    expensesTotal.data.find((item) => item.currency.toUpperCase() === "NGN")?.total_amount_in_kobo ?? 0;
  const revenueInKobo = metrics.total_received;

  return {
    expensesInKobo,
    metrics,
    netBalanceInKobo: revenueInKobo - expensesInKobo,
    revenueInKobo,
  };
}
