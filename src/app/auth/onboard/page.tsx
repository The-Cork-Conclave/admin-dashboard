import { Suspense } from "react";

import { OnboardPageClient } from "./_components/onboard-page-client";

export default function OnboardPage() {
  return (
    <Suspense fallback={<div className="flex h-dvh items-center justify-center">Loading…</div>}>
      <OnboardPageClient />
    </Suspense>
  );
}
