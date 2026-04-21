import CurrentEvent from "./_components/current-event";
import EventMetrics from "./_components/event-metrics";
import Events from "./_components/events";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-20 md:gap-20">
      <CurrentEvent />

      <div className="flex flex-col gap-10">
        <EventMetrics />
        <Events />
      </div>
    </div>
  );
}
