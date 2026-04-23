import { EventDetailsClient } from "@/app/dashboard/events/[id]/_components/overview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UpdateEvent from "@/app/dashboard/events/[id]/_components/update";
import Insights from "@/app/dashboard/events/[id]/_components/insights";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Tabs className="gap-4" defaultValue="insights">
      <TabsList className="lg:h-10 lg:p-2">
        <TabsTrigger value="overview" className="lg:px-3 lg:py-1 lg:text-base">
          Overview
        </TabsTrigger>
        <TabsTrigger value="update" className="lg:px-3 lg:py-1 lg:text-base">
          Edit
        </TabsTrigger>

        <TabsTrigger value="insights" className="lg:px-3 lg:py-1 lg:text-base">
          Insights
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <EventDetailsClient id={id} />
      </TabsContent>

      <TabsContent value="update">
        <UpdateEvent id={id} />
      </TabsContent>

      <TabsContent value="insights">
        <Insights id={id} />
      </TabsContent>
    </Tabs>
  );
}
