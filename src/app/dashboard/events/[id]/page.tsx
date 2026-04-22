import { EventDetailsClient } from "@/app/dashboard/events/[id]/_components/overview";
import { TabsContent } from "@/components/ui/tabs";
import Registrations from "@/app/dashboard/events/[id]/_components/registrations";
import UpdateEvent from "@/app/dashboard/events/[id]/_components/update";
import Insights from "@/app/dashboard/events/[id]/_components/insights";
import Activities from "@/app/dashboard/events/[id]/_components/activity";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <TabsContent value="overview">
        <EventDetailsClient id={id} />
      </TabsContent>

      <TabsContent value="update">
        <UpdateEvent id={id} />
      </TabsContent>

      <TabsContent value="registrations">
        <Registrations id={id} />
      </TabsContent>

      <TabsContent value="insights">
        <Insights id={id} />
      </TabsContent>

      <TabsContent value="insights">
        <Activities id={id} />
      </TabsContent>
    </>
  );
}
