"use client";

import EventActivity from "./event-activity";
import MembersActivity from "./members-activity";

export function PerformanceOverview() {
  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      <MembersActivity />
      <EventActivity />
    </div>
  );
}
