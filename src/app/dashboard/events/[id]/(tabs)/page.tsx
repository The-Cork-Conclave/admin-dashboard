import { Suspense } from "react";

import { EventDetailsTabs } from "@/app/dashboard/events/[id]/_components/event-details-tabs";
import { EventDetailsTabsSkeleton } from "@/app/dashboard/events/[id]/_components/event-details-tabs-skeleton";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<EventDetailsTabsSkeleton />}>
      <EventDetailsTabs id={id} />
    </Suspense>
  );
}
