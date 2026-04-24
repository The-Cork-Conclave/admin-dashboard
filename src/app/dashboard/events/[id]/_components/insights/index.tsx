"use client";

import { Activities } from "./activities";
import { EventPerformance } from "./event-performance";
import { AnalyticsOverview } from "./analytics-overview";
import { useQuery } from "@tanstack/react-query";
import { getEventMetrics, MetricsDTO } from "./api";

export default function Insights({ id }: { id: string }) {
  const query = useQuery({
    queryKey: [`event-${id}-metrics`],
    queryFn: () => getEventMetrics(id),
    enabled: Boolean(id),
  });

  const metrics: MetricsDTO | undefined = query.data;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <AnalyticsOverview metrics={metrics} />

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
        <div className="flex h-full min-h-0 flex-col gap-4">
          <EventPerformance metrics={metrics} />
        </div>

        <div className="flex h-full min-h-0 flex-col gap-4">
          <Activities id={id} />
        </div>
      </div>
    </div>
  );
}
