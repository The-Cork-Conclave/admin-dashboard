export type CloudinarySignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  /** Present when the signature was requested with a conversion format (e.g. "jpg"). */
  format?: string;
};

export const IMAGE_UPLOAD_FORMAT = "jpg";

/** Force a browser-safe format on Cloudinary delivery URLs (fixes already-stored HEIC/etc.). */
export function cloudinaryDisplayUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return url;
  const marker = "/image/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const after = url.slice(idx + marker.length);
  if (!after || /(^|\/|,)f_/.test(after)) return url;
  return `${url.slice(0, idx + marker.length)}f_jpg/${after}`;
}

export async function getCloudinarySignature(
  folder?: string,
  options?: { format?: string },
): Promise<CloudinarySignatureResponse> {
  const url = new URL("/api/uploads/cloudinary/signature", window.location.origin);
  if (folder?.trim()) url.searchParams.set("folder", folder.trim());
  if (options?.format?.trim()) url.searchParams.set("format", options.format.trim());
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Signature request failed (${res.status})`);
  }
  return (await res.json()) as CloudinarySignatureResponse;
}

export async function uploadFileToCloudinary(file: File, sig: CloudinarySignatureResponse): Promise<string> {
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(sig.cloudName)}/image/upload`;

  const body = new FormData();
  body.set("file", file);
  body.set("api_key", sig.apiKey);
  body.set("timestamp", String(sig.timestamp));
  body.set("signature", sig.signature);
  body.set("folder", sig.folder);
  if (sig.format) body.set("format", sig.format);

  const res = await fetch(endpoint, { method: "POST", body });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Upload failed (${res.status})`);
  }

  const data = (await res.json()) as { secure_url?: string; url?: string };
  const out = (data.secure_url ?? data.url ?? "").trim();
  if (!out) throw new Error("Upload succeeded but no URL returned");
  return out;
}

export async function uploadImageFileToCloudinaryFolder(file: File, folder: string): Promise<string> {
  const sig = await getCloudinarySignature(folder, { format: IMAGE_UPLOAD_FORMAT });
  return uploadFileToCloudinary(file, sig);
}
