export type CloudinarySignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

export async function getCloudinarySignature(folder?: string): Promise<CloudinarySignatureResponse> {
  const url = new URL("/api/uploads/cloudinary/signature", window.location.origin);
  if (folder?.trim()) url.searchParams.set("folder", folder.trim());
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
  const sig = await getCloudinarySignature(folder);
  return uploadFileToCloudinary(file, sig);
}
