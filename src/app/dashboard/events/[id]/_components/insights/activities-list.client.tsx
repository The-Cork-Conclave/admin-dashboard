"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CircleX, DollarSign, Ticket, User, UserCheck } from "lucide-react";

import type { Activity, ActivityType } from "./schema";
import { fetchEventActivitiesPage, type EventActivitiesCursor } from "../../_lib/fetch-event-activities";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function ActivityIcon({ type }: { type: ActivityType }) {
  switch (type) {
    case "registration_created":
      return (
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-200 shadow-sm text-slate-600 z-10">
          <User className="h-4 w-4" />
        </div>
      );
    case "payment_successful":
      return (
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 border border-blue-100 shadow-sm text-blue-600 z-10">
          <DollarSign className="h-4 w-4" />
        </div>
      );
    case "payment_verification_failed":
      return (
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-rose-50 border border-rose-100 shadow-sm text-rose-600 z-10">
          <CircleX className="h-4 w-4" />
        </div>
      );
    case "ticket_issued":
      return (
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 border-indigo-100 shadow-sm text-indigo-600 border z-10">
          <Ticket className="h-4 w-4" />
        </div>
      );
    case "check_in_completed":
      return (
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm text-emerald-600 z-10">
          <UserCheck className="h-4 w-4" />
        </div>
      );
    default:
      return <div />;
  }
}

function ActivityItem({ activity: { type, title, description, created_at } }: { activity: Activity }) {
  const time = formatDistanceToNow(new Date(created_at), { addSuffix: true });

  return (
    <div className="flex gap-4 group">
      <div className="relative flex flex-col items-center">
        <div className="absolute top-8 bottom-0 w-px bg-slate-100 group-last:hidden"></div>
        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm text-emerald-600 z-10">
          <ActivityIcon type={type} />
        </div>
      </div>

      <div className="pb-8 w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            {description && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">{description}</p>}
          </div>

          <span className="text-xs text-slate-400 whitespace-nowrap mt-1 sm:mt-0 font-medium">{time}</span>
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

export function ActivitiesListClient({ id, limit = 20 }: { id: string; limit?: number }) {
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

  const activities = React.useMemo(() => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

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

  if (query.isLoading) {
    return <ActivitiesSkeleton />;
  }

  if (query.isError) {
    const message = query.error instanceof Error ? query.error.message : "Failed to load activities";
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-red-600">{message}</p>
        <div>
          <Button size="sm" variant="outline" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return <div className="text-sm text-slate-500">No activities yet.</div>;
  }

  return (
    <div ref={scrollRootRef} className="flex h-full max-h-180 overflow-y-auto flex-col gap-4">
      <div className="flex-1 space-y-2">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}

        <div ref={sentinelRef} className="h-8" />

        {query.isFetchingNextPage && <div className="text-xs text-slate-500">Loading more…</div>}
        {!query.hasNextPage && <div className="text-xs text-slate-400">You’re all caught up.</div>}
      </div>
    </div>
  );
}
