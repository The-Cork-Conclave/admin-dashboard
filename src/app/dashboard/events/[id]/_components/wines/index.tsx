"use client";

import * as React from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CirclePlus, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { Activities } from "./_components/activities";
import { AddWineModal } from "./_components/add-wine-modal";
import WineCard from "./_components/wine-card";
import { WineDetailsDrawer } from "./_components/wine-details-drawer";
import { fetchEventWines } from "./_lib/wines-api.client";

export default function Wines({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = React.useState(false);
  const [detailsWineId, setDetailsWineId] = React.useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const winesQuery = useQuery({
    queryKey: ["events", id, "wines"],
    queryFn: () => fetchEventWines(id),
    enabled: Boolean(id?.trim()),
  });

  const wines = winesQuery.data?.wines ?? [];
  const winesCount = winesQuery.data?.wines_count ?? 0;
  const totalReviews = winesQuery.data?.total_reviews ?? 0;
  const averageRating = winesQuery.data?.average_rating ?? 0;

  const refreshAfterAnnounce = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["events", id, "wines"] }),
      queryClient.invalidateQueries({ queryKey: ["events", id, "activities"] }),
    ]);
  };

  const detailsWineIdRef = React.useRef(detailsWineId);

  React.useEffect(() => {
    detailsWineIdRef.current = detailsWineId;
  }, [detailsWineId]);

  React.useEffect(() => {
    if (!id?.trim()) return;

    const es = new EventSource(`/api/events/${encodeURIComponent(id)}/stream`);

    const invalidateLive = () => {
      void queryClient.invalidateQueries({ queryKey: ["events", id, "wines"] });
      void queryClient.invalidateQueries({ queryKey: ["events", id, "activities"] });
      const openWineId = detailsWineIdRef.current;
      if (openWineId) {
        void queryClient.invalidateQueries({ queryKey: ["events", id, "wines", openWineId] });
      }
    };

    es.addEventListener("wine_added", invalidateLive);
    es.addEventListener("wine_reviewed", invalidateLive);

    return () => {
      es.removeEventListener("wine_added", invalidateLive);
      es.removeEventListener("wine_reviewed", invalidateLive);
      es.close();
    };
  }, [id, queryClient]);

  return (
    <main className="mx-auto w-full px-6 py-4 md:px-10">
      <header className="mb-10 flex flex-col justify-end gap-6 md:flex-row md:items-end">
        <Button size="lg" className="gap-2 self-start md:self-auto" onClick={() => setAddOpen(true)}>
          <CirclePlus className="size-4" />
          Add Wine
        </Button>
      </header>

      <Card className="mb-10 py-4 shadow-xs">
        <CardHeader className="px-4">
          <CardTitle>Wines Overview</CardTitle>
          <CardDescription>Track announced wines, reviews, ratings, and live attendee activity</CardDescription>
        </CardHeader>

        <CardContent className="mt-2 grid grid-cols-1 gap-4 px-4 sm:grid-cols-3 lg:gap-0 lg:divide-x lg:[&>div:first-child]:pl-0 lg:[&>div:last-child]:pr-0 lg:[&>div]:px-5">
          <div className="space-y-1">
            <div className="text-muted-foreground text-sm">Wines</div>
            <div className="font-semibold text-2xl tabular-nums">
              {winesQuery.isLoading ? <Skeleton className="h-8 w-12" /> : winesCount}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground text-sm">Total Reviews</div>
            <div className="font-semibold text-2xl tabular-nums">
              {winesQuery.isLoading ? <Skeleton className="h-8 w-12" /> : totalReviews}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-muted-foreground text-sm">Average Rating</div>
            <div className="inline-flex items-baseline gap-1 font-semibold text-2xl tabular-nums">
              {winesQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  {averageRating.toFixed(1)}
                  <Star className="size-4 fill-amber-500 text-amber-500" />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-xl tracking-tight">Wines</h2>
            </div>
            <div className="w-full space-y-4">
              {winesQuery.isLoading ? (
                <>
                  <Skeleton className="h-28 w-full rounded-xl" />
                  <Skeleton className="h-28 w-full rounded-xl" />
                </>
              ) : winesQuery.isError ? (
                <p className="rounded-2xl border border-dashed py-10 text-center text-muted-foreground text-sm">
                  {winesQuery.error instanceof Error ? winesQuery.error.message : "Could not load wines."}
                </p>
              ) : wines.length === 0 ? (
                <p className="rounded-2xl border border-dashed py-10 text-center text-muted-foreground text-sm">
                  No wines yet. Announce a wine to get started.
                </p>
              ) : (
                wines.map((wine) => (
                  <WineCard
                    key={wine.event_wine_id}
                    wine={wine}
                    onClick={() => {
                      setDetailsWineId(wine.event_wine_id);
                      setDetailsOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-xl tracking-tight">Live Activity</h2>
            </div>
            <Activities id={id} />
          </section>
        </div>
      </div>

      <AddWineModal open={addOpen} onOpenChange={setAddOpen} eventId={id} onSuccess={refreshAfterAnnounce} />

      <WineDetailsDrawer eventId={id} eventWineId={detailsWineId} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </main>
  );
}
