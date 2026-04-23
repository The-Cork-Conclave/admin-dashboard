"use client";

import EventActivity from "./event-activity";
import MembersActivity from "./members-activity";

export function PerformanceOverview() {
  return (
    <div className="flex flex-col md:flex-row items-stretch gap-6 w-full">
      <div className="flex-1">
        <MembersActivity />
      </div>
      <div className="flex-1">
        <EventActivity />
      </div>
    </div>
  );
}
