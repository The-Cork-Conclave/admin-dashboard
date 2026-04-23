import { getEventServer } from "./_lib/get-event.server";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { event } = await getEventServer(id);
    return {
      title: `Cork Conclave - ${event?.slug ?? event?.name ?? "Event"}`,
    };
  } catch {
    return {
      title: "Cork Conclave - Event",
    };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Tabs className="gap-4" defaultValue="overview">
      <TabsList className="lg:h-10 lg:p-2">
        <TabsTrigger value="overview" className="lg:px-3 lg:py-1 lg:text-base">
          Overview
        </TabsTrigger>
        <TabsTrigger value="update" className="lg:px-3 lg:py-1 lg:text-base">
          Edit
        </TabsTrigger>
        <TabsTrigger value="registrations" className="lg:px-3 lg:py-1 lg:text-base">
          Registrations
        </TabsTrigger>
        {/* <TabsTrigger value="insights" className="lg:px-3 lg:py-1 lg:text-base">
          Insights
        </TabsTrigger>
        <TabsTrigger value="activity" className="lg:px-3 lg:py-1 lg:text-base">
          Activity
        </TabsTrigger> */}
      </TabsList>

      {children}
    </Tabs>
  );
}
