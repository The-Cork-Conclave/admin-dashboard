import { EventDetailsClient } from "@/app/dashboard/events/[id]/_components/event-details-client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <EventDetailsClient id={id} />;
}
