import { Suspense } from "react";
import { VerifyPageClient } from "./_components/verify-page-client";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={<div className="flex h-dvh items-center justify-center">Loading…</div>}
    >
      <VerifyPageClient />
    </Suspense>
  );
}
