import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivitiesListClient } from "./activities-list.client";

export function Activities({ id }: { id: string }) {
  return (
    <Card className="h-full shadow-xs max-h-210 overflow-hidden">
      <CardHeader className="mb-2 pb-2">
        <CardTitle>Activities</CardTitle>
        <CardDescription>
          Track real-time registrations, payments, ticket issuance, and check-ins. Monitor operational flow as the event
          progresses.
        </CardDescription>
      </CardHeader>

      <CardContent className="h-full">
        <ActivitiesListClient id={id} />
      </CardContent>
    </Card>
  );
}
