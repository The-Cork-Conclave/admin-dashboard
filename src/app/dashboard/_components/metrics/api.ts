"use client";

import { z } from "zod";
import { authFetch } from "@/lib/auth/auth-fetch";

export const revenueMetricsDTOSchema = z.object({
  total: z.number(),
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
  attendance_vs_all_registrations: z.number(),
  attendance_vs_confirmed_registrations: z.number(),
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
