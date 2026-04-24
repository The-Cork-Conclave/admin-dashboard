import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivitiesListClient } from "./activities-list.client";

export function Activities({ id }: { id: string }) {
  return (
    <Card className="h-full min-h-0 max-h-125 shadow-xs">
      <CardHeader>
        <CardTitle>Activities</CardTitle>
        <CardDescription>
          Track real-time registrations, payments, ticket issuance, and check-ins. Monitor operational flow as the event
          progresses.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col">
        <ActivitiesListClient id={id} />
      </CardContent>
    </Card>
  );
}
