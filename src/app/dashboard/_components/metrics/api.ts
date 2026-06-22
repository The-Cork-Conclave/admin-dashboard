"use client";

import { z } from "zod";

import { authFetch } from "@/lib/auth/auth-fetch";

export const revenueMetricsDTOSchema = z.object({
  total: z.number(),
  payments_total: z.number(),
  previous_revenue_in_kobo: z.number(),
  total_revenue_in_kobo: z.number(),
  delta: z.number(),
});

export const membersMetricsDTOSchema = z.object({
  total: z.number(),
  delta: z.number(),
});

export const ticketsMetricsDTOSchema = z.object({
  total: z.number(),
  delta: z.number(),
});

export const attendanceMetricsDTOSchema = z.object({
  total: z.number(),
  delta: z.number(),
});

export type RevenueMetricsDTO = z.infer<typeof revenueMetricsDTOSchema>;
export type MembersMetricsDTO = z.infer<typeof membersMetricsDTOSchema>;
export type TicketsMetricsDTO = z.infer<typeof ticketsMetricsDTOSchema>;
export type AttendanceMetricsDTO = z.infer<typeof attendanceMetricsDTOSchema>;

export type GetRevenueMetricsResponse = z.infer<typeof revenueMetricsDTOSchema>;
export type GetMembersMetricsResponse = z.infer<typeof membersMetricsDTOSchema>;
export type GetTicketsMetricsResponse = z.infer<typeof ticketsMetricsDTOSchema>;
export type GetAttendanceMetricsResponse = z.infer<typeof attendanceMetricsDTOSchema>;

export async function getRevenueMetrics(): Promise<GetRevenueMetricsResponse> {
  const res = await authFetch(`/api/metrics/revenue`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Could not load metrics. Please try again.";

    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return revenueMetricsDTOSchema.parse(json);
}

const updatePlatformRevenueAdjustmentRequestSchema = z.object({
  previous_revenue_in_kobo: z.number().int().min(0),
});

export type UpdatePlatformRevenueAdjustmentInput = z.infer<typeof updatePlatformRevenueAdjustmentRequestSchema>;

export async function updatePlatformRevenueAdjustment(
  input: UpdatePlatformRevenueAdjustmentInput,
): Promise<GetRevenueMetricsResponse> {
  const payload = updatePlatformRevenueAdjustmentRequestSchema.parse(input);
  const res = await authFetch(`/api/metrics/revenue/adjustment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Could not update opening revenue. Please try again.";
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return revenueMetricsDTOSchema.parse(json);
}

export async function getMembersMetrics(): Promise<GetMembersMetricsResponse> {
  const res = await authFetch(`/api/metrics/members`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Could not load metrics. Please try again.";

    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return membersMetricsDTOSchema.parse(json);
}

export async function getTicketsMetrics(): Promise<GetTicketsMetricsResponse> {
  const res = await authFetch(`/api/metrics/tickets`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Could not load metrics. Please try again.";

    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return ticketsMetricsDTOSchema.parse(json);
}

export async function getAttendanceMetrics(): Promise<GetAttendanceMetricsResponse> {
  const res = await authFetch(`/api/metrics/attendance`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    let message = "Could not load metrics. Please try again.";

    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string" && body.message.length > 0) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const json = (await res.json()) as unknown;
  return attendanceMetricsDTOSchema.parse(json);
}
