import { MetricCards } from "./_components/metrics";
import { PerformanceOverview } from "./_components/performance";
import Members from "./_components/members";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-10">
      <MetricCards />
      <PerformanceOverview />
      <Members />
    </div>
  );
}
