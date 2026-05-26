"use client";

import EventActivity from "./event-activity";
import MembersActivity from "./members-activity";

export function PerformanceOverview() {
  return (
    <div className="flex w-full flex-col items-stretch gap-6 md:flex-row">
      <div className="flex-1">
        <MembersActivity />
      </div>
      <div className="flex-1">
        <EventActivity />
      </div>
    </div>
  );
}
