"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsDTO } from "./api";

export function AnalyticsOverview({ metrics }: { metrics: MetricsDTO | undefined }) {
  return (
    <Card className="py-4 shadow-xs lg:col-span-2">
      <CardHeader className="px-4">
        <CardTitle>Event Performance</CardTitle>
        <CardDescription>Track registrations, ticket sales, attendance, and no-shows</CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:[&>div:first-child]:pl-0 lg:[&>div:last-child]:pr-0 lg:[&>div]:px-5 mt-2">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Registrations</div>
          <div className="font-semibold text-2xl tabular-nums">{metrics?.total_registrations ?? 0}</div>
        </div>

        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Tickets Sold</div>
          <div className="font-semibold text-2xl tabular-nums">{metrics?.total_tickets ?? 0}</div>
        </div>

        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Total Attendees</div>
          <div className="font-semibold text-2xl tabular-nums">{metrics?.total_attendees ?? 0}</div>
        </div>

        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Total No-shows</div>
          <div className="font-semibold text-2xl tabular-nums">{metrics?.total_no_shows ?? 0}</div>
        </div>
      </CardContent>
    </Card>
  );
}
