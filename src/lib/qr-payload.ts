"use client";

import { z } from "zod";

export const qrPayloadSchema = z.object({
  v: z.literal(1),
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
  access_code: z.string().min(1),
});

export type QrPayload = z.infer<typeof qrPayloadSchema>;

export function decodeBase64UrlToUtf8(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.codePointAt(0) ?? 0);
  return new TextDecoder().decode(bytes);
}

export function decodeQrPayload(text: string): QrPayload {
  const json = decodeBase64UrlToUtf8(text);
  const parsedJson = JSON.parse(json) as unknown;
  return qrPayloadSchema.parse(parsedJson);
}
