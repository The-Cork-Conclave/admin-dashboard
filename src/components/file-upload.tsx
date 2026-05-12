"use client";

import * as React from "react";

import { FileText, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CloudinarySignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

export type FileUploadProps = {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  disabled?: boolean;
  className?: string;
  maxSizeBytes?: number;
  accept?: string;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  onUploadingChange?: (isUploading: boolean) => void;
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / 1024 ** i;
  const rounded = v >= 10 || i === 0 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${rounded} ${units[i]}`;
}

function getFileNameFromUrl(raw: string) {
  try {
    const url = new URL(raw);
    const lastSegment = url.pathname.split("/").filter(Boolean).pop();
    return decodeURIComponent(lastSegment ?? "Uploaded file");
  } catch {
    return raw;
  }
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
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(sig.cloudName)}/auto/upload`;

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

export function FileUpload({
  value,
  onChange,
  folder = "cork-conclave/events",
  disabled = false,
  className,
  maxSizeBytes = 10 * 1024 * 1024,
  accept = "image/*,.pdf,.doc,.docx",
  allowedMimeTypes = [
    "application/msword",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  allowedExtensions = [".doc", ".docx", ".pdf"],
  onUploadingChange,
}: FileUploadProps) {
  const inputId = React.useId();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  const pickFile = React.useCallback(() => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  }, [disabled, isUploading]);

  const validateFile = React.useCallback(
    (file: File) => {
      const lowerName = file.name.toLowerCase();
      const isAllowedByType = file.type.startsWith("image/") || allowedMimeTypes.includes(file.type);
      const isAllowedByExtension = allowedExtensions.some((ext) => lowerName.endsWith(ext));

      if (!(isAllowedByType || isAllowedByExtension)) {
        return `Unsupported file type. Please upload an image, PDF, DOC, or DOCX file.`;
      }

      if (Number.isFinite(maxSizeBytes) && maxSizeBytes > 0 && file.size > maxSizeBytes) {
        return `File is too large (${formatBytes(file.size)}). Max is ${formatBytes(maxSizeBytes)}.`;
      }
      return null;
    },
    [allowedExtensions, allowedMimeTypes, maxSizeBytes],
  );

  const handleFile = React.useCallback(
    async (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsUploading(true);
      try {
        const sig = await getSignature(folder);
        const url = await uploadToCloudinary(file, sig);
        onChange(url);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
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
      <div className={cn("w-full min-w-0 space-y-2", className)}>
        <div
          className={cn(
            "flex w-full min-w-0 items-center justify-between rounded-md border border-foreground/25 bg-background p-3",
            disabled ? "opacity-60" : "",
          )}
        >
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <p className="truncate font-medium text-sm">{getFileNameFromUrl(value as string)}</p>
            </div>
            <a
              className="block truncate text-muted-foreground text-xs underline underline-offset-3"
              href={value}
              rel="noreferrer"
              target="_blank"
            >
              View uploaded receipt
            </a>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="shrink-0"
            disabled={disabled || isUploading}
            aria-label="Delete uploaded file"
            onClick={() => {
              setError(null);
              setIsDragging(false);
              onChange("");
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
        {error ? (
          <div className="wrap-break-word text-destructive text-sm leading-snug" role="alert">
            {error}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("w-full min-w-0 space-y-2 font-sans", className)}>
      <label
        className={cn(
          "border-foreground/25! ring-1 ring-border/60 ring-inset dark:border-foreground/25",
          "relative box-border flex min-h-44 w-full min-w-0 cursor-pointer flex-col items-stretch justify-center rounded-md border-2 border-dashed bg-background p-6 transition-[border-color,box-shadow,background-color]",
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
          accept={accept}
          className="sr-only"
          disabled={disabled || isUploading}
          onChange={onInputChange}
        />

        <div className="flex w-full min-w-0 max-w-full flex-col items-center justify-center px-2 text-center">
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
            aria-label="Choose receipt file"
          >
            <UploadCloud className="size-5" />
          </Button>

          <div className="max-w-md font-medium text-sm leading-snug">
            {isUploading ? "Uploading…" : isDragging ? "Drop receipt to upload" : "Drop or select receipt"}
          </div>
          <div className="mt-2 max-w-md text-balance text-muted-foreground text-xs leading-relaxed">
            {isUploading
              ? "Please wait while your receipt uploads."
              : `Supported files: images, PDF, DOC, DOCX (max ${formatBytes(maxSizeBytes)}).`}
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
