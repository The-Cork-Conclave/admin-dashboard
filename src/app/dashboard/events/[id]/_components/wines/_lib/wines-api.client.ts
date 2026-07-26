"use client";

import { authFetch } from "@/lib/auth/auth-fetch";

export type EventWineListItem = {
  event_wine_id: string;
  wine_id: string;
  name: string;
  producer: string;
  color: string;
  wine_type: string;
  year?: number | null;
  country?: string | null;
  region?: string | null;
  grape_variety?: string | null;
  alcohol_level?: number | null;
  image_url?: string | null;
  average_rating: number;
  review_count: number;
  announced_at: string;
};

export type EventWinesListResponse = {
  wines: EventWineListItem[];
  total_reviews: number;
  average_rating: number;
  wines_count: number;
};

export type AnnounceEventWinePayload = {
  name: string;
  producer: string;
  wine_type: string;
  year?: number | null;
  country?: string | null;
  region?: string | null;
  grape_variety?: string | null;
  alcohol_level?: number | null;
  image_url?: string | null;
};

export type AnnounceEventWineResponse = {
  wine: EventWineListItem;
};

export type WineReviewItem = {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment?: string | null;
  created_at: string;
};

export type EventWineDetailResponse = EventWineListItem & {
  reviews: WineReviewItem[];
};

export type WineCatalogItem = {
  id: string;
  name: string;
  producer: string;
  color: string;
  wine_type: string;
  year?: number | null;
  country?: string | null;
  region?: string | null;
  grape_variety?: string | null;
  alcohol_level?: number | null;
  image_url?: string | null;
};

export type WineCatalogSearchResponse = {
  wines: WineCatalogItem[];
};

export class WinesApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "WinesApiError";
    this.status = status;
  }
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    if (typeof body?.message === "string" && body.message.trim()) return body.message.trim();
  } catch {
    // ignore
  }
  return fallback;
}

export async function fetchEventWines(eventId: string): Promise<EventWinesListResponse> {
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/wines`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new WinesApiError(await parseErrorMessage(res, "Could not load wines."), res.status);
  }

  return (await res.json()) as EventWinesListResponse;
}

export async function announceEventWine(
  eventId: string,
  payload: AnnounceEventWinePayload,
): Promise<AnnounceEventWineResponse> {
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/wines`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new WinesApiError(await parseErrorMessage(res, "Could not announce wine. Please try again."), res.status);
  }

  return (await res.json()) as AnnounceEventWineResponse;
}

export async function fetchEventWineDetail(eventId: string, eventWineId: string): Promise<EventWineDetailResponse> {
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/wines/${encodeURIComponent(eventWineId)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new WinesApiError(await parseErrorMessage(res, "Could not load wine details."), res.status);
  }

  return (await res.json()) as EventWineDetailResponse;
}

export async function searchWinesCatalog(args: {
  q: string;
  limit?: number;
  excludeEventId?: string;
}): Promise<WineCatalogSearchResponse> {
  const sp = new URLSearchParams();
  sp.set("q", args.q);
  if (args.limit != null) sp.set("limit", String(args.limit));
  if (args.excludeEventId?.trim()) sp.set("exclude_event_id", args.excludeEventId.trim());

  const res = await authFetch(`/api/wines?${sp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new WinesApiError(await parseErrorMessage(res, "Could not search wines."), res.status);
  }

  return (await res.json()) as WineCatalogSearchResponse;
}
