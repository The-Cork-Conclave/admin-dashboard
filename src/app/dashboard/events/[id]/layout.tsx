import { getEventServer } from "./_lib/get-event.server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { event } = await getEventServer(id);
    return {
      title: `Cork Conclave - ${event?.name ?? event?.slug ?? "Event"}`,
    };
  } catch {
    return {
      title: "Cork Conclave - Event",
    };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
