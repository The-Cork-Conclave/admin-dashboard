import { EventDetailsClient } from "@/app/dashboard/events/[id]/_components/overview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UpdateEvent from "@/app/dashboard/events/[id]/_components/update";
import Insights from "@/app/dashboard/events/[id]/_components/insights";
import Gallery from "@/app/dashboard/events/[id]/_components/gallery";
import Finance from "@/app/dashboard/events/[id]/_components/finance";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Tabs className="gap-4" defaultValue="overview">
      <TabsList className="lg:h-10 lg:p-2">
        <TabsTrigger value="overview" className="md:px-3 md:py-1 lg:text-base">
          Overview
        </TabsTrigger>
        <TabsTrigger value="update" className="md:px-3 md:py-1 lg:text-base">
          Edit
        </TabsTrigger>

        <TabsTrigger value="insights" className="md:px-3 md:py-1 lg:text-base">
          Insights
        </TabsTrigger>

        <TabsTrigger value="gallery" className="md:px-3 md:py-1 lg:text-base">
          Gallery
        </TabsTrigger>

        <TabsTrigger value="finance" className="md:px-3 md:py-1 lg:text-base">
          Finance
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

      <TabsContent value="gallery">
        <Gallery id={id} />
      </TabsContent>

      <TabsContent value="finance">
        <Finance id={id} />
      </TabsContent>
    </Tabs>
  );
}
