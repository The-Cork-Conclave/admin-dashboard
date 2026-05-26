"use client";

import { authFetch } from "@/lib/auth/auth-fetch";

export type GalleryItem = {
  id: string;
  event_id: string;
  url: string;
  caption?: string | null;
  alt?: string | null;
  public_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type GalleryListResponse = {
  data: GalleryItem[];
};

type CreateGalleryPayload = {
  url: string;
  caption?: string;
  alt?: string;
  public_id?: string;
};

type CreateGalleryResponse = {
  gallery: GalleryItem;
};

type UpdateGalleryPayload = {
  url: string;
  caption?: string;
  alt?: string;
  public_id?: string;
};

type UpdateGalleryResponse = {
  gallery: GalleryItem;
};

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    if (typeof body?.message === "string" && body.message.trim()) return body.message.trim();
  } catch {
    // ignore
  }
  return fallback;
}

export async function fetchEventGallery(eventId: string): Promise<GalleryListResponse> {
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/gallery`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Could not load gallery. Please try again."));
  }

  const json = (await res.json()) as unknown;
  if (!json || typeof json !== "object" || !("data" in json)) {
    throw new Error("Received an unexpected gallery response.");
  }
  return json as GalleryListResponse;
}

export async function postCreateGalleryItem(
  eventId: string,
  payload: CreateGalleryPayload,
): Promise<CreateGalleryResponse> {
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/gallery`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Could not create gallery item. Please try again."));
  }

  const json = (await res.json()) as unknown;
  if (!json || typeof json !== "object" || !("gallery" in json)) {
    throw new Error("Gallery item created, but received an unexpected response.");
  }
  return json as CreateGalleryResponse;
}

export async function patchUpdateGalleryItem(
  eventId: string,
  galleryId: string,
  payload: UpdateGalleryPayload,
): Promise<UpdateGalleryResponse> {
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/gallery/${encodeURIComponent(galleryId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Could not update gallery item. Please try again."));
  }

  const json = (await res.json()) as unknown;
  if (!json || typeof json !== "object" || !("gallery" in json)) {
    throw new Error("Gallery item updated, but received an unexpected response.");
  }
  return json as UpdateGalleryResponse;
}

export async function deleteGalleryItem(eventId: string, galleryId: string): Promise<void> {
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/gallery/${encodeURIComponent(galleryId)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (res.status === 204) return;
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Could not delete gallery item. Please try again."));
  }
}
