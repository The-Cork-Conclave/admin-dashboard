"use client";

import * as React from "react";

import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CircleX, DollarSign, Star, Ticket, User, UserCheck, Wine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { type EventActivitiesCursor, fetchEventActivitiesPage } from "../../../_lib/fetch-event-activities";
import type { Activity, ActivityType } from "./schema";

const WINE_ACTIVITY_TYPES = new Set<ActivityType>(["wine_added", "wine_reviewed"]);

function ActivityIcon({ type }: { type: ActivityType }) {
  switch (type) {
    case "registration_created":
      return (
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 shadow-sm">
          <User className="h-4 w-4" />
        </div>
      );
    case "payment_successful":
      return (
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 shadow-sm">
          <DollarSign className="h-4 w-4" />
        </div>
      );
    case "payment_verification_failed":
      return (
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 shadow-sm">
          <CircleX className="h-4 w-4" />
        </div>
      );
    case "ticket_issued":
      return (
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
          <Ticket className="h-4 w-4" />
        </div>
      );
    case "check_in_completed":
      return (
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm">
          <UserCheck className="h-4 w-4" />
        </div>
      );
    case "wine_added":
      return (
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-700 shadow-sm">
          <Wine className="h-4 w-4" />
        </div>
      );
    case "wine_reviewed":
      return (
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-violet-700 shadow-sm">
          <Star className="h-4 w-4" />
        </div>
      );
    default:
      return <div />;
  }
}

function ActivityItem({ activity: { type, title, description, created_at } }: { activity: Activity }) {
  const time = formatDistanceToNow(new Date(created_at), { addSuffix: true });

  return (
    <div className="group flex gap-4">
      <div className="relative flex flex-col items-center">
        <div className="absolute top-8 bottom-0 w-px bg-slate-100 group-last:hidden" />
        <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm">
          <ActivityIcon type={type} />
        </div>
      </div>

      <div className="w-full pb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-slate-800 text-sm">{title}</p>
            {description && <p className="mt-1 flex items-center gap-1.5 text-slate-500 text-xs">{description}</p>}
          </div>

          <span className="mt-1 whitespace-nowrap font-medium text-slate-400 text-xs sm:mt-0">{time}</span>
        </div>
      </div>
    </div>
  );
}

function ActivitiesSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex h-full max-h-180 flex-col gap-4 overflow-y-auto">
      <div className="flex-1 space-y-2">
        {Array.from({ length: rows }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items are static and never reordered
          <div key={`activity-skeleton-${i}`} className="flex gap-4">
            <div className="relative flex flex-col items-center">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>

            <div className="w-full pb-8">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-[65%]" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-[80%]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Activities({ id }: { id: string }) {
  const limit = 20;
  const scrollRootRef = React.useRef<HTMLDivElement | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["events", id, "activities", limit],
    initialPageParam: null as EventActivitiesCursor | null,
    queryFn: ({ pageParam }) =>
      fetchEventActivitiesPage(id, {
        limit,
        cursor: pageParam ?? undefined,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta.has_more) return undefined;
      return lastPage.meta.next_cursor ?? undefined;
    },
  });

  const activities = React.useMemo(
    () => (query.data?.pages.flatMap((p) => p.data) ?? []).filter((activity) => WINE_ACTIVITY_TYPES.has(activity.type)),
    [query.data],
  );
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  // Keep paging until wine-related rows appear or the feed is exhausted.
  React.useEffect(() => {
    if (query.isLoading || query.isError) return;
    if (activities.length > 0) return;
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [activities.length, fetchNextPage, hasNextPage, isFetchingNextPage, query.isError, query.isLoading]);

  React.useEffect(() => {
    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!hasNextPage) return;
        if (isFetchingNextPage) return;
        fetchNextPage();
      },
      { root, rootMargin: "80px 0px 120px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (query.isLoading || (activities.length === 0 && hasNextPage)) {
    return <ActivitiesSkeleton />;
  }

  if (query.isError) {
    const message = query.error instanceof Error ? query.error.message : "Failed to load activities";
    return (
      <div className="flex flex-col gap-2">
        <p className="text-red-600 text-sm">{message}</p>
        <div>
          <Button size="sm" variant="outline" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return <div className="text-slate-500 text-sm">No wine activities yet.</div>;
  }

  return (
    <Card className="h-full max-h-125 min-h-0 shadow-xs">
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div ref={scrollRootRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <div className="flex-1 space-y-2">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}

            <div ref={sentinelRef} className="h-8" />

            {query.isFetchingNextPage && <div className="text-slate-500 text-xs">Loading more…</div>}
            {!query.hasNextPage && (
              <div className="mb-4 pb-4 text-center text-slate-400 text-xs">You’re all caught up.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
