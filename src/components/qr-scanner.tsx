"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Camera, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QrScannerProps = {
  onScanText: (text: string) => void;
  helperContent?: React.ReactNode;
  disabled?: boolean;
  autoStopOnSuccess?: boolean;
  title?: React.ReactNode;
};

type ScannerStatus = "idle" | "starting" | "active" | "error";

export function QrScanner({
  onScanText,
  helperContent,
  disabled = false,
  autoStopOnSuccess = true,
  title = (
    <>
      <Scan className="size-4 text-muted-foreground" />
      QR Scanner
    </>
  ),
}: QrScannerProps) {
  const reactId = useId();
  const regionId = useMemo(() => `qr-reader-${reactId.replace(/:/g, "-")}`, [reactId]);
  const qrRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [error, setError] = useState<string>("");
  const scanLockRef = useRef(false);

  const stop = useCallback(async () => {
    const qr = qrRef.current;
    if (!qr) return;
    qrRef.current = null;
    scanLockRef.current = false;

    try {
      await qr.stop();
    } catch {
      // ignore
    }
    try {
      await qr.clear();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  const start = async () => {
    if (disabled) return;
    if (status === "starting" || status === "active") return;

    setError("");
    setStatus("starting");

    try {
      const mod = await import("html5-qrcode");
      const qr = new mod.Html5Qrcode(regionId, { verbose: false });
      qrRef.current = qr;

      await qr.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 4 / 3,
        },
        async (decodedText) => {
          if (scanLockRef.current) return;
          scanLockRef.current = true;
          onScanText(decodedText);
          if (autoStopOnSuccess) {
            await stop();
            setStatus("idle");
          }
        },
        () => {
          // ignore per-frame decode errors
        },
      );

      setStatus("active");
    } catch (e) {
      await stop();
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not start camera.");
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <CardTitle className="flex items-center gap-2">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-neutral-950 shadow-inner">
          <div className="aspect-4/3 w-full">
            <div className="absolute inset-0 bg-linear-to-br from-neutral-900 via-neutral-950 to-neutral-900 opacity-95" />
            <div className="absolute inset-0 opacity-30 blur-sm">
              <div className="h-full w-full bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.14),transparent_40%),radial-gradient(circle_at_40%_80%,rgba(255,255,255,0.10),transparent_45%)]" />
            </div>

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-950/40 px-6">
              <div className="relative mb-6 size-56">
                <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-2 border-t-2 border-white/80" />
                <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-2 border-t-2 border-white/80" />
                <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-2 border-l-2 border-white/80" />
                <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-2 border-r-2 border-white/80" />

                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <div id={regionId} className="h-full w-full" />
                </div>
              </div>

              {status !== "active" && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || status === "starting"}
                  className="gap-2 bg-white text-neutral-900 hover:bg-white/90"
                  onClick={() => void start()}
                >
                  <Camera className="size-4" />
                  {status === "starting" ? "Starting..." : "Enable Camera"}
                </Button>
              )}

              {status === "active" && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  className="gap-2 bg-white text-neutral-900 hover:bg-white/90"
                  onClick={() => void stop().then(() => setStatus("idle"))}
                >
                  Stop Camera
                </Button>
              )}

              {status === "error" && error.length > 0 && (
                <p className="mt-4 text-center text-xs text-white/80">{error}</p>
              )}
            </div>
          </div>
        </div>

        {helperContent ? <div className="mt-6 w-full">{helperContent}</div> : null}
      </CardContent>
    </Card>
  );
}
