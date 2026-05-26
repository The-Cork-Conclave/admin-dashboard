"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Finance from "@/app/dashboard/events/[id]/_components/finance";
import Gallery from "@/app/dashboard/events/[id]/_components/gallery";
import Insights from "@/app/dashboard/events/[id]/_components/insights";
import { EventDetailsClient } from "@/app/dashboard/events/[id]/_components/overview";
import UpdateEvent from "@/app/dashboard/events/[id]/_components/update";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_VALUES = ["overview", "update", "insights", "gallery", "finance"] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(value: string | null | undefined): value is TabValue {
  return value !== null && value !== undefined && TAB_VALUES.includes(value as TabValue);
}

export function EventDetailsTabs({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const param = searchParams.get("tab");
  const value: TabValue = isTabValue(param) ? param : "overview";

  const onValueChange = (next: string) => {
    if (!isTabValue(next)) return;
    const nextParams = new URLSearchParams(searchParams.toString());
    if (next === "overview") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", next);
    }
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <Tabs className="gap-4" value={value} onValueChange={onValueChange}>
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
