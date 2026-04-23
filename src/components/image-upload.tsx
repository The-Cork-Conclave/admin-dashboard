"use client";

import * as React from "react";

import Image from "next/image";

import { Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CloudinarySignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

export type ImageUploadProps = {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  disabled?: boolean;
  className?: string;
  maxSizeBytes?: number;
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / 1024 ** i;
  const rounded = v >= 10 || i === 0 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${rounded} ${units[i]}`;
}

async function getSignature(folder?: string): Promise<CloudinarySignatureResponse> {
  const url = new URL("/api/uploads/cloudinary/signature", window.location.origin);
  if (folder?.trim()) url.searchParams.set("folder", folder.trim());
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Signature request failed (${res.status})`);
  }
  return (await res.json()) as CloudinarySignatureResponse;
}

async function uploadToCloudinary(file: File, sig: CloudinarySignatureResponse): Promise<string> {
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

export function ImageUpload({
  value,
  onChange,
  folder = "cork-conclave/events",
  disabled = false,
  className,
  maxSizeBytes = 10 * 1024 * 1024,
}: ImageUploadProps) {
  const inputId = React.useId();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pickFile = React.useCallback(() => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  }, [disabled, isUploading]);

  const validateFile = React.useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return `Only image files are supported. Got: ${file.type || "unknown"}`;
      if (Number.isFinite(maxSizeBytes) && maxSizeBytes > 0 && file.size > maxSizeBytes) {
        return `File is too large (${formatBytes(file.size)}). Max is ${formatBytes(maxSizeBytes)}.`;
      }
      return null;
    },
    [maxSizeBytes],
  );

  const handleFile = React.useCallback(
    async (file: File) => {
      setError(null);
      const vErr = validateFile(file);
      if (vErr) {
        setError(vErr);
        return;
      }

      setIsUploading(true);
      try {
        const sig = await getSignature(folder);
        const url = await uploadToCloudinary(file, sig);
        onChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [folder, onChange, validateFile],
  );

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await handleFile(file);
  };

  const onDrop: React.DragEventHandler<HTMLLabelElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  const onDragOver: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;
    setIsDragging(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const hasValue = Boolean(value?.trim());

  if (hasValue) {
    return (
      <div className={cn("w-full min-w-0", className)}>
        <div
          className={cn(
            "relative w-full min-w-0 overflow-hidden rounded-md border border-foreground/25 bg-background",
            disabled ? "opacity-60" : "",
          )}
        >
          <div className="relative h-56 w-full min-w-0">
            <Image src={value as string} alt="Uploaded" fill unoptimized className="object-cover brightness-75" />
            <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
          </div>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="pointer-events-auto"
              disabled={disabled || isUploading}
              aria-label="Delete image"
              onClick={() => {
                setError(null);
                setIsDragging(false);
                onChange("");
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full min-w-0 space-y-2 font-sans", className)}>
      <label
        className={cn(
          "border-foreground/25! ring-1 ring-border/60 ring-inset dark:border-foreground/25",
          "relative box-border flex min-h-52 w-full min-w-0 cursor-pointer flex-col items-stretch justify-center rounded-md border-2 border-dashed bg-background p-6 transition-[border-color,box-shadow,background-color] sm:min-h-56 sm:p-8",

          isDragging ? "border-primary bg-primary/[0.07] ring-primary/30" : "border-border/80",
          disabled
            ? "pointer-events-none opacity-60"
            : "hover:border-foreground/25 hover:bg-muted/35 dark:hover:bg-muted/25",
        )}
        aria-disabled={disabled || isUploading}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        htmlFor={inputId}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled || isUploading}
          onChange={onInputChange}
        />

        <div className="flex w-full max-w-full min-w-0 flex-col items-center justify-center px-2 text-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mb-3 size-11 shrink-0 rounded-full shadow-sm"
            disabled={disabled || isUploading}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              pickFile();
            }}
            aria-label="Choose image file"
          >
            <UploadCloud className="size-5" />
          </Button>

          <div className="max-w-md font-medium text-sm leading-snug">
            {isUploading ? "Uploading…" : isDragging ? "Drop image to upload" : "Drop or select image"}
          </div>
          <div className="mt-2 max-w-md text-balance text-muted-foreground text-xs leading-relaxed">
            {isUploading
              ? "Please wait while your image uploads."
              : `Drag an image here, or click the icon to browse (max ${formatBytes(maxSizeBytes)}).`}
          </div>
        </div>
      </label>

      {error ? (
        <div className="wrap-break-word text-destructive text-sm leading-snug" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  );
}
