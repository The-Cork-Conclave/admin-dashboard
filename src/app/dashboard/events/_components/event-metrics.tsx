"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, FilePenLine, XCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

import { fetchEventsMetrics } from "../_lib/fetch-events-metrics";

function MetricCards() {
  const query = useQuery({
    queryKey: ["eventsMetrics"],
    queryFn: fetchEventsMetrics,
  });

  const data = query.data?.data;
  const draft = data?.draft ?? 0;
  const completed = data?.completed ?? 0;
  const cancelled = data?.cancelled ?? 0;
  const totalEvents = data ? data.draft + data.active + data.closed + data.completed + data.cancelled : 0;

  const display = (v: number) => (query.isLoading ? "—" : String(v));

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card>
        <CardHeader>
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <CardDescription className="flex-1 leading-snug">Total Events</CardDescription>
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{display(totalEvents)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <CardDescription className="flex-1 leading-snug">Draft Events</CardDescription>
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400">
              <FilePenLine className="size-4" aria-hidden />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{display(draft)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <CardDescription className="flex-1 leading-snug">Completed Events</CardDescription>
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CheckCircle2 className="size-4" aria-hidden />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{display(completed)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <CardDescription className="flex-1 leading-snug">Cancelled Events</CardDescription>
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-red-600 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400">
              <XCircle className="size-4" aria-hidden />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">{display(cancelled)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MetricCards;
