"use client";

import JSZip from "jszip";

import { postCreateGalleryItem } from "@/app/dashboard/events/[id]/_components/gallery/_lib/gallery-api.client";
import { uploadImageFileToCloudinaryFolder } from "@/lib/cloudinary-client-upload";

export const GALLERY_ZIP_MAX_BYTES = 10000 * 1024 * 1024;
export const GALLERY_ZIP_MAX_IMAGES = 1000;
export const GALLERY_ZIP_CONCURRENCY = 4;
export const GALLERY_ZIP_MAX_IMAGE_BYTES = 100 * 1024 * 1024;

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp", "svg"]);

export type ZipImportProgress = {
  completed: number;
  total: number;
  currentPath: string | null;
};

export type ZipImportFailure = { path: string; message: string };

export type ZipImportResult = {
  successCount: number;
  failures: ZipImportFailure[];
  total: number;
};

function isSkippableZipPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.includes("__macosx/") || lower.endsWith(".ds_store");
}

function imageExtFromPath(path: string): string | null {
  const base = path.split("/").pop() ?? path;
  const dot = base.lastIndexOf(".");
  if (dot < 0) return null;
  return base.slice(dot + 1).toLowerCase();
}

export async function collectZipImageFiles(
  zipFile: File,
  opts?: { maxZipBytes?: number; maxImages?: number; maxImageBytes?: number },
): Promise<{ files: { path: string; file: File }[] } | { error: string }> {
  const maxZipBytes = opts?.maxZipBytes ?? GALLERY_ZIP_MAX_BYTES;
  const maxImages = opts?.maxImages ?? GALLERY_ZIP_MAX_IMAGES;
  const maxImageBytes = opts?.maxImageBytes ?? GALLERY_ZIP_MAX_IMAGE_BYTES;

  if (zipFile.size > maxZipBytes) {
    return { error: `ZIP must be at most ${Math.round(maxZipBytes / (1024 * 1024))} MB.` };
  }

  const buffer = await zipFile.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const files: { path: string; file: File }[] = [];

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const path = entry.name;
    if (!path || isSkippableZipPath(path)) continue;
    const ext = imageExtFromPath(path);
    if (!ext || !IMAGE_EXT.has(ext)) continue;

    if (files.length >= maxImages) {
      return { error: `ZIP contains more than ${maxImages} images. Split into smaller archives.` };
    }

    const blob = await entry.async("blob");
    if (blob.size === 0) continue;
    if (blob.size > maxImageBytes) {
      return { error: `Image "${path}" exceeds ${maxImageBytes / (1024 * 1024)} MB.` };
    }

    const base = path.split("/").pop() ?? "image";
    const mime = blob.type || `image/${ext === "jpg" ? "jpeg" : ext}`;
    const file = new File([blob], base, { type: mime });
    files.push({ path, file });
  }

  if (files.length === 0) {
    return {
      error: "No supported images found in the ZIP (jpg, png, webp, gif, avif, bmp, svg).",
    };
  }

  return { files };
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Unknown error";
}

export async function runGalleryZipImport(
  eventId: string,
  cloudinaryFolder: string,
  zipEntries: { path: string; file: File }[],
  onProgress: (p: ZipImportProgress) => void,
  concurrency: number = GALLERY_ZIP_CONCURRENCY,
): Promise<ZipImportResult> {
  const total = zipEntries.length;
  const failures: ZipImportFailure[] = [];
  let successCount = 0;
  let completed = 0;

  const processOne = async (entry: { path: string; file: File }) => {
    onProgress({ completed, total, currentPath: entry.path });
    try {
      const url = await uploadImageFileToCloudinaryFolder(entry.file, cloudinaryFolder);
      await postCreateGalleryItem(eventId, { url });
      successCount++;
    } catch (e) {
      failures.push({ path: entry.path, message: errMessage(e) });
    } finally {
      completed++;
      onProgress({ completed, total, currentPath: null });
    }
  };

  let index = 0;
  const worker = async () => {
    while (true) {
      const i = index++;
      if (i >= zipEntries.length) break;
      await processOne(zipEntries[i]);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, zipEntries.length) }, () => worker()));

  return { successCount, failures, total };
}
