"use client";

import { z } from "zod";

import { authFetch } from "@/lib/auth/auth-fetch";

const listMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  per_page: z.number().int().min(1),
  total_pages: z.number().int().nonnegative(),
});

export const financeItemTypeSchema = z.enum(["expense", "income"]);

export const platformFinanceItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  type: financeItemTypeSchema,
  amount_in_kobo: z.number().int().nonnegative(),
  currency: z.string().min(1),
  category: z.string().nullable().optional(),
  item_date: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  receipt_url: z.string().nullable().optional(),
  paid_by: z.string().nullable().optional(),
  payment_method: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const financeSummarySchema = z.object({
  payments_total: z.number(),
  previous_revenue_in_kobo: z.number(),
  event_expenses_total: z.number(),
  non_event_income_total: z.number(),
  non_event_expense_total: z.number(),
  total_income: z.number(),
  total_expenses: z.number(),
  net: z.number(),
});

export const financeEventRowSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  status: z.string(),
  payments_total: z.number(),
  expenses_total: z.number(),
  previous_balance_in_kobo: z.number(),
  event_net: z.number(),
});

const financeEventsListSchema = z.object({
  data: z.array(financeEventRowSchema),
  meta: listMetaSchema,
});

const financeItemsListSchema = z.object({
  data: z.array(platformFinanceItemSchema),
  meta: listMetaSchema,
});

const createFinanceItemResponseSchema = z.object({
  item: platformFinanceItemSchema,
});

const updateFinanceItemResponseSchema = z.object({
  item: platformFinanceItemSchema,
});

export type FinanceSummaryDTO = z.infer<typeof financeSummarySchema>;
export type FinanceEventRowDTO = z.infer<typeof financeEventRowSchema>;
export type PlatformFinanceItemDTO = z.infer<typeof platformFinanceItemSchema>;
export type FinanceItemType = z.infer<typeof financeItemTypeSchema>;

function errorMessage(defaultMessage: string, body: unknown) {
  return typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string" &&
    body.message.length > 0
    ? body.message
    : defaultMessage;
}

export async function getFinanceSummary(): Promise<FinanceSummaryDTO> {
  const res = await authFetch("/api/finance/summary", { method: "GET" });
  if (!res.ok) {
    let message = "Could not load finance summary.";
    try {
      message = errorMessage(message, await res.json());
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return financeSummarySchema.parse(await res.json());
}

export async function listFinanceEvents(input: {
  page: number;
  perPage: number;
  q?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<z.infer<typeof financeEventsListSchema>> {
  const sp = new URLSearchParams({
    page: String(input.page),
    per_page: String(input.perPage),
  });
  if (input.q) sp.set("q", input.q);
  if (input.sortBy) sp.set("sort_by", input.sortBy);
  if (input.sortOrder) sp.set("sort_order", input.sortOrder);

  const res = await authFetch(`/api/finance/events?${sp}`, { method: "GET" });
  if (!res.ok) {
    let message = "Could not load event finance.";
    try {
      message = errorMessage(message, await res.json());
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return financeEventsListSchema.parse(await res.json());
}

export async function listFinanceItems(input: {
  page: number;
  perPage: number;
  q?: string;
  type?: FinanceItemType | "all";
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<z.infer<typeof financeItemsListSchema>> {
  const sp = new URLSearchParams({
    page: String(input.page),
    per_page: String(input.perPage),
  });
  if (input.q) sp.set("q", input.q);
  if (input.type && input.type !== "all") sp.set("type", input.type);
  if (input.dateFrom) sp.set("date_from", input.dateFrom);
  if (input.dateTo) sp.set("date_to", input.dateTo);
  if (input.sortBy) sp.set("sort_by", input.sortBy);
  if (input.sortOrder) sp.set("sort_order", input.sortOrder);

  const res = await authFetch(`/api/finance/items?${sp}`, { method: "GET" });
  if (!res.ok) {
    let message = "Could not load finance items.";
    try {
      message = errorMessage(message, await res.json());
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return financeItemsListSchema.parse(await res.json());
}

export type CreateFinanceItemInput = {
  title: string;
  type: FinanceItemType;
  amount_in_kobo: number;
  description?: string;
  currency?: string;
  category?: string;
  item_date?: string;
  vendor_name?: string;
  receipt_url?: string;
  paid_by?: string;
  payment_method?: string;
};

export async function createFinanceItem(input: CreateFinanceItemInput): Promise<PlatformFinanceItemDTO> {
  const res = await authFetch("/api/finance/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let message = "Could not create finance item.";
    try {
      message = errorMessage(message, await res.json());
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return createFinanceItemResponseSchema.parse(await res.json()).item;
}

export async function updateFinanceItem(
  id: string,
  input: Partial<CreateFinanceItemInput>,
): Promise<PlatformFinanceItemDTO> {
  const res = await authFetch(`/api/finance/items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let message = "Could not update finance item.";
    try {
      message = errorMessage(message, await res.json());
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return updateFinanceItemResponseSchema.parse(await res.json()).item;
}

export async function deleteFinanceItem(id: string): Promise<void> {
  const res = await authFetch(`/api/finance/items/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    let message = "Could not delete finance item.";
    try {
      message = errorMessage(message, await res.json());
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}
